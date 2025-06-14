#!/usr/bin/env python3
"""
Startup script for Render deployment.
This script runs the Backend FastAPI application from the root directory.
"""

import os
import sys
import subprocess

def main():
    # Change to Backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'Backend')
    os.chdir(backend_dir)
    
    # Add Backend directory to Python path
    sys.path.insert(0, backend_dir)
    
    # Get port from environment (Render sets this)
    port = os.environ.get('PORT', '8000')
    
    # Start uvicorn server
    cmd = [
        'uvicorn', 
        'main:app', 
        '--host', '0.0.0.0', 
        '--port', port
    ]
    
    print(f"🚀 Starting server on port {port}")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🔧 Command: {' '.join(cmd)}")
    
    # Execute uvicorn
    subprocess.run(cmd)

if __name__ == "__main__":
    main() 