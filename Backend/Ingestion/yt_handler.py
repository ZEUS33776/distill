import yt_dlp
import requests
import re
import os
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from xml.etree.ElementTree import ParseError  # Needed to catch XML parsing errors

def fetch_video_id(url):
    query = parse_qs(urlparse(url).query)
    video_id = query.get("v")
    if video_id:
        return video_id[0]
    raise ValueError("Invalid YouTube URL")

def get_transcript_api(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        return " ".join([entry['text'] for entry in transcript_list])
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable, ParseError) as e:
        print(f"Transcript API fallback triggered: {e}")
        return None

def get_auto_caption_url(video_url, lang='en'):
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': [lang],
        'subtitlesformat': 'vtt',
        'quiet': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        subs = info.get('automatic_captions', {})
        if lang in subs:
            for entry in subs[lang]:
                if entry['ext'] == 'vtt':
                    return entry['url']
    return None

def clean_vtt(url):
    vtt = requests.get(url).text
    lines = vtt.splitlines()
    filtered = []
    last_line = ""

    for line in lines:
        if '-->' in line or line.strip().isdigit() or line.startswith("WEBVTT"):
            continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        if line and line != last_line:
            filtered.append(line)
            last_line = line  # Prevent consecutive duplicates

    text = ' '.join(filtered)

    # Optional: Remove repeated trigrams or short phrase loops
    words = text.split()
    result = []
    window = set()
    i = 0

    while i < len(words):
        phrase = ' '.join(words[i:i+5])  # check up to 5-word repeats
        if phrase in window:
            i += 5
            continue
        result.append(words[i])
        window.add(phrase)
        if len(window) > 50:
            window.pop()
        i += 1

    return ' '.join(result)

def process_youtube_video(url):
    video_id = fetch_video_id(url)

    # Step 1: Try transcript API
    transcript = get_transcript_api(video_id)

    # Step 2: Fallback to auto-caption
    if not transcript:
        vtt_url = get_auto_caption_url(url)
        if vtt_url:
            transcript = clean_vtt(vtt_url)
        else:
            print("No auto-captions found.")
            transcript = ""

    # Step 3: Store in file with metadata at top
    os.makedirs("parsed_files", exist_ok=True)
    filename = os.path.join("parsed_files", f"{video_id}.txt")

    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"### SOURCE: youtube\n### URL: {url}\n\n")
        f.write(transcript)

    print(f"Transcript saved to {filename}")
    return transcript

# Example usage
if __name__ == "__main__":
    url = "https://www.youtube.com/watch?v=9EqrUK7ghho"
    transcript = process_youtube_video(url)
    print(transcript[:1000])  # Print first 1000 characters
