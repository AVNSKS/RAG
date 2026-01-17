import os 
import sys
sys.path.append(".")

from config.settings import DATA_PATH, DB_PATH, EMBEDDING_MODEL, CHUNK_OVERLAP, CHUNK_SIZE

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import chromadb
import shutil


# ===== FUNCTION 1: BULK LOAD (Your original code) =====
def bulk_load_pdfs():
    """Load all PDFs from data folder and create fresh database"""
    
    print("📂 Loading PDFs from folder...")
    
    # Find PDFs
    pdf_files = [f for f in os.listdir(DATA_PATH) if f.endswith(".pdf")]
    if not pdf_files:
        print("❌ No PDF found! Check DATA_PATH")
        exit()
    
    pdf_path = os.path.join(DATA_PATH, pdf_files[0])
    print(f"📄 PDF loaded: {pdf_path}")
    
    # Load PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    print(f"✅ Extracted {len(documents)} pages")
    print(f"📊 Total characters: {sum(len(doc.page_content) for doc in documents):,}")
    
    # Chunking
    print("✂️ Chunking the data...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
    )
    
    chunks = text_splitter.split_documents(documents)
    print(f"✅ Created {len(chunks)} intelligent chunks")
    print(f"📊 Chunk sizes: {min(len(c.page_content) for c in chunks)} - {max(len(c.page_content) for c in chunks)} chars")
    
    # Embeddings
    print("🧠 Creating embeddings...")
    embedding_model = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={'device': 'cpu'}
    )
    
    print("✅ Embedding model loaded")
    print(f"📏 Each embedding = {embedding_model._client.get_sentence_embedding_dimension()} dimensions")
    
    # Save to database (clean first)
    print("💾 Saving to database...")
    
    if os.path.exists(DB_PATH):
        shutil.rmtree(DB_PATH)
        print("🧹 Past data cleaned")
    
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        client=chroma_client,
        collection_name="contracts_collection"
    )
    
    print(f"✅ DATABASE SAVED: {DB_PATH}")
    print(f"🔍 {len(chunks)} chunks indexed and searchable!")
    
    return len(chunks)


# ===== FUNCTION 2: SINGLE PDF UPLOAD (NEW!) =====
def ingest_single_pdf(pdf_path):
    """
    Add a single PDF to existing database (no cleanup)
    Used by /upload endpoint
    Returns: number of chunks added
    """
    print(f"\n📄 Processing uploaded PDF: {pdf_path}")
    
    # Load PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    print(f"✅ Loaded {len(documents)} pages")
    
    # Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
    )
    chunks = text_splitter.split_documents(documents)
    print(f"✂️ Split into {len(chunks)} chunks")
    
    # Connect to EXISTING database
    embedding_model = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={'device': 'cpu'}
    )
    
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    
    # Get existing collection (don't create new one)
    collection = chroma_client.get_or_create_collection(
        name="contracts_collection",
        metadata={"hnsw:space": "cosine"}
    )
    
    # Add chunks to existing collection
    vectorstore = Chroma(
        client=chroma_client,
        collection_name="contracts_collection",
        embedding_function=embedding_model
    )
    
    vectorstore.add_documents(chunks)
    
    print(f"✅ Added {len(chunks)} chunks to database")
    print(f"📦 Total chunks in DB: {collection.count()}")
    
    return len(chunks)


# ===== FUNCTION 3: CLEAR DATABASE =====
def clear_database():
    """
    Delete entire vector database
    Used when you want fresh start or before uploading new file
    """
    print("\n🧹 Clearing vector database...")
    
    if os.path.exists(DB_PATH):
        shutil.rmtree(DB_PATH)
        print("✅ Database cleared successfully")
    else:
        print("⚠️ Database doesn't exist")
    
    # Recreate empty database
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    chroma_client.get_or_create_collection(
        name="contracts_collection",
        metadata={"hnsw:space": "cosine"}
    )
    print("📦 Empty database created")


# ===== FUNCTION 4: DATABASE STATS =====
def get_database_stats():
    """
    Get information about current database
    Returns: dict with stats
    """
    try:
        if not os.path.exists(DB_PATH):
            return {
                "exists": False,
                "total_chunks": 0,
                "collections": []
            }
        
        chroma_client = chromadb.PersistentClient(path=DB_PATH)
        collections = chroma_client.list_collections()
        
        stats = {
            "exists": True,
            "db_path": DB_PATH,
            "collections": []
        }
        
        total_chunks = 0
        for col in collections:
            count = col.count()
            total_chunks += count
            stats["collections"].append({
                "name": col.name,
                "chunks": count
            })
        
        stats["total_chunks"] = total_chunks
        
        return stats
    
    except Exception as e:
        return {
            "error": str(e),
            "exists": False
        }


# ===== MAIN: Run bulk load when script executed directly =====
if __name__ == "__main__":
    print("="*60)
    print("🚀 BULK PDF INGESTION")
    print("="*60)
    bulk_load_pdfs()
