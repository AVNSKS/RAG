# RAG Backend - Startup Guide

## Quick Start

### Option 1: Using the startup script (Recommended)
```bash
./start.sh
```

### Option 2: Manual start
```bash
/Users/sksa.v.n/Documents/Projects/RAG/BACKEND/clean_rag/bin/python src/backend.py
```

### Option 3: With virtual environment activation
```bash
source clean_rag/bin/activate
python src/backend.py
```

## First Time Setup

1. **Recreate virtual environment (if needed)**:
   ```bash
   python3 -m venv clean_rag --clear
   ```

2. **Install dependencies**:
   ```bash
   ./clean_rag/bin/pip install -r requirements.txt
   ```

## Common Issues

### "ModuleNotFoundError: No module named 'flask_cors'"
**Solution**: Don't use `python src/backend.py` - use one of the startup methods above.

The issue occurs because you're using the system Python instead of the virtual environment's Python.

### Checking installed packages
```bash
./clean_rag/bin/pip list
```

## Server Info
- URL: http://localhost:5001
- Endpoints: See http://localhost:5001/ for API documentation
