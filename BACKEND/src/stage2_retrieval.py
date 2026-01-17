import sys
sys.path.append('.')



from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama
from config.settings import EMBEDDING_MODEL,DB_PATH
import chromadb  # CHANGED: Added chromadb import to use PersistentClient pattern


embedding_model=HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
# CHANGED: Use PersistentClient to avoid file lock issues and "File exists (os error 17)" error
chroma_client = chromadb.PersistentClient(path=DB_PATH)  # CHANGED: Create client first
vectortores= Chroma(
    client=chroma_client,  # CHANGED: Use client parameter instead of persist_directory
    collection_name="contracts_collection",  # CHANGED: Added explicit collection name for consistency
    embedding_function=embedding_model
)

llm=ChatOllama(  # CHANGED: Fixed typo from chatOllama to ChatOllama (case-sensitive)
    model="llama3.2:3b",
    temperature=0.6
)

print("✅ Ollama LLM connected!")
print("🚀 Ready for query optimization!")

#Queary rewriting 
print("Queary rewriting ")

def  rewrite_query(user_question,document_type='general'):
    """
        ANY document type → Smart rewriting
    """
    type_prompts={
        "contract": "Use formal legal/contract terminology",
        "medical": "Use medical terminology, lab values, diagnoses", 
        "code": "Use programming terms, functions, parameters",
        "recipe": "Use cooking terms, ingredients, steps",
        "general": "Use clear, detailed language"
    }
    
    context = type_prompts.get(document_type, type_prompts["general"])
    
    prompt = f"""Rewrite this question for document search.
        Context: {context}

        Original: {user_question}

        Detailed query:"""
    
    response = llm.invoke(prompt)
    return response.content.strip()
    
# ===== 2.2 HyDE (Hypothetical Document Embeddings) =====
print("\n🎭 2.2 HyDE - Fake Document Magic...")

def hyde_retrieve(user_question, k=5):
    """
    HyDE: Generate fake answer → Embed fake → Find real matches
    """
    # Step 1: Use LLM to generate "fake ideal answer"
    hyde_prompt = f"""Pretend you have perfect knowledge of the document.
Write a detailed answer to this question as if you found it in the document.

Question: {user_question}

Fake document answer (2-3 sentences):"""
    
    fake_answer = llm.invoke(hyde_prompt).content.strip()
    print(f"   🎭 Fake answer: {fake_answer[:80]}...")
    
    # Step 2: Embed the FAKE answer (not user question)
    fake_embedding = embedding_model.embed_query(fake_answer)
    
    # Step 3: Search database using fake embedding
    results = vectortores.similarity_search_by_vector(fake_embedding, k)  # CHANGED: Fixed typo vectorstore -> vectortores
    
    return results

print("✅ HyDE ready!")


# ===== 2.3 HYBRID SEARCH =====
print("\n🔍 2.3 Hybrid Search...")

from rank_bm25 import BM25Okapi
import nltk
nltk.download('punkt', quiet=True)

def hybrid_search(user_question, k=5):
    """
    Vector (meaning) + BM25 (keywords) = Perfect results
    """
    # 1. Vector search (semantic)
    vector_docs = vectortores.similarity_search(user_question, k=k*2)  # CHANGED: Fixed typo vectorstore -> vectortores
    
    # 2. BM25 keyword search
    # CHANGED: Get all documents from vectorstore properly - get() returns strings directly
    all_docs_data = vectortores.get()
    all_texts = all_docs_data['documents']  # These are already strings, not Document objects
    tokenized_docs = [nltk.word_tokenize(text.lower()) for text in all_texts]
    bm25 = BM25Okapi(tokenized_docs)
    
    query_tokens = nltk.word_tokenize(user_question.lower())
    bm25_scores = bm25.get_scores(query_tokens)
    
    # 3. Combine scores (Reciprocal Rank Fusion)
    doc_scores = {}
    for i, doc in enumerate(vector_docs):
        doc_id = hash(doc.page_content)  # Unique ID
        doc_scores[doc_id] = 1 / (k + i + 1)  # Vector score
    
    bm25_docs = sorted(enumerate(bm25_scores), key=lambda x: x[1], reverse=True)[:k*2]
    for rank, score in bm25_docs:
        doc_id = hash(all_texts[rank])
        doc_scores[doc_id] = doc_scores.get(doc_id, 0) + score
    
    # 4. Return top k combined
    top_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)[:k]
    return [vector_docs[hash(doc_id) % len(vector_docs)] for doc_id in [doc[0] for doc in top_docs]]

print("✅ Hybrid Search ready!")

    