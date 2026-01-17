#stage4 building the answer
import sys
sys.path.append('.')

# ===== STAGE 2 & 3 IMPORTS =====
# CHANGED: Import vectortores and llm from stage2_retrieval to reuse instances
from stage2_retrieval import rewrite_query, hyde_retrieve, hybrid_search, vectortores, llm  
from stage3_rerank import rerank_chunks  


from  langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama
from config.settings import DB_PATH,EMBEDDING_MODEL

# CHANGED: Reuse the vectorstore and llm from stage2_retrieval to avoid multiple ChromaDB instances
# This prevents "File exists (os error 17)" error caused by multiple connections
embedding_model=HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL )
vectorstore = vectortores  # CHANGED: Use the already initialized instance instead of creating new Chroma instance

# ===== ENHANCED FULL RAG =====
def full_rag_pipeline(question, doc_type="contract"):
    """
    ULTIMATE RAG: HyDE + Hybrid + Rerank!
    """
    print(f"\n🚀 ULTIMATE RAG PIPELINE:")
    print(f"Question: {question}")
    
    # 1. Smart rewrite
    rewritten = rewrite_query(question, doc_type)
    print(f"📝 Rewritten: {rewritten[:80]}...")
    
    # 2. HyDE retrieval (20 docs)
    hyde_chunks = hyde_retrieve(rewritten, k=10)
    print(f"🎭 HyDE retrieved: {len(hyde_chunks)} chunks")
    
    # 3. Hybrid search (20 docs)
    hybrid_chunks = hybrid_search(rewritten, k=10)
    print(f"🔍 Hybrid retrieved: {len(hybrid_chunks)} chunks")
    
    # 4. COMBINE both results (remove duplicates)
    all_chunks = hyde_chunks + hybrid_chunks
    unique_chunks = []
    seen = set()
    for chunk in all_chunks:
        content_hash = hash(chunk.page_content)
        if content_hash not in seen:
            seen.add(content_hash)
            unique_chunks.append(chunk)
    
    print(f"📦 Total unique chunks: {len(unique_chunks)}")
    
    # 5. Rerank combined results (top 5)
    top_chunks = rerank_chunks(rewritten, unique_chunks, top_k=5)
    print(f"⭐ Top 5 after reranking")
    
    # 6. Generate answer
    context = "\n\n".join([c.page_content for c in top_chunks])
    prompt = f"""Answer using ONLY this context. Be precise. Cite sections.

Context:
{context}

Question: {question}

Answer:"""
    
    answer = llm.invoke(prompt).content.strip()
    return answer

print("Full pipe line ready ")

if __name__ == "__main__":
    question = input("Ask about contract: ")
    answer = full_rag_pipeline(question)
    print(f"\n💬 {answer}")