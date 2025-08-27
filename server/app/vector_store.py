# vector_store.py
import faiss
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import pickle


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INDEX_FILE = os.path.join(ROOT_DIR, "vector_index.faiss")
TEXTS_FILE = os.path.join(ROOT_DIR, "vector_texts.pkl")

class ChatVectorStore:
    def __init__(
        self,
        dim: int = 384,
        # index_path: str = "vector_index.faiss",
        # texts_path: str = "vector_texts.pkl"
        index_path=INDEX_FILE, 
        texts_path=TEXTS_FILE
    ):
        self.dim = dim
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index_path = index_path
        self.texts_path = texts_path

        # Load existing index if available, else create a new one
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
        else:
            self.index = faiss.IndexFlatL2(dim)

        # Load saved texts (now as a dict keyed by agent_id)
        if os.path.exists(self.texts_path):
            with open(self.texts_path, "rb") as f:
                self.texts: Dict[int, List[str]] = pickle.load(f)
        else:
            self.texts: Dict[int, List[str]] = {}

    def add_texts(self, agent_id: int, texts: List[str]):
        if not texts:
            return
        embeddings = self.model.encode(texts)
        self.index.add(np.array(embeddings, dtype=np.float32))

        # Initialize agent list if not present
        if agent_id not in self.texts:
            self.texts[agent_id] = []
        self.texts[agent_id].extend(texts)
        self._save()

    def get_texts(self, agent_id: int) -> List[str]:
        return self.texts.get(agent_id, []).copy()

    def query(self, agent_id: int, query: str, top_k: int = 5) -> List[str]:
        if agent_id not in self.texts or len(self.texts[agent_id]) == 0:
            return []
        query_emb = self.model.encode([query])
        distances, indices = self.index.search(np.array(query_emb, dtype=np.float32), top_k)
        # Ensure we only return texts for this agent
        return [self.texts[agent_id][i] for i in indices[0] if i < len(self.texts[agent_id])]

    def _save(self):
        # Save index
        faiss.write_index(self.index, self.index_path)
        # Save texts
        with open(self.texts_path, "wb") as f:
            pickle.dump(self.texts, f)

# Singleton instance
vector_store = ChatVectorStore()
