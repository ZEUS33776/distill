import os

def read_and_chunk_files(folder_path="./Parsed_files", chunk_size=500, char_limit=2000):
    """
    Reads .txt files, splits into chunks with metadata,
    including source and URL/filename parsed from file header.
    Supports both YouTube and PDF metadata formats.
    """
    all_chunks = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Extract metadata from the top of the file - initialize all variables
            source = url = original_filename = original_path = user_id = ""
            content_lines = []

            for line in lines:
                if line.startswith("### SOURCE:"):
                    source = line.split(":", 1)[1].strip()
                elif line.startswith("### URL:"):
                    url = line.split(":", 1)[1].strip()
                elif line.startswith("### FILENAME:"):
                    original_filename = line.split(":", 1)[1].strip()
                elif line.startswith("### ORIGINAL_PATH:"):
                    original_path = line.split(":", 1)[1].strip()
                elif line.startswith("### USER_ID:"):
                    user_id = line.split(":", 1)[1].strip()
                elif line.strip() and not line.startswith("###"):
                    content_lines.append(line.strip())

            text = " ".join(" ".join(content_lines).split())  # normalize whitespace
            words = text.split()

            i = 0
            chunk_id = 0
            while i < len(words):
                chunk_words = words[i:i + chunk_size]
                chunk_text = " ".join(chunk_words)

                # Ensure under character limit
                while len(chunk_text) > char_limit and len(chunk_words) > 10:
                    chunk_words = chunk_words[:-10]
                    chunk_text = " ".join(chunk_words)

                if chunk_text.strip():
                    chunk_metadata = {
                        "filename": filename,
                        "chunk_id": chunk_id,
                        "text": chunk_text,
                        "source": source,
                        "type": "data",
                        "user_id": user_id  # Now properly initialized
                    }
                    
                    # Add source-specific metadata
                    if source == "youtube":
                        chunk_metadata["url"] = url
                    elif source == "pdf":
                        chunk_metadata["original_filename"] = original_filename
                        chunk_metadata["original_path"] = original_path
                    
                    all_chunks.append(chunk_metadata)

                i += len(chunk_words)
                chunk_id += 1

    print(f"Total chunks: {len(all_chunks)}")
    return all_chunks

if __name__ == "__main__":
    folder = "./Parsed_files"
    chunks = read_and_chunk_files(folder)
    print("Sample chunk text:\n", chunks[0]['text'][:500])
    print("Sample chunk metadata:", {k: v for k, v in chunks[0].items() if k != 'text'})
