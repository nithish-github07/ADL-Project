import logging as log
from typing import Any, List, cast
from fastapi import FastAPI
import inngest
import inngest.fast_api
from groq import Groq
from groq.types.chat import ChatCompletionMessageParam
from dotenv import load_dotenv
import uuid
import os
from data_loader import load_and_chunk_pdf,embed_texts
from vector_db import QdrantStorage
from custom_types import RAGUpsertResult,RAGSearchResult,RAGChunkAndSrc,RAGQueryResult

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

inngest_client=inngest.Inngest(
    app_id='rag_app',
    logger=log.getLogger('uvicorn'),
    is_production=False,
    serializer=inngest.PydanticSerializer()
)
@inngest_client.create_function(
    fn_id='RAG: Ingest PDF',
    trigger=inngest.TriggerEvent(event="rag/ingest_pdf"),
)
async def ingest_pdf(ctx: inngest.Context):
    def _load(ctx: inngest.Context)->RAGChunkAndSrc:
        pdf_path=ctx.event.data['pdf_path']
        source_id=ctx.event.data.get('source_id',pdf_path)
        chunks=load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunks=chunks,source_id=source_id)
    def _upsert(chunks_and_src: RAGChunkAndSrc)->RAGUpsertResult:
        chunks=chunks_and_src.chunks
        source_id=chunks_and_src.source_id
        vecs = embed_texts(chunks)
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL,f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads=[{'source':source_id,'text':chunks[i]} for i in range(len(chunks))]
        QdrantStorage().upsert(ids,vecs,payloads)
        return RAGUpsertResult(ingested=len(chunks))


    chunks_and_src = await ctx.step.run("load-and-chunk",lambda: _load(ctx),output_type=RAGChunkAndSrc)
    ingested = await ctx.step.run("embed-and-upsert",lambda: _upsert(chunks_and_src),output_type=RAGUpsertResult)
    return ingested.model_dump()

@inngest_client.create_function(
    fn_id="RAG: Query PDF",
    trigger=inngest.TriggerEvent(event="rag/query_pdf_ai")
)
async def rag_query_pdf(ctx: inngest.Context):
    def _search(question:str,top_k:int =5):
        query_vec = embed_texts([question])[0]
        store = QdrantStorage()

        found = store.client.query_points(
            collection_name=store.collection,
            with_payload=True,
            query=query_vec,
            limit=top_k
        )

        contexts = []
        sources = []

        for point in found.points:
            text = (point.payload.get("text") or "").strip()
            if not text:
                continue
            contexts.append(text)
            source = point.payload.get("source") or "Unknown"
            sources.append(source)

        return RAGSearchResult(contexts=contexts, sources=sources)
    question = ctx.event.data['question']
    top_k = ctx.event.data.get('top_k',5)
    career_choice = ctx.event.data.get('career_choice', 'the career you provided')

    found = await ctx.step.run('embed-and-search',lambda : _search(question,top_k),output_type=RAGSearchResult)
    context_block = "\n\n".join(f"- {c}" for c in found.contexts)
    user_content=(
        'Use the context below together with the user\'s career choice to craft the answer.\n\n'
        f'Career choice: {career_choice}\n\n'
        f'Context:\n{context_block}\n\n'
        f'Question: {question}\n'
        'Deliver a roadmap that maps 10 levels of progression, assigning relevant skills at each level and keeping the response strictly grounded in the provided context.'
    )
    raw_messages= [
        {'role': 'system', 'content': 'You respond only with material derived from the supplied context and follow the user instructions exactly.'},
        {'role': 'user', 'content': user_content}
    ]
    messages = cast(List[ChatCompletionMessageParam], cast(Any,raw_messages))
    async def get_groq_answer():
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.2,
        )
        return completion.model_dump()
    result = await ctx.step.run(
        'llm-answer',
        get_groq_answer,
    )
    answer = result['choices'][0]['message']['content'].strip()
    rag_response = RAGQueryResult(answer=answer, sources=found.sources, num_contexts=len(found.contexts))
    return rag_response.model_dump()
app = FastAPI()


inngest.fast_api.serve(app,inngest_client,[ingest_pdf,rag_query_pdf])
