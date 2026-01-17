# ===== STAGE 3: POST-RETRIEVAL FILTERING =====
import sys
sys.path.append('..')

from config.settings import DB_PATH, EMBEDDING_MODEL
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from FlagEmbedding import FlagReranker  # CHANGED: Fixed import from flag_embedding to FlagEmbedding (correct case)
import chromadb  # CHANGED: Added chromadb import for PersistentClient pattern

print("✅ Stage 3 imports ready!")

# CHANGED: Load Stage 2 database using PersistentClient to avoid file lock conflicts
embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
chroma_client = chromadb.PersistentClient(path=DB_PATH)  # CHANGED: Create PersistentClient instance
vectorstore = Chroma(
    client=chroma_client,  # CHANGED: Use client parameter instead of persist_directory
    collection_name="contracts_collection",  # CHANGED: Added explicit collection name matching stage2
    embedding_function=embedding_model
)

# Reranker (AI judge)
reranker = FlagReranker('BAAI/bge-reranker-base', use_fp16=False, device='cpu')

def rerank_chunks(query, candidate_chunks, top_k=5):
    """20 messy chunks → Top 5 perfect chunks"""
    print(f"   📊 Reranking {len(candidate_chunks)} chunks...")
    
    pairs = [[query, chunk.page_content] for chunk in candidate_chunks]
    scores = reranker.compute_score(pairs)
    
    # Sort by score
    scored = list(zip(candidate_chunks, scores))
    scored.sort(key=lambda x: x[1], reverse=True)
    
    top_chunks = [chunk for chunk, score in scored[:top_k]]
    print(f"   ✅ Top scores: {[round(s, 2) for s in scores[:3]]}...")
    
    return top_chunks

print("✅ Reranker ready!")
