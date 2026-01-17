"""
Auto-start/stop Ollama with your RAG backend
Usage: from ollama_manager import ensure_ollama
"""
import subprocess
import time
import requests
import atexit
import signal
import sys


class OllamaManager:
    """Manages Ollama server lifecycle"""
    
    def __init__(self):
        self.process = None
        self.host = "http://localhost:11434"
    
    def is_running(self):
        """Check if Ollama is already running"""
        try:
            response = requests.get(f"{self.host}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def start(self):
        """Start Ollama server if not running"""
        if self.is_running():
            print("✅ Ollama already running")
            return True
        
        print("🚀 Starting Ollama server...")
        try:
            # Start Ollama in background
            self.process = subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=None if sys.platform == 'win32' else lambda: signal.signal(signal.SIGINT, signal.SIG_IGN)
            )
            
            # Wait for startup (max 10 seconds)
            for i in range(10):
                time.sleep(1)
                if self.is_running():
                    print("✅ Ollama server started!")
                    return True
                print(f"⏳ Waiting for Ollama... ({i+1}/10)")
            
            print("❌ Ollama failed to start")
            return False
            
        except Exception as e:
            print(f"❌ Error starting Ollama: {e}")
            return False
    
    def stop(self):
        """Stop Ollama server"""
        if self.process:
            print("🛑 Stopping Ollama server...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
                print("✅ Ollama stopped")
            except subprocess.TimeoutExpired:
                self.process.kill()
                print("⚠️ Ollama force killed")
    
    def ensure_model(self, model_name="llama3.2:3b"):
        """Check if model is pulled, pull if needed"""
        try:
            response = requests.get(f"{self.host}/api/tags")
            models = [m['name'] for m in response.json().get('models', [])]
            
            if model_name not in models:
                print(f"📥 Pulling model {model_name}...")
                subprocess.run(["ollama", "pull", model_name], check=True)
                print(f"✅ Model {model_name} ready")
            else:
                print(f"✅ Model {model_name} already available")
        except Exception as e:
            print(f"⚠️ Model check failed: {e}")


# ===== GLOBAL INSTANCE =====
ollama_mgr = OllamaManager()

# Auto-stop on exit
atexit.register(ollama_mgr.stop)


# ===== HELPER FUNCTION =====
def ensure_ollama(model_name="llama3.2:3b"):
    """
    Main function to call from your app
    Ensures Ollama is running and model is available
    """
    if not ollama_mgr.start():
        raise RuntimeError("Failed to start Ollama server")
    ollama_mgr.ensure_model(model_name)


# ===== MANUAL STOP =====
def stop_ollama():
    """Manual stop function"""
    ollama_mgr.stop()


if __name__ == "__main__":
    # Test the manager
    print("Testing Ollama Manager...")
    ensure_ollama()
    print("\nPress Ctrl+C to test cleanup...")
    try:
        time.sleep(999)
    except KeyboardInterrupt:
        print("\nCleaning up...")
