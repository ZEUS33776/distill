import os
import PyPDF2
import fitz  # PyMuPDF - better for complex PDFs
from pathlib import Path

def validate_pdf_file(pdf_path):
    """
    Validate if the file is actually a valid PDF by checking magic bytes
    and basic structure.
    """
    try:
        # Check file size
        if os.path.getsize(pdf_path) == 0:
            raise ValueError("PDF file is empty")
        
        # Check PDF magic bytes
        with open(pdf_path, 'rb') as f:
            header = f.read(4)
            if not header.startswith(b'%PDF'):
                raise ValueError("File is not a valid PDF (missing PDF header)")
        
        # Try to open with PyMuPDF for quick validation
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            doc.close()
            raise ValueError("PDF has no pages")
        doc.close()
        
        return True
    except Exception as e:
        raise ValueError(f"PDF validation failed: {str(e)}")

def extract_text_from_pdf(pdf_path):
    """
    Extract text from PDF using PyMuPDF (fitz) as primary method,
    with PyPDF2 as fallback.
    """
    # First validate the PDF
    validate_pdf_file(pdf_path)
    
    text = ""
    
    try:
        # Try PyMuPDF first (better for complex layouts)
        print("Attempting text extraction with PyMuPDF...")
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text()
            if page_text.strip():  # Only add non-empty text
                text += page_text + "\n"
        doc.close()
        
        if text.strip():
            print(f"✅ PyMuPDF extracted {len(text)} characters")
            return text.strip()
        else:
            print("⚠️  PyMuPDF found no text content")
    except Exception as e:
        print(f"❌ PyMuPDF failed: {e}")
    
    try:
        # Fallback to PyPDF2
        print("Attempting text extraction with PyPDF2...")
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Check if PDF is encrypted
            if pdf_reader.is_encrypted:
                raise ValueError("PDF is password-protected")
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                if page_text.strip():
                    text += page_text + "\n"
        
        if text.strip():
            print(f"✅ PyPDF2 extracted {len(text)} characters")
            return text.strip()
        else:
            print("⚠️  PyPDF2 found no text content")
    except Exception as e:
        print(f"❌ PyPDF2 failed: {e}")
    
    # If both methods fail or return empty text
    if not text.strip():
        raise ValueError(
            "No text could be extracted from this PDF. "
            "This might be a scanned document (image-based PDF) or corrupted file. "
            "Try using a different PDF or ensure it contains extractable text."
        )
    
    return text.strip()

def process_pdf_file(pdf_path, source_name=None):
    """
    Process a PDF file and save the extracted text to parsed_files directory
    with metadata header.
    
    Args:
        pdf_path: Path to the PDF file
        source_name: Optional custom name for the source (defaults to filename)
    
    Returns:
        Extracted text content
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    try:
        # Extract text from PDF with improved error handling
        text = extract_text_from_pdf(pdf_path)
        
        # Get filename without extension for saving
        pdf_filename = Path(pdf_path).stem
        source_name = source_name or pdf_filename
        
        # Create parsed_files directory if it doesn't exist
        os.makedirs("parsed_files", exist_ok=True)
        
        # Save with metadata header
        output_filename = os.path.join("parsed_files", f"{pdf_filename}.txt")
        
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(f"### SOURCE: pdf\n")
            f.write(f"### FILENAME: {source_name}\n")
            f.write(f"### ORIGINAL_PATH: {pdf_path}\n\n")
            f.write(text)
        
        print(f"✅ PDF text extracted and saved to {output_filename}")
        return text
        
    except Exception as e:
        # Re-raise with more context
        raise ValueError(f"Failed to process PDF '{pdf_path}': {str(e)}")

# Example usage
if __name__ == "__main__":
    # Test with a sample PDF
    pdf_path = "sample.pdf"  # Replace with actual PDF path
    try:
        text = process_pdf_file(pdf_path)
        print(f"Extracted {len(text)} characters from PDF")
        print("First 500 characters:")
        print(text[:500])
    except Exception as e:
        print(f"Error: {e}") 