from google import genai
from llama_index.readers.file import PDFReader
from llama_index.core.node_parser import SentenceSplitter
from dotenv import load_dotenv

load_dotenv()

client = genai.Client()
EMBED_MODEL='gemini-embedding-001'
EMBED_DIM=3072

splitter = SentenceSplitter(chunk_size=1000,chunk_overlap=200)

def load_and_chunk_pdf(path: str):
    docs = PDFReader().load_data(file=path)
    texts=[d.text for d in docs if getattr(d,'text',None)]
    chunks=[]
    for t in texts:
        chunks.extend(splitter.split_text(t))
    return chunks

def embed_texts(texts:list[str]) -> list[list[float]]:
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=texts,
    )
    return [items.values for items in response.embeddings]
