import logging as log
from typing import Any, List, cast
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import inngest
import inngest.fast_api
from groq import Groq
from groq.types.chat import ChatCompletionMessageParam
from dotenv import load_dotenv
import uuid
import os
import asyncio
import json
import re
import requests
from pathlib import Path
from data_loader import load_and_chunk_pdf, embed_texts
from vector_db import QdrantStorage
from custom_types import (
    RAGUpsertResult,
    RAGSearchResult,
    RAGChunkAndSrc,
    RAGQueryResult,
    LearningPathRequest,
    LearningPathResponse,
    LearningPathModule,
    LearningPathResource,
)

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

logger = log.getLogger("uvicorn")

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

inngest_client = inngest.Inngest(
    app_id="rag_app",
    logger=log.getLogger("uvicorn"),
    is_production=False,
    serializer=inngest.PydanticSerializer(),
)


@inngest_client.create_function(
    fn_id="RAG: Ingest PDF",
    trigger=inngest.TriggerEvent(event="rag/ingest_pdf"),
)
async def ingest_pdf(ctx: inngest.Context):
    def _load(ctx: inngest.Context) -> RAGChunkAndSrc:
        pdf_path = ctx.event.data["pdf_path"]
        source_id = ctx.event.data.get("source_id", pdf_path)
        chunks = load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunks=chunks, source_id=source_id)

    def _upsert(chunks_and_src: RAGChunkAndSrc) -> RAGUpsertResult:
        chunks = chunks_and_src.chunks
        source_id = chunks_and_src.source_id
        vecs = embed_texts(chunks)
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads = [{"source": source_id, "text": chunks[i]} for i in range(len(chunks))]
        QdrantStorage().upsert(ids, vecs, payloads)
        return RAGUpsertResult(ingested=len(chunks))

    chunks_and_src = await ctx.step.run(
        "load-and-chunk", lambda: _load(ctx), output_type=RAGChunkAndSrc
    )
    ingested = await ctx.step.run(
        "embed-and-upsert", lambda: _upsert(chunks_and_src), output_type=RAGUpsertResult
    )
    return ingested.model_dump()


@inngest_client.create_function(
    fn_id="RAG: Query PDF",
    trigger=inngest.TriggerEvent(event="rag/query_pdf_ai"),
)
async def rag_query_pdf(ctx: inngest.Context):
    def _search(question: str, top_k: int = 5):
        query_vec = embed_texts([question])[0]
        store = QdrantStorage()

        found = store.client.query_points(
            collection_name=store.collection,
            with_payload=True,
            query=query_vec,
            limit=top_k,
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

    question = ctx.event.data["question"]
    top_k = ctx.event.data.get("top_k", 5)
    career_choice = ctx.event.data.get("career_choice", "the career you provided")

    found = await ctx.step.run(
        "embed-and-search", lambda: _search(question, top_k), output_type=RAGSearchResult
    )
    context_block = "\n\n".join(f"- {c}" for c in found.contexts)
    user_content = (
        "Use the context below together with the user's career choice to craft the answer.\n\n"
        f"Career choice: {career_choice}\n\n"
        f"Context:\n{context_block}\n\n"
        f"Question: {question}\n"
        "Deliver a roadmap that maps 10 levels of progression, assigning relevant skills at each level and keeping the response strictly grounded in the provided context."
    )
    raw_messages = [
        {
            "role": "system",
            "content": "You respond only with material derived from the supplied context and follow the user instructions exactly.",
        },
        {"role": "user", "content": user_content},
    ]
    messages = cast(List[ChatCompletionMessageParam], cast(Any, raw_messages))

    async def get_groq_answer():
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.2,
        )
        return completion.model_dump()

    result = await ctx.step.run("llm-answer", get_groq_answer)
    answer = result["choices"][0]["message"]["content"].strip()
    rag_response = RAGQueryResult(
        answer=answer, sources=found.sources, num_contexts=len(found.contexts)
    )
    return rag_response.model_dump()


app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    logger.error(f"Validation error for {request.url}: {exc.errors()}")
    logger.error(f"Request body: {body.decode()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body.decode()},
    )


