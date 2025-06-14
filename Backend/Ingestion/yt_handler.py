import yt_dlp
import requests
import re
import os
from pathlib import Path
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
    import time
    try:
        # Add small delay to reduce request frequency
        time.sleep(1)
        
        # Check for cookies file and create session if available
        cookies_path = Path(__file__).parent.parent / "youtube_cookies.txt"
        
        if cookies_path.exists():
            print(f"🍪 [YT-HANDLER] Using cookies for transcript API: {cookies_path}")
            # Create a session with cookies for the transcript API
            import requests
            from http.cookiejar import MozillaCookieJar
            
            session = requests.Session()
            cookie_jar = MozillaCookieJar(str(cookies_path))
            cookie_jar.load(ignore_discard=True, ignore_expires=True)
            session.cookies = cookie_jar
            
            # Try with custom session
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, 
                languages=['en', 'en-US', 'en-GB'],
                proxies=None,
                cookies=session.cookies
            )
        else:
            print(f"🔄 [YT-HANDLER] No cookies available, using standard transcript API")
            # Try multiple language options without cookies
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
        
        return " ".join([entry['text'] for entry in transcript_list])
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable, ParseError) as e:
        print(f"🔄 [YT-HANDLER] Transcript API fallback triggered: {e}")
        return None
    except Exception as e:
        print(f"🔄 [YT-HANDLER] Transcript API unexpected error: {e}")
        return None

def get_auto_caption_url(video_url, lang='en'):
    import time
    # Add delay before yt-dlp request
    time.sleep(2)
    
    # Get path to cookies file
    cookies_path = Path(__file__).parent.parent / "youtube_cookies.txt"
    
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': [lang],
        'subtitlesformat': 'vtt',
        'quiet': True,
        # Add user agent to appear more like a regular browser
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
    
    # Add cookies if file exists
    if cookies_path.exists():
        ydl_opts['cookiefile'] = str(cookies_path)
        print(f"🍪 [YT-HANDLER] Using cookies from: {cookies_path}")
    else:
        print(f"⚠️ [YT-HANDLER] No cookies file found at: {cookies_path}")

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        subs = info.get('automatic_captions', {})
        if lang in subs:
            # Look for direct VTT URLs, avoid M3U8 playlists
            for entry in subs[lang]:
                if entry['ext'] == 'vtt':
                    url = entry['url']
                    # Skip M3U8 playlist URLs
                    if not url.startswith('#EXTM3U') and 'fmt=vtt' in url:
                        return url
                    # If it's a playlist, try to extract the actual VTT URL
                    elif url.startswith('http') and 'fmt=vtt' in url:
                        return url
        
        # Fallback: try manual captions if auto-captions failed
        manual_subs = info.get('subtitles', {})
        if lang in manual_subs:
            for entry in manual_subs[lang]:
                if entry['ext'] == 'vtt':
                    return entry['url']
    return None

