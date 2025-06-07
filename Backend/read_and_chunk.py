import os

def read_and_chunk_files(folder_path, chunk_size=500, char_limit=2000):
    """
    Reads all .txt files in folder_path,
    splits text into chunks of chunk_size words (max char_limit),
    and returns list of dicts with chunk text and metadata.
    Also prints chunk stats.
    """
    all_chunks = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
                text = " ".join(text.split())  # normalize whitespace

                words = text.split()
                i = 0
                chunk_id = 0
                chunk_count = 0

                print(f"\nProcessing file: {filename}")

                while i < len(words):
                    chunk_words = words[i:i+chunk_size]
                    chunk_text = " ".join(chunk_words)

                    # Truncate if chunk is too long in characters
                    while len(chunk_text) > char_limit and len(chunk_words) > 10:
                        chunk_words = chunk_words[:-10]
                        chunk_text = " ".join(chunk_words)

                    if chunk_text.strip():
                        all_chunks.append({
                            "filename": filename,
                            "chunk_id": chunk_id,
                            "text": chunk_text
                        })
                        print(f"Chunk {chunk_id} → {len(chunk_words)} words, {len(chunk_text)} chars")
                        chunk_count += 1

                    i += len(chunk_words)
                    chunk_id += 1

                print(f"Total chunks from {filename}: {chunk_count}")

    print(f"\n✅ Finished. Total chunks from all files: {len(all_chunks)}")
    return all_chunks


if __name__ == "__main__":
    folder = "./parsed_files"
    chunks = read_and_chunk_files(folder)
    print("Sample chunk text:\n", chunks[0]['text'][:500])
