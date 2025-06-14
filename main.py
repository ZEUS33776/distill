import sys
import os

# Add Backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

# Import the FastAPI app from Backend
from Backend.main import app

# This allows uvicorn to find the app at the root level
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 