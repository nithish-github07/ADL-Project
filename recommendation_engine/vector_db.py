from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
import os


class QdrantStorage:
    def __init__(self, url=os.getenv("QDRANT_URL"), collection="docs", dim=3072):
        cleaned_url = (url or "").strip()
        if not cleaned_url:
            raise ValueError("QDRANT_URL is not set or empty")

        if not cleaned_url.startswith("http://") and not cleaned_url.startswith("https://"):
            cleaned_url = f"http://{cleaned_url}"

        use_https = cleaned_url.startswith("https://")
        self.client = QdrantClient(
            url=cleaned_url,
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=30,
            https=use_https,
        )
        self.collection = collection
        if not self.client.collection_exists(self.collection):
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )

    def upsert(self, ids, vectors, payloads):
        points = [
            PointStruct(id=ids[i], vector=vectors[i], payload=payloads[i])
            for i in range(len(ids))
        ]
        self.client.upsert(self.collection, points=points)

    def search(self, query_vector, top_k: int = 5):
        # Using query_points instead of search as it's the more modern API
        # and search seems to be missing in the current environment's client
        results = self.client.query_points(
            collection_name=self.collection,
            query=query_vector,
            with_payload=True,
            limit=top_k,
        )

        contexts = []
        sources = set()
        for r in results.points:
            payload = getattr(r, "payload", None) or {}
            text = payload.get("text", "")
            source = payload.get("source", "")
            if text:
                contexts.append(text)
                sources.add(source)
        return {"contexts": contexts, "sources": list(sources)}
