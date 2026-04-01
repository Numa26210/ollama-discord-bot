"""
FastAPI application runner
Run this file to start the Discord Bot API server
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False") == "True"

if __name__ == "__main__":
    print(f"""
    ╔════════════════════════════════════════════════════════════╗
    ║          🤖 Discord Bot API Server Starting...             ║
    ╚════════════════════════════════════════════════════════════╝
    
    Configuration:
    • Host: {HOST}
    • Port: {PORT}
    • Debug Mode: {DEBUG}
    • API Docs: http://localhost:{PORT}/api/docs
    """)
    
    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )
