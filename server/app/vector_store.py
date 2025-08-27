# vector_store.py
import faiss
from typing import List, Dict
import numpy as np
import os
import pickle

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INDEX_FILE = os.path.join(ROOT_DIR, "vector_index.faiss")
TEXTS_FILE = os.path.join(ROOT_DIR, "vector_texts.pkl")


class ChatVectorStore:
    def __init__(
        self,
        dim: int = 384,
        index_path=INDEX_FILE,
        texts_path=TEXTS_FILE
    ):
        self.dim = dim
        self.index_path = index_path
        self.texts_path = texts_path

        # These will be loaded lazily
        self._model = None
        self._index = None
        self._texts = None

    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._model

    @property
    def index(self):
        if self._index is None:
            if os.path.exists(self.index_path):
                self._index = faiss.read_index(self.index_path)
            else:
                self._index = faiss.IndexFlatL2(self.dim)
        return self._index

    @property
    def texts(self):
        if self._texts is None:
            if os.path.exists(self.texts_path):
                with open(self.texts_path, "rb") as f:
                    self._texts = pickle.load(f)
            else:
                self._texts = {}
        return self._texts

    def add_texts(self, agent_id: int, texts: List[str]):
        if not texts:
            return
        embeddings = self.model.encode(texts)
        self.index.add(np.array(embeddings, dtype=np.float32))

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
        return [self.texts[agent_id][i] for i in indices[0] if i < len(self.texts[agent_id])]

    def _save(self):
        if self._index is not None:
            faiss.write_index(self._index, self.index_path)
        if self._texts is not None:
            with open(self.texts_path, "wb") as f:
                pickle.dump(self._texts, f)


# Singleton instance
vector_store = ChatVectorStore()
