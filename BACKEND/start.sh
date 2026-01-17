#!/bin/bash

# RAG Backend Startup Script

echo "🚀 Starting RAG Backend..."

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if virtual environment exists
if [ ! -d "clean_rag" ]; then
    echo "❌ Virtual environment 'clean_rag' not found!"
    echo "Please create it first with: python3 -m venv clean_rag"
    exit 1
fi

# Use virtual environment Python
PYTHON_PATH="$DIR/clean_rag/bin/python"

if [ ! -f "$PYTHON_PATH" ]; then
    echo "❌ Python not found in virtual environment!"
    exit 1
fi

# Check if flask-cors is installed
if ! "$PYTHON_PATH" -c "import flask_cors" 2>/dev/null; then
    echo "⚠️  flask-cors not found. Installing dependencies..."
    "$DIR/clean_rag/bin/pip" install -r requirements.txt
fi

echo "✅ Using Python from: $PYTHON_PATH"
echo "✅ Starting backend server..."
echo ""

# Run the backend
"$PYTHON_PATH" src/backend.py
