"""
Project settings - easy to change
"""

# Paths
DATA_PATH = "data/contracts/"
DB_PATH = "db/chroma_db/"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# Embeddings
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Retrieval settings
TOP_K = 5  # Return top 5 chunks per query

print("✅ Config loaded!")
