from fastapi import APIRouter, UploadFile, File, Body
from Ingestion.yt_handler import process_youtube_video
from Ingestion.pdf_handler import process_pdf_file, validate_pdf_file
import os
import tempfile

router = APIRouter()

@router.get("/process_youtube_video/")
async def process_youtube_video_endpoint(url: str):
    """
    Endpoint to process a YouTube video URL and save the transcript to parsed_files.
    """
    try:
        transcript = process_youtube_video(url) 
        return {
            "success": True,
            "message": "YouTube video processed and saved to parsed_files",
            "transcript_length": len(transcript)
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/process_pdf/")
async def process_pdf_endpoint(
    file: UploadFile = File(...),
    source_name: str = Body(None),
    user_id: str = Body(None)
):
    """
    Endpoint to process an uploaded PDF file and save the text to parsed_files.
    """
    temp_path = None
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return {"error": "File must be a PDF (filename must end with .pdf)"}
        
        # Check file size (limit to 10MB for safety)
        file_size = 0
        
        # Create temporary file to save uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name
            
            # Stream file content and count bytes
            while chunk := await file.read(1024):  # Read in 1KB chunks
                file_size += len(chunk)
                
                # Check size limit (10MB = 10 * 1024 * 1024 bytes)
                if file_size > 10 * 1024 * 1024:
                    temp_file.close()
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                    return {"error": "File too large. Maximum size is 10MB."}
                
                temp_file.write(chunk)
        
        try:
            # Process the PDF
            text = process_pdf_file(temp_path, source_name,user_id)
            
            return {
                "success": True,
                "message": "PDF processed and saved to parsed_files",
                "filename": file.filename,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "text_length": len(text),
                "preview": text[:200] + "..." if len(text) > 200 else text
            }
        except ValueError as ve:
            # PDF-specific validation errors
            return {"error": f"PDF processing error: {str(ve)}"}
        except Exception as e:
            # Other unexpected errors
            return {"error": f"Unexpected error during PDF processing: {str(e)}"}
        finally:
            # Always clean up temporary file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
            
    except Exception as e:
        # Handle file upload errors
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        return {"error": f"File upload error: {str(e)}"}

@router.post("/validate_pdf/")
async def validate_pdf_endpoint(file: UploadFile = File(...)):
    """
    Endpoint to validate if an uploaded file is a readable PDF without processing it.
    """
    temp_path = None
    try:
        # Basic validation
        if not file.filename.lower().endswith('.pdf'):
            return {"valid": False, "error": "File must be a PDF"}
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name
            while chunk := await file.read(1024):
                temp_file.write(chunk)
        
        # Validate PDF structure
        validate_pdf_file(temp_path)
        
        return {
            "valid": True, 
            "message": "PDF is valid and readable",
            "filename": file.filename
        }
        
    except Exception as e:
        return {
            "valid": False, 
            "error": str(e),
            "filename": file.filename
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path) 