import uvicorn
import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print("🚑 Starting ResQRoute Intelligent Dispatch Server...")
    print("🧠 Powered by Priority Queue (Triage) & Dijkstra's Algorithm")
    print("📡 Local API URL: http://localhost:8000")
    print("📚 Interactive API Docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