def clean_vtt(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        vtt_content = response.text
        
        # Check if we got an M3U8 playlist instead of VTT
        if vtt_content.startswith('#EXTM3U'):
            print("❌ Received M3U8 playlist instead of VTT content")
            return ""
        
        lines = vtt_content.splitlines()
        filtered = []
        last_line = ""

        for line in lines:
            # Skip VTT headers, timestamps, and empty lines
            if ('-->' in line or 
                line.strip().isdigit() or 
                line.startswith("WEBVTT") or
                line.startswith("NOTE") or
                not line.strip()):
                continue
            
            # Remove HTML tags and clean the line
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
    
    except Exception as e:
        print(f"❌ Error cleaning VTT: {e}")
        return ""

def process_youtube_video(url):
    import time
    start_time = time.time()
    
    print(f"🎬 [YT-HANDLER] Starting YouTube video processing")
    print(f"🎬 [YT-HANDLER] URL: {url}")
    
    # Check if cookies are available
    cookies_path = Path(__file__).parent.parent / "youtube_cookies.txt"
    if cookies_path.exists():
        print(f"🍪 [YT-HANDLER] Cookies file detected: {cookies_path}")
        print(f"🍪 [YT-HANDLER] This should help bypass rate limiting!")
    else:
        print(f"⚠️ [YT-HANDLER] No cookies file found - may encounter rate limiting")
    
    try:
        print(f"🎬 [YT-HANDLER] Step 1: Extracting video ID...")
        video_id = fetch_video_id(url)
        print(f"🎬 [YT-HANDLER] Video ID extracted: {video_id}")

        # Step 1: Try transcript API with retry logic
        print(f"🎬 [YT-HANDLER] Step 2: Attempting transcript API...")
        transcript = None
        max_retries = 2
        
        for attempt in range(max_retries):
            if attempt > 0:
                wait_time = 2 ** attempt  # Exponential backoff: 2s, 4s
                print(f"🔄 [YT-HANDLER] Retry attempt {attempt + 1} after {wait_time}s delay...")
                time.sleep(wait_time)
            
            transcript = get_transcript_api(video_id)
            if transcript:
                break
            elif attempt < max_retries - 1:
                print(f"⚠️ [YT-HANDLER] Attempt {attempt + 1} failed, retrying...")
        
        if transcript:
            print(f"✅ [YT-HANDLER] Transcript API successful! Length: {len(transcript)} chars")
        else:
            print(f"⚠️ [YT-HANDLER] Transcript API failed, trying fallback...")

        # Step 2: Fallback to auto-caption
        if not transcript:
            print("🔄 [YT-HANDLER] Trying auto-captions with cookies...")
            try:
                vtt_url = get_auto_caption_url(url)
                if vtt_url:
                    print(f"📹 [YT-HANDLER] Found VTT URL: {vtt_url[:100]}...")
                    transcript = clean_vtt(vtt_url)
                    if transcript:
                        print(f"✅ [YT-HANDLER] Auto-captions successful! Length: {len(transcript)} chars")
                    else:
                        print("❌ [YT-HANDLER] Failed to extract content from VTT")
                else:
                    print("❌ [YT-HANDLER] No auto-captions found.")
                    transcript = ""
            except Exception as e:
                print(f"❌ [YT-HANDLER] Auto-captions failed: {e}")
                transcript = ""

        # Step 3: Store in file with metadata at top
        print(f"🎬 [YT-HANDLER] Step 3: Saving transcript to file...")
        
        # Get absolute path to Parsed_files directory
        current_dir = Path(__file__).parent  # Ingestion folder
        parsed_files_dir = current_dir.parent / "Parsed_files"  # Backend/Parsed_files
        print(f"🎬 [YT-HANDLER] Saving to directory: {parsed_files_dir}")
        parsed_files_dir.mkdir(exist_ok=True)
        
        filename = parsed_files_dir / f"{video_id}.txt"
        print(f"🎬 [YT-HANDLER] Full file path: {filename}")

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"### SOURCE: youtube\n### URL: {url}\n\n")
            f.write(transcript)

        processing_time = time.time() - start_time
        print(f"✅ [YT-HANDLER] Transcript saved to {filename}")
        print(f"✅ [YT-HANDLER] YouTube processing completed successfully!")
        print(f"✅ [YT-HANDLER] Total processing time: {processing_time:.2f}s")
        print(f"✅ [YT-HANDLER] Final transcript length: {len(transcript)} characters")
        print(f"✅ [YT-HANDLER] First 100 chars: {transcript[:100]}...")
        
        return transcript
        
    except Exception as e:
        processing_time = time.time() - start_time
        print(f"❌ [YT-HANDLER] YouTube processing failed!")
        print(f"❌ [YT-HANDLER] Error after: {processing_time:.2f}s")
        print(f"❌ [YT-HANDLER] Error type: {type(e).__name__}")
        print(f"❌ [YT-HANDLER] Error message: {str(e)}")
        print(f"❌ [YT-HANDLER] Error details: {repr(e)}")
        raise

# Example usage
if __name__ == "__main__":
    url = "https://www.youtube.com/watch?v=9EqrUK7ghho"
    transcript = process_youtube_video(url)
    print(transcript[:1000])  # Print first 1000 characters
