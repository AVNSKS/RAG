"""
Flask API Backend for RAG System
Run: python src/backend.py
Test: http://localhost:5000/ask?question=What is OS?
"""
import os
from flask import Flask,request,jsonify
from ollama_manager import ensure_ollama
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sys
sys.path.append('.')

from stage4_answer import full_rag_pipeline

app=Flask(__name__)
CORS(app, origins=['http://localhost:3000'])


@app.route('/')
def home():
    """Health check"""
    return jsonify({
        "status": "running",
        "message": "RAG Backend API",
        "version": "2.1",
        "endpoints": {
            "GET  /ask": "Query: ?question=your_question",
            "POST /query": "JSON: {\"question\": \"...\"}",
            "POST /upload": "Upload PDF (add clear_old=true to replace)",
            "GET  /files": "List uploaded PDFs",
            "POST /database/clear": "Clear vector database",
            "GET  /database/stats": "Database statistics"
        },
        "examples": {
            "upload_add": "curl -X POST -F 'file=@doc.pdf' http://localhost:5000/upload",
            "upload_replace": "curl -X POST -F 'file=@doc.pdf' -F 'clear_old=true' http://localhost:5000/upload",
            "clear_db": "curl -X POST http://localhost:5000/database/clear"
        }
    })
    
@app.route('/ask',methods=['GET'])
def ask_get():
    """
    GET endpoint for simple browser testing
    Example: /ask?question=What is OS?
    """
    try:
        question=request.args.get('question',' ').strip()
        if not question:
            return jsonify({
                "error": "No question provided",
                "example": "/ask?question=What is OS?"
            }),400
        
        print('Get processing')
        answer=full_rag_pipeline(question)
        
        return jsonify({
            "question": question,
            "answer": answer,
            "method": "GET",
            "status": "success"
        }),200
        
    except Exception as e:
        print(f"Exception {e}")
        return jsonify({
            "error": str(e),
            "status": "failed"
        }),500
        
@app.route('/ask',methods=['POST'])
def ask_post():
    """
    POST endpoint for frontend/app integration
    Body: {"question": "What is OS?", "doc_type": "contract"}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                 "error": "No JSON body provided",
                "example": {"question": "What is OS?"}
            }),400
        
        question =data.get('question',' ').strip()
        doc_type = data.get('doc_type', 'contract')
        
        if not question:
            return jsonify({
                "error": "Question field is required",
                "example": {"question": "What is OS?"}
            }),400
            
        print(f"post processing {question}");
        answer=full_rag_pipeline(question)
        
        return({
            "question": question,
            "answer": answer,
            "doc_type": doc_type,
            "method": "POST",
            "status": "success"
        }),200
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({
            "error": str(e),
            "status": "failed"
        }), 500


# configer upload
UPLOAD_FOLDER='data/contracts'
ALLOWED_EXTENSIONS={"pdf"}
os.makedirs(UPLOAD_FOLDER,exist_ok=True)

app.config['UPLOAD_FOLDER']=UPLOAD_FOLDER
# No upload size limit
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload',methods=['POST'])
def upload():
    """
    Upload PDF and add to vector database
    
    Usage:
    curl -X POST -F "file=@document.pdf" http://localhost:5000/upload
    curl -X POST -F "file=@document.pdf" -F "clear_old=true" http://localhost:5000/upload
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file sent"}), 400
        file=request.files['file']
        
        if file.filename==' ':
            return jsonify({"error": "Empty filename"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF files allowed"}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Check if user wants to clear old data
        clear_old = request.form.get('clear_old', 'false').lower() == 'true'
        
        # ===== ADD TO DATABASE =====
        from stage1_ingestion import ingest_single_pdf, clear_database
        
        if clear_old:
            print("🧹 Clearing old database before upload...")
            clear_database()
        
        chunks_added = ingest_single_pdf(filepath)
        
        return jsonify({
            "status": "success",
            "message": f"Uploaded {filename}",
            "path": filepath,
            "chunks_added": chunks_added,
            "cleared_old_data": clear_old
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/files',methods=["GET"])
def list_files():
    """List all uploaded PDFs"""
    try:
        files=[]
        for filename in os.listdir(UPLOAD_FOLDER):
            if(allowed_file(filename)):
                filepath=os.path.join(UPLOAD_FOLDER,filename)
                files.append({
                    "filename": filename,
                    "size": os.path.getsize(filepath),
                    "uploaded": os.path.getctime(filepath)
                })
        return jsonify({
            "files": files,
            "count": len(files)
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/database/clear', methods=['POST'])
def clear_db():
    """
    Clear entire vector database (keeps uploaded PDF files)
    
    Usage:
    curl -X POST http://localhost:5000/database/clear
    """
    try:
        from stage1_ingestion import clear_database
        clear_database()
        
        return jsonify({
            "status": "success",
            "message": "Vector database cleared",
            "note": "PDF files still exist in data/contracts/"
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/database/stats', methods=['GET'])
def db_stats():
    """
    Get database statistics: total chunks, collections, etc.
    
    Usage:
    curl http://localhost:5000/database/stats
    """
    try:
        from stage1_ingestion import get_database_stats
        stats = get_database_stats()
        
        return jsonify({
            "status": "success",
            "database": stats
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
        



if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 RAG Backend Starting...")
    print("="*60)
    ensure_ollama()  # Your manager handles everything!
    print("📍 Server: http://localhost:5001")
    print("\n📌 Endpoints:")
    print("   GET  → http://localhost:5001/ask?question=What is OS?")
    print("   POST → http://localhost:5001/query")
    print("          Body: {\"question\": \"What is OS?\"}")
    print("\n🛑 Stop: Press Ctrl+C")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
        