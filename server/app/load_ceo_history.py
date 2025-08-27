# load_ceo_history.py
from vector_store import vector_store
import json
import os

# Path to your CEO chat history JSON
CEO_HISTORY_FILE = "ceo_history.json"

if not os.path.exists(CEO_HISTORY_FILE):
    raise FileNotFoundError(f"{CEO_HISTORY_FILE} not found. Please place your CEO history JSON in the project folder.")

# Load JSON
with open(CEO_HISTORY_FILE, "r", encoding="utf-8") as f:
    ceo_chats = json.load(f)

# Extract text field from each chat
global_texts = [chat["text"] for chat in ceo_chats]

# Add to vector store under 'global' key
vector_store.add_texts("global", global_texts)

print(f"✅ Added {len(global_texts)} CEO messages to global context in vector store.")