@app.post("/api/learning-paths/generate", response_model=LearningPathResponse)
async def generate_learning_path(payload: LearningPathRequest):
    logger.info(f"Received learning path generation request for role: {payload.targetJobRole}")
    if not os.getenv("GROQ_API_KEY"):
        return _fallback_learning_path(payload)

    question = _build_learning_path_question(payload)
    contexts, sources = _collect_rag_context(question)
    context_block = "\n\n".join(f"- {c}" for c in contexts)

    user_content = (
        "Use the context below together with the user details to craft the learning path. "
        "Respond with JSON only.\n\n"
        f"Context:\n{context_block}\n\n"
        f"Question:\n{question}"
    )

    raw_messages = [
        {
            "role": "system",
            "content": (
                "You output ONLY a single valid JSON object that matches the schema exactly. "
                "No markdown, no prose, no trailing text. "
                "Use double quotes for all JSON keys and string values. "
                "Do not add extra keys. "
                "Always set every url field to an empty string."
            ),
        },
        {"role": "user", "content": user_content},
    ]
    messages = cast(List[ChatCompletionMessageParam], cast(Any, raw_messages))

    try:
        answer = await _call_groq(messages)
    except Exception as exc:
        logger.error("Groq request failed: %s", exc)
        return _fallback_learning_path(payload)

    parsed = _extract_json(answer)
    if not parsed:
        return _fallback_learning_path(payload)

    modules_raw = parsed.get("modules") if isinstance(parsed, dict) else []
    if not isinstance(modules_raw, list):
        return _fallback_learning_path(payload)

    modules = _normalize_modules(modules_raw)
    if not modules:
        return _fallback_learning_path(payload)

    modules = await _enrich_modules_with_tavily(modules, payload.targetJobRole or "")

    try:
        return LearningPathResponse(
            title=str(parsed.get("title") or "Learning Path"),
            description=str(parsed.get("description") or ""),
            modules=modules,
            estimatedDuration=int(parsed.get("estimatedDuration") or payload.timeline),
            sources=sources,
        )
    except Exception:
        return _fallback_learning_path(payload)


def _build_learning_path_question(payload: LearningPathRequest) -> str:
    target_role = payload.targetJobRole or "the chosen role"
    target_sector = payload.targetSector or ""
    sector_line = f"Target sector: {target_sector}\n" if target_sector else ""

    return (
        "Create a structured learning path grounded in the provided context. "
        "Return ONLY a valid JSON object (no markdown, no prose). "
        "Use double quotes for all JSON keys and string values. "
        "Do not include any keys beyond those specified. "
        "Schema: {"
        '"title": string, '
        '"description": string, '
        '"estimatedDuration": integer (days), '
        '"modules": [ '
        "{"
        '"moduleId": string, '
        '"title": string, '
        '"description": string, '
        '"duration": integer (days), '
        '"resources": [ {"type": string, "title": string, "url": string} ] '
        "} ]"
        " }. "
        "modules must have 6-10 items. "
        "Always set every url field to an empty string. "
        "estimatedDuration must be the total timeline in days.\n\n"
        f"Target role: {target_role}\n"
        f"Current level: {payload.currentLevel}\n"
        f"Target level: {payload.targetLevel}\n"
        f"Qualification: {payload.qualification or 'not specified'}\n"
        f"Engagement status: {payload.engagementStatus or 'not specified'}\n"
        f"Hours per week: {payload.hoursPerWeek or 'not specified'}\n"
        f"Preferred mode: {payload.preferredMode or 'not specified'}\n"
        f"Learning preferences: {payload.learningPreferences or 'not specified'}\n"
        f"Preferred languages: {', '.join(map(str, payload.preferredLanguages)) if payload.preferredLanguages else 'not specified'}\n"
        f"Timeline (days): {payload.timeline}\n"
        f"Technical skills: {', '.join(map(str, payload.technicalSkills)) if payload.technicalSkills else 'not specified'}\n"
        f"Soft skills: {', '.join(map(str, payload.softSkills)) if payload.softSkills else 'not specified'}\n"
        f"Work experience: {json.dumps(payload.workExperience) if payload.workExperience else 'not specified'}\n"
        f"Certifications: {json.dumps(payload.certifications) if payload.certifications else 'not specified'}\n"
        f"{sector_line}"
    )


def _extract_json(text: str) -> dict | None:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _normalize_modules(raw_modules: list[dict]) -> list[LearningPathModule]:
    modules: list[LearningPathModule] = []
    for index, module in enumerate(raw_modules):
        resources_raw = module.get("resources", []) if isinstance(module, dict) else []
        resources: list[LearningPathResource] = []
        
        # Handle stringified resources
        if isinstance(resources_raw, str):
            try:
                # Try to parse as JSON array
                resources_raw = json.loads(resources_raw)
            except:
                # If not JSON, maybe it's a comma separated list?
                if "," in resources_raw:
                    resources_raw = [{"title": r.strip(), "url": ""} for r in resources_raw.split(",")]
                else:
                    resources_raw = [{"title": resources_raw, "url": ""}]

        if isinstance(resources_raw, list):
            for resource in resources_raw:
                if isinstance(resource, str):
                    resources.append(
                        LearningPathResource(
                            type="link",
                            title=resource,
                            url=""
                        )
                    )
                elif isinstance(resource, dict):
                    resources.append(
                        LearningPathResource(
                            type=str(resource.get("type") or resource.get("resourceType") or "link"),
                            title=str(resource.get("title") or resource.get("name") or "Resource"),
                            url=str(resource.get("url") or resource.get("link") or ""),
                        )
                    )

        module_id = None
        if isinstance(module, dict):
            module_id = module.get("moduleId") or module.get("id") or module.get("slug")

        modules.append(
            LearningPathModule(
                moduleId=str(module_id or f"module-{index + 1}"),
                title=str(module.get("title") or f"Module {index + 1}"),
                description=str(module.get("description") or ""),
                duration=int(module.get("duration") or module.get("hours") or 0),
                resources=resources,
            )
        )

    return modules


