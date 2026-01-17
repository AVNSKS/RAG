A **production-grade Retrieval Augmented Generation (RAG)** system for PDF question-answering, built with a **Flask** backend, **Ollama (Llama 3.2 3B)**, **ChromaDB** vector store, **HuggingFace** embeddings, and a **React + Vite** frontend chat UI with premium design.

This project is designed to be used as:

* A **portfolio / interview project** showing end‑to‑end system design.
* A **real, local knowledge assistant** for PDFs (contracts, quizzes, notes, etc.).
* A **template** for more advanced enterprise RAG systems.

---

## Table of Contents

1. [High-Level Overview](https://www.google.com/search?q=%231-high-level-overview)
2. [Tech Stack & Design Decisions](https://www.google.com/search?q=%232-tech-stack--design-decisions)
3. [Project Structure](https://www.google.com/search?q=%233-project-structure)
4. [Features (Backend)](https://www.google.com/search?q=%234-features-backend)
5. [Features (Frontend)](https://www.google.com/search?q=%235-features-frontend)
6. [Configuration](https://www.google.com/search?q=%236-configuration)
7. [How to Clone and Run](https://www.google.com/search?q=%237-how-to-clone-and-run)
8. [Git Configuration](https://www.google.com/search?q=%238-git-configuration)
9. [API Usage Examples](https://www.google.com/search?q=%239-api-usage-examples)
10. [Architecture Diagram (Conceptual)](https://www.google.com/search?q=%2310-architecture-diagram-conceptual)
11. [Architecture Decisions & Interview Talking Points](https://www.google.com/search?q=%2311-architecture-decisions--interview-talking-points)
12. [Possible Extensions & Future Work](https://www.google.com/search?q=%2312-possible-extensions--future-work)
13. [Summary of What This Project Demonstrates](https://www.google.com/search?q=%2313-summary-of-what-this-project-demonstrates)
14. [Quick Reference](https://www.google.com/search?q=%2314-quick-reference)

---

## 1. High-Level Overview

### What This Project Does

* Ingests PDFs (bulk or upload at runtime) and **converts them into vectorized chunks** stored in **ChromaDB**.
* Uses a **multi-stage retrieval pipeline**:
* Query rewrite (temperature: 0.6 for better creativity)
* HyDE (Hypothetical Document Embeddings)
* Hybrid search (semantic + BM25)
* Cross-encoder reranking


* Generates **grounded answers with citations** using a **local LLM via Ollama**.
* Exposes a **REST API (Flask)** with file management and database operations.
* Features a **premium React chat UI** with "GPT-5.1-Codex-Max" branding.
* Supports **complete CRUD operations** for document management (Create, Read, Update, Delete).

### Why It Is Advanced

* Uses many **"production RAG" best practices**:
* Chunking with overlap for context preservation.
* Query rewriting with optimized temperature (0.6) for balanced creativity and accuracy.
* HyDE for robust retrieval on vague user questions.
* Hybrid search to combine meaning (vectors) and exact keywords (BM25).
* Cross-encoder reranker to pick the **most relevant top‑k** chunks.
* Persistent vector store (ChromaDB) for incremental indexing.


* Clean **separation of stages** (ingestion, retrieval, rerank, answer).
* **Auto‑managed LLM runtime** (Ollama manager).
* **Complete file lifecycle management**: upload, list, delete.
* **Database management features**: clear database, get stats.
* **Frontend + backend** structured for real deployment.
* **No file size limits** for uploads (removed 16MB restriction).

---

## 2. Tech Stack & Design Decisions

### Backend

* **Flask**: Lightweight, familiar, and perfect for well-defined JSON APIs.
* **Flask-CORS**: Allows the React frontend (Vite dev server) to talk to the backend safely.
* **Ollama (Llama 3.2 3B)**:
* Runs fully **local** – privacy‑friendly and free of per‑token costs.
* 3B model is a good balance of speed and quality on typical hardware.


* **ChromaDB**:
* Simple to embed, persistent on disk, and optimized for RAG use cases.
* Supports database reset and collection management.


* **HuggingFace sentence-transformers/all-MiniLM-L6-v2**:
* Extremely **fast** and **lightweight**, ideal for interactive workloads.
* Good semantic performance for document retrieval.


* **LangChain tools**:
* `PyPDFLoader`: robust PDF parsing.
* `RecursiveCharacterSplitter`: consistent chunking with overlap.
* `langgraph>=1.0.2`: Updated for compatibility.



### Frontend

* **React + Vite**:
* Vite provides **fast dev server** and simple bundling.
* React gives a flexible way to build chat UI and upload flows.


* **Axios**: Clean HTTP client abstraction for API calls.
* **React Icons**: Quick, lightweight icons for UI polish.
* **Premium UI**: "GPT-5.1-Codex-Max" branding with modern design.

### RAG Pipeline Design

* **Chunk size**: 500 characters
* **Overlap**: 50 characters
→ Enough to preserve paragraph context while keeping each chunk manageable.
* **Retrieval strategy**:
1. **Query Rewrite** (temp: 0.6) – make user question clearer with creative expansion.
2. **HyDE** – generate a hypothetical answer and embed it for retrieval.
3. **Hybrid Search** – combine **vector similarity** and **BM25** keyword search.
4. **Rerank** – cross‑encoder scoring to pick **top 5** chunks with scores ≥ 0.85.



This shows knowledge of advanced RAG techniques and their **practical benefits** (accuracy, robustness on messy user input).

---

## 3. Project Structure

Project root (monorepo style):

```text
rag_project/
├── BACKEND/
│   ├── src/
│   │   ├── stage1_ingestion.py      # PDF loading + chunking + indexing
│   │   ├── stage2_retrieval.py      # Query rewrite + HyDE + hybrid search (temp: 0.6)
│   │   ├── stage3_rerank.py         # Cross-encoder reranking
│   │   ├── stage4_answer.py         # Full RAG pipeline
│   │   ├── backend.py               # Flask API (8 endpoints, no size limit)
│   │   └── ollama_manager.py        # Auto-start/stop Ollama
│   │
│   ├── config/
│   │   └── settings.py              # Central configuration
│   │
│   ├── data/
│   │   ├── contracts/               # Initial PDFs
│   │   └── uploads/                 # Runtime uploads
│   │
│   ├── chromadb/                    # Vector store (gitignored)
│   ├── clean_rag/                   # Virtual environment (gitignored)
│   │
│   ├── start.sh                     # STARTUP SCRIPT - USE THIS!
│   ├── START_GUIDE.md               # Startup instructions
│   ├── requirements.txt             # Python dependencies
│   └── .gitignore                   # Ignores venv, db, uploads, cache
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   └── PremiumRAG.jsx       # Main chat UI (connected to backend)
    │   └── services/
    │       └── api.js               # API layer (8 functions)
    ├── vite.config.js
    ├── package.json
    ├── .gitignore                   # Ignores node_modules, dist, env, coverage
    └── index.html

```

---

## 4. Features (Backend)

### RAG Stages

#### Stage 1 – Data Ingestion (`stage1_ingestion.py`)

* Bulk loads all PDFs from `data/contracts/`.
* Supports single PDF upload at runtime (`/upload` endpoint).
* Splits text into chunks (size 500, overlap 50).
* Creates embeddings using `all-MiniLM-L6-v2`.
* Stores chunks in **ChromaDB** with metadata.

#### Stage 2 – Smart Retrieval (`stage2_retrieval.py`)

* **Query rewrite**: LLM with temperature 0.6 (balanced creativity).
* **HyDE**: LLM generates a hypothetical answer; that text is embedded and used for retrieval.
* **Hybrid search**:
* Semantic (vector) search in ChromaDB.
* BM25 / keyword-based search for exact matches.


* Returns ~20 candidate chunks with scores and metadata.

#### Stage 3 – Reranking (`stage3_rerank.py`)

* Takes candidate chunks and runs them through a **cross‑encoder** model.
* Computes relevance scores and sorts them.
* Keeps **top 5** chunks (e.g., score ≥ 0.85).

#### Stage 4 – Answer Generation (`stage4_answer.py`)

* Combines rewritten query, HyDE output, and top reranked chunks.
* Prompts the LLM to answer **only from provided context** with **citations**.
* Returns **answer** and **sources** (chunks/files/pages used).

### Flask API Endpoints

Backend (default): `http://localhost:5001`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | API documentation / health check |
| GET | `/ask?question=...` | Simple Q&A (URL param) |
| POST | `/query` | Advanced Q&A with sources (JSON body) |
| POST | `/upload` | Upload PDF (no size limit) |
| GET | `/files` | List all indexed PDFs |
| DELETE | `/files/<filename>` | Delete specific PDF file |
| POST | `/clear` | Clear entire ChromaDB database |
| GET | `/stats` | Get database statistics |

### File Management Features

**Delete Uploaded Documents**

* The system supports **complete file deletion** from both the UI and server.
* Backend endpoint: `DELETE /files/<filename>`
* Deletes PDF files from `data/contracts/` folder.
* Validates file type (only `.pdf` allowed).
* Returns **404** if file doesn't exist.
* Returns **200** with success message on deletion.

**Example:**

```bash
curl -X DELETE http://localhost:5001/files/document.pdf

```

**Response:**

```json
{  "message": "File 'document.pdf' deleted successfully"}

```

---

## 5. Features (Frontend)

Frontend (Vite dev server): `http://localhost:3000`

### Core UI (`PremiumRAG.jsx`)

* **Premium branding**: "GPT-5.1-Codex-Max" status displayed in sidebar.
* **FileUpload component**:
* Drag‑and‑drop or click to upload PDFs.
* Connected to real backend `/upload` endpoint.
* Restricts to `.pdf` for consistency.
* Shows upload status messages.


* **FileList component**:
* Shows list of all uploaded/known documents (from `/files`).
* Real-time updates after upload.
* **Delete button**: Appears on hover over each file.
* **Red trash icon**: Click to delete file from server.
* **Auto-refresh**: File list updates immediately after deletion.
* **Error handling**: Shows alert if deletion fails.


* **ChatInterface component**:
* Chat style message area (user + assistant + error states).
* Input box with send button.
* Real-time question answering via backend `/query`.
* Typing indicator when waiting for backend.
* Shows **sources** for each answer (files and scores).



### Enhanced File Management

* **Upload**: Drag-and-drop or click to upload PDFs.
* **List**: View all uploaded documents with real-time updates.
* **Delete**:
* Hover over any file to reveal delete button.
* Click red trash icon to remove file.
* Permanent deletion from both UI and server storage.
* Automatic file list refresh after deletion.
* Error alerts for failed deletions.



### Frontend–Backend Integration

API service (`api.js`) includes **8 functions**:

* `askQuestion(question)` - POST query
* `uploadFile(file)` - Upload PDF
* `getFiles()` - List files
* `deleteFile(filename)` - Delete file
* `clearDatabase()` - Clear ChromaDB
* `getDatabaseStats()` - Get stats
* `healthCheck()` - Check API status
* `testConnection()` - Test backend connection
* Vite proxy forwards `/api/...` to `http://localhost:5001`.

### User Experience Flow

```text
Upload Flow:
User drags PDF → Uploads to /upload → File appears in sidebar

Delete Flow:
User hovers file → Trash icon appears → Click → DELETE /files/<name> → File removed from disk → UI refreshes → File disappears

Query Flow:
User types question → POST /query → Backend runs RAG pipeline → Answer + sources displayed in chat

```

---

## 6. Configuration

All important settings are in `config/settings.py`:

```python
DATA_PATH = "data/contracts"
DB_PATH = "chromadb"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

```

**Key configuration changes:**

* Temperature in `stage2_retrieval.py` set to **0.6** (more creative query rewrites).
* No upload size limit in `backend.py` (removed `MAX_CONTENT_LENGTH`).

---

## 7. How to Clone and Run

### 7.1. Clone the Repository

```bash
git clone <your-git-url> rag_project
cd rag_project/BACKEND

```

### 7.2. Backend Setup (Python)

⚠️ **IMPORTANT: Always use `./start.sh` to run the backend!**

**Create virtual environment (one-time setup)**

```bash
# Create virtual environment named 'clean_rag'
python -m venv clean_rag
# Activate it
source clean_rag/bin/activate  # Mac/Linux
# clean_rag\Scripts\activate    # Windows

```

**Install dependencies**

```bash
pip install -r requirements.txt

```

Updated `requirements.txt` includes:

* `requests==2.31.0` (for `ollama_manager.py`)
* `langgraph>=1.0.2` (fixed version conflict)
* `flask==3.0.0`
* `flask-cors==4.0.0`
* `langchain==0.1.0`
* `langchain-community==0.0.13`
* `chromadb==0.4.22`
* `sentence-transformers==2.3.1`
* `pypdf==3.17.4`

**Install and pull Ollama model (done once)**

1. Install Ollama from official website.
2. Pull the model:

```bash
ollama pull llama3.2:3b

```

**Initial data ingestion (optional but recommended)**
Place your initial PDFs into `data/contracts/` and run:

```bash
python src/stage1_ingestion.py

```

**Run backend using startup script**

```bash
chmod +x start.sh  # Make executable (one-time)
./start.sh

```

**Why use `start.sh`?**

* Automatically activates the correct virtual environment (clean_rag).
* Ensures Python dependencies are loaded.
* Prevents "module not found" errors.
* Professional deployment practice.

**What `start.sh` does:**

```bash
#!/bin/bash
source clean_rag/bin/activate
python src/backend.py

```

### 7.3. Frontend Setup (React + Vite)

**Install frontend dependencies**

```bash
cd ../frontend
npm install

```

**Run development server**

```bash
npm run dev

```

Open in browser: `http://localhost:3000`
The Vite dev server proxies `/api/...` calls to `http://localhost:5001`.

---

## 8. Git Configuration

**Backend .gitignore**
Located at `BACKEND/.gitignore`, ignores:

* Virtual environment (`clean_rag/`, `venv/`, etc.)
* ChromaDB database (`chromadb/`)
* Uploaded PDFs (`data/uploads/`)
* Python cache (`__pycache__/`, `*.pyc`)
* Logs and IDE files

**Frontend .gitignore**
Located at `frontend/.gitignore`, ignores:

* Node modules (`node_modules/`)
* Build output (`dist/`, `build/`)
* Environment variables (`.env`, `.env.local`)
* Test coverage reports
* IDE files

**Key Point:** ChromaDB is excluded because vector databases can be very large. Users rebuild by running `stage1_ingestion.py`.

---

## 9. API Usage Examples

**Simple Question (GET)**

```bash
curl "http://localhost:5001/ask?question=What%20is%20OS?"

```

**Advanced Question (POST)**

```bash
curl -X POST http://localhost:5001/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Darwin?"}'

```

**Upload PDF**

```bash
curl -X POST -F "file=@document.pdf" \
  http://localhost:5001/upload

```

**List Files**

```bash
curl http://localhost:5001/files

```

**Delete File**

```bash
curl -X DELETE http://localhost:5001/files/document.pdf

```

**Clear Database**

```bash
curl -X POST http://localhost:5001/clear

```

**Get Database Stats**

```bash
curl http://localhost:5001/stats

```

---

## 10. Architecture Diagram (Conceptual)

```text
[User Browser]  ↕ (HTTP)
[React + Vite Frontend - PremiumRAG.jsx]  ↕ (Axios / REST API - api.js)
[Flask Backend API - backend.py]  
  ├─ [Stage 1: Ingestion → ChromaDB]  
  ├─ [Stage 2: Retrieval (rewrite temp:0.6 + HyDE + hybrid)]  
  ├─ [Stage 3: Rerank (cross-encoder)]  
  ├─ [Stage 4: Answer (Ollama LLM)]  
  ├─ [File Management: /upload, /files, DELETE /files/<name>]  
  ├─ [Database Management: /clear, /stats]  
  └─ [Ollama Manager (auto-start/stop)]

```

**File Lifecycle**

```text
[User Upload]
    ↓
[POST /upload] → Saves to data/contracts/ → Indexes in ChromaDB
    ↓
[File appears in UI via GET /files]
    ↓
[User hovers & clicks delete]
    ↓
[DELETE /files/<name>] → Removes from disk
    ↓
[UI auto-refreshes via GET /files]
    ↓
[File disappears from UI]

```

*Note: Deleting a file removes it from disk but does **not** remove its embeddings from ChromaDB. To fully reset the database, use POST /clear endpoint.*

**High-Level Query Flow**

1. User asks question from browser (`PremiumRAG.jsx`).
2. Frontend sends JSON to `/query` (POST).
3. Backend:
* Rewrites query (temp: 0.6).
* Uses HyDE to generate hypothetical answer and embed it.
* Runs hybrid retrieval against ChromaDB.
* Reranks candidates with cross‑encoder.
* Calls LLM with best context chunks to generate answer + citations.


4. Frontend displays answer with sources in chat UI.

---

## 11. Architecture Decisions & Interview Talking Points

* **11.1. Why Use a Startup Script (`start.sh`)?**
  * **Consistency**: Ensures the correct virtual environment is always activated.
  * **Prevents errors**: Avoids "module not found" issues from wrong Python interpreter.
  * **Production practice**: Professional deployments use scripts to standardize startup.
  * **Easy onboarding**: New developers just run `./start.sh` without remembering activation commands.


* **11.2. Why Temperature 0.6 for Query Rewrite?**
  * **Balance**: 0.1 was too deterministic; 0.6 allows creative query expansion while maintaining accuracy.
  * **Better retrieval**: More diverse rewrites capture different phrasings of user intent.
  * **Proven in practice**: RAG systems benefit from slightly higher temperatures in query expansion.


* **11.3. Why Remove Upload Size Limit?**
  * **Flexibility**: Large PDFs (e.g., technical manuals, legal contracts) can exceed 16MB.
  * **Production readiness**: Real-world documents vary greatly in size.
  * **User experience**: No frustrating "file too large" errors.


* **11.4. Why Add File Delete Functionality?**
  * **User control**: Users need ability to manage their knowledge base.
  * **Privacy**: Ability to remove sensitive documents immediately.
  * **Storage management**: Prevent disk space bloat from test uploads.
  * **Production readiness**: Real applications need CRUD operations (Create, Read, Update, Delete).
  * **Professional polish**: Hover-to-reveal keeps UI clean; delete button only visible when needed.


* **11.5. Why Add Database Management Endpoints?**
  * **Testing**: Easily clear database during development.
  * **Monitoring**: Stats endpoint provides visibility into system state.
  * **Production feature**: Essential for admin operations and troubleshooting.
  * **Debugging**: Helps diagnose indexing issues and storage problems.


* **11.6. Why ChromaDB?**
  * Simple to embed into Python.
  * Persistent by default – perfect for repeated RAG on the same corpus.
  * Supports collection management and database reset.
  * Specifically designed for embeddings and RAG workloads.
  * Good performance for small-to-medium scale applications.


* **11.7. Why This RAG Pipeline (Rewrite + HyDE + Hybrid + Rerank)?**
  * **Query Rewrite**: Users often type short, ambiguous questions; rewrite produces a more precise query.
  * **HyDE**: Hypothetical answer provides a **dense semantic "anchor"** to retrieve relevant chunks.
  * **Hybrid Search**: Combines semantic (vectors) and exact keywords (BM25) for comprehensive coverage.
  * **Reranking**: Cross-encoder provides final opinionated scoring for precision and reduces hallucinations.
  * **State-of-the-art**: This combination represents current best practices in RAG systems.


* **11.8. Why Local LLM (Ollama) Instead of Cloud API?**
  * **Privacy**: Documents never leave the local machine or server.
  * **Cost**: No per‑token billing; ideal for heavy experimentation.
  * **Control**: Easy to swap/upgrade models without changing API contracts.
  * **Latency**: No network round-trip for inference.
  * **Compliance**: Suitable for sensitive documents (legal, medical, financial).


* **11.9. Why React + Vite Frontend?**
  * Demonstrates **full‑stack capability**.
  * Provides a **user-friendly chat experience** (drag‑and‑drop, live Q&A, source visibility).
  * Vite gives **fast HMR** and is a standard choice for modern React apps.
  * Professional portfolio piece showing UI/UX skills.


* **11.10. Why Separate Stages (1–4) Instead of One Script?**
  * Improves **readability and maintainability**.
  * Allows testing each stage independently (unit / integration).
  * Enables swapping components (e.g., different reranker or retriever).
  * Mirrors how **production systems** are often structured internally.
  * Makes debugging easier by isolating failure points.



---

## 12. Possible Extensions & Future Work

### Immediate Enhancements

* **Metadata-based filtering**: Filter by file type, upload date, tags.
* **Chunk-level deletion**: Remove specific document embeddings from ChromaDB.
* **Usage analytics**: Track most queried topics, document popularity.
* **Export conversations**: Download chat history as PDF or JSON.

### Advanced Features

* **Authentication & Authorization**: Token-based access for multi-user environments.
* **Rate Limiting & Usage Logging**: Protects backend and surfaces usage metrics.
* **Streaming Responses**: Show LLM answers token‑by‑token for better UX.
* **Multi-language Support**: Use multilingual embeddings for global content.
* **Document versioning**: Track changes to uploaded documents.

### Infrastructure

* **Docker Deployment**: Containerize backend + frontend + Ollama.
* **Kubernetes orchestration**: Scale for production workloads.
* **Database Backup/Restore**: Implement ChromaDB snapshot features.
* **CI/CD pipeline**: Automated testing and deployment.
* **Monitoring & alerting**: Prometheus, Grafana for system health.

### AI/ML Improvements

* **Fine-tuned embeddings**: Train on domain-specific documents.
* **Multi-modal RAG**: Support images, tables, charts in PDFs.
* **Agentic workflows**: Let LLM decide when to retrieve vs. generate.
* **Feedback loop**: User ratings to improve retrieval quality.

---

## 13. Summary of What This Project Demonstrates

### Technical Skills

* Ability to design and implement a **complete RAG system** end‑to‑end.
* Knowledge of:
* Document ingestion and chunking strategies.
* Modern retrieval patterns (HyDE, hybrid search, reranking).
* Vector databases (ChromaDB) with management features.
* Local LLM serving (Ollama).
* API design with Flask (RESTful, CRUD operations).
* Frontend integration with React + Vite.
* Production deployment practices (startup scripts, virtual environments).



### Software Engineering

* **Clean architecture**: Separation of concerns across stages.
* **Error handling**: Comprehensive validation and user feedback.
* **Git best practices**: Proper **.gitignore**, meaningful structure.
* **Documentation**: Professional README with setup instructions.
* **Deployment readiness**: Scripts for easy startup and environment management.

### Interview Value

* Clear **architecture decisions** and **trade‑offs** that can be explained.
* **Professional development practices** throughout.
* Demonstrates **full-stack capability** (Python backend + React frontend).
* Shows understanding of **modern AI/ML engineering** (RAG, embeddings, LLMs).
* Real working project that can be demoed live.

---

## 14. Quick Reference

### Always Remember

✅ **DO**: Run backend with `./start.sh`

❌ **DON'T**: Run `python src/backend.py` directly (wrong Python env)

### Common Commands

```bash
# Backend
cd BACKEND
./start.sh                          # Start backend
python src/stage1_ingestion.py      # Load initial PDFs

# Frontend
cd frontend
npm run dev                         # Start dev server

# File Management
curl -X POST -F "file=@doc.pdf" http://localhost:5001/upload  # Upload
curl http://localhost:5001/files                               # List
curl -X DELETE http://localhost:5001/files/doc.pdf             # Delete

# Database Management
curl -X POST http://localhost:5001/clear  # Clear database
curl http://localhost:5001/stats          # Get stats

# Testing
curl "http://localhost:5001/ask?question=test"  # Simple query

```

### Troubleshooting

* **Problem**: "Module not found" error
**Solution**: Use `./start.sh` instead of direct Python execution
* **Problem**: Ollama not responding
**Solution**: Check if Ollama is installed and running: `ollama list`
* **Problem**: File upload fails
**Solution**: Check `data/contracts/` folder exists and has write permissions
* **Problem**: Frontend can't connect to backend
**Solution**: Verify backend is running on port 5001 and Vite proxy is configured



**Contact & Support**: For issues, questions, or contributions, please open an issue on the GitHub repository.