def _tavily_search(query: str, max_results: int = 5) -> list[dict]:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return []

    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": max_results,
                "include_answer": False,
                "include_images": False,
            },
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        logger.warning("Tavily search failed: %s", exc)
        return []

    results = data.get("results", [])
    return results if isinstance(results, list) else []


def _score_tavily_result(title: str, url: str, query_title: str) -> int:
    title_l = title.lower()
    url_l = url.lower()
    tokens = [t for t in re.split(r"\W+", query_title.lower()) if t]
    if not tokens:
        return 0
    score = 0
    for token in tokens:
        if token in title_l:
            score += 3
        if token in url_l:
            score += 1
    return score


def _pick_best_tavily_url(results: list[dict], query_title: str) -> str:
    best_url = ""
    best_score = 0
    for result in results:
        if not isinstance(result, dict):
            continue
        title = str(result.get("title") or "")
        url = str(result.get("url") or "")
        if not url.startswith("http"):
            continue
        score = _score_tavily_result(title, url, query_title)
        if score > best_score:
            best_score = score
            best_url = url
    return best_url


def _build_tavily_query(
    resource_title: str, module_title: str, target_role: str
) -> str:
    parts = [resource_title, module_title, target_role, "course"]
    return " ".join(p for p in parts if p)


async def _enrich_modules_with_tavily(
    modules: list[LearningPathModule], target_role: str
) -> list[LearningPathModule]:
    if not os.getenv("TAVILY_API_KEY"):
        return modules

    tasks = []
    resource_refs = []

    for module in modules:
        for resource in module.resources:
            if not (resource.url and resource.url.startswith("http")):
                query = _build_tavily_query(resource.title, module.title, target_role)
                tasks.append(asyncio.to_thread(_tavily_search, query))
                resource_refs.append((resource, resource.title))

    if not tasks:
        return modules

    logger.info(f"Enriching {len(tasks)} resources with Tavily...")
    search_results = await asyncio.gather(*tasks)

    for i, results in enumerate(search_results):
        resource, title = resource_refs[i]
        url = _pick_best_tavily_url(results, title)
        if url:
            resource.url = url

    return modules


def _fallback_learning_path(payload: LearningPathRequest) -> LearningPathResponse:
    target_role = payload.targetJobRole or "Target Role"
    modules = []
    module_titles = [
        "Foundations and Orientation",
        "Core Concepts",
        "Tools and Environment",
        "Applied Practice",
        "Project and Portfolio",
        "Interview and Career Prep",
    ]

    for index, title in enumerate(module_titles):
        modules.append(
            LearningPathModule(
                moduleId=f"module-{index + 1}",
                title=title,
                description=f"Skills and activities for {title.lower()} in {target_role}.",
                duration=max(4, int((payload.timeline / len(module_titles)) // 1)),
                resources=[],
            )
        )

    return LearningPathResponse(
        title=f"{target_role} Learning Path",
        description=f"A structured learning path to move from {payload.currentLevel} to {payload.targetLevel}.",
        modules=modules,
        estimatedDuration=int(payload.timeline),
        sources=[],
    )


def _collect_rag_context(question: str, top_k: int = 5) -> tuple[list[str], list[str]]:
    qdrant_url = os.getenv("QDRANT_URL")
    if not qdrant_url:
        logger.warning("RAG context unavailable: QDRANT_URL is not set")
        return [], []

    cleaned_question = (question or "").strip()
    if not cleaned_question:
        return [], []

    try:
        query_vec = embed_texts([cleaned_question])[0]
        store = QdrantStorage(url=qdrant_url)
        results = store.search(query_vec, top_k=max(1, int(top_k)))
        contexts = results.get("contexts", [])
        sources = results.get("sources", [])
        return contexts, sources
    except Exception as exc:
        logger.warning("RAG context unavailable: %s", exc)
        return [], []


async def _call_groq(messages: list[ChatCompletionMessageParam]) -> str:
    def _run():
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1200,
            temperature=0.2,
        )
        return completion.model_dump()

    result = await asyncio.to_thread(_run)
    return result["choices"][0]["message"]["content"].strip()




inngest.fast_api.serve(app, inngest_client, [ingest_pdf, rag_query_pdf])
