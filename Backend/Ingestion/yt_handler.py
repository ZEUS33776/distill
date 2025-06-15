import yt_dlp
import requests
import re
import os
import json
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from xml.etree.ElementTree import ParseError
from typing import Optional, Dict, Any, List

class YouTubeAuthManager:
    """Robust YouTube authentication manager with multiple strategies"""
    
    def __init__(self):
        self.cookies_path = Path(__file__).parent.parent / "youtube_cookies.txt"
        self.auth_strategies = [
            'cookies_file',
            'browser_cookies', 
            'no_auth',
            'proxy_rotation'
        ]
        self.current_strategy = 0
        self.failed_strategies = set()
        
    def check_cookie_status(self) -> Dict[str, Any]:
        """Comprehensive cookie status check"""
        status = {
            'exists': False,
            'valid_format': False,
            'has_youtube_cookies': False,
            'file_size': 0,
            'last_modified': None,
            'estimated_age_hours': 0
        }
        
        if not self.cookies_path.exists():
            print(f"🍪 [AUTH-MGR] No cookies file found at: {self.cookies_path}")
            return status
            
        try:
            # Check file stats
            stat = self.cookies_path.stat()
            status['exists'] = True
            status['file_size'] = stat.st_size
            status['last_modified'] = stat.st_mtime
            
            # Calculate age
            age_seconds = time.time() - stat.st_mtime
            status['estimated_age_hours'] = age_seconds / 3600
            
            if stat.st_size == 0:
                print(f"🍪 [AUTH-MGR] Cookies file is empty")
                return status
                
            # Check format and content
            with open(self.cookies_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:10]  # Check first 10 lines
                
            # Check for Netscape format
            has_header = any('netscape' in line.lower() for line in lines)
            has_youtube = any('youtube.com' in line for line in lines if not line.startswith('#'))
            
            status['valid_format'] = has_header or len([l for l in lines if not l.startswith('#') and l.strip()]) > 0
            status['has_youtube_cookies'] = has_youtube
            
            # Log status
            if status['estimated_age_hours'] > 24:
                print(f"⚠️ [AUTH-MGR] Cookies are {status['estimated_age_hours']:.1f} hours old - may be expired")
            else:
                print(f"🍪 [AUTH-MGR] Cookies file looks good ({status['file_size']} bytes, {status['estimated_age_hours']:.1f}h old)")
                
        except Exception as e:
            print(f"❌ [AUTH-MGR] Error checking cookies: {e}")
            
        return status
    
    def get_next_auth_strategy(self) -> Optional[Dict[str, Any]]:
        """Get the next authentication strategy to try"""
        if self.current_strategy >= len(self.auth_strategies):
            return None
            
        strategy_name = self.auth_strategies[self.current_strategy]
        self.current_strategy += 1
        
        if strategy_name in self.failed_strategies:
            return self.get_next_auth_strategy()  # Skip failed strategies
            
        return self._get_strategy_config(strategy_name)
    
    def _get_strategy_config(self, strategy_name: str) -> Dict[str, Any]:
        """Get configuration for a specific auth strategy"""
        configs = {
            'cookies_file': {
                'name': 'File-based Cookies',
                'use_cookies': True,
                'cookies_source': 'file',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'extra_opts': {}
            },
            'browser_cookies': {
                'name': 'Browser Cookies',
                'use_cookies': True,
                'cookies_source': 'browser',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'extra_opts': {'cookiesfrombrowser': ('chrome',)}
            },
            'no_auth': {
                'name': 'No Authentication',
                'use_cookies': False,
                'cookies_source': None,
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'extra_opts': {}
            },
            'proxy_rotation': {
                'name': 'Proxy + No Auth',
                'use_cookies': False,
                'cookies_source': None,
                'user_agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'extra_opts': {
                    'proxy': None,  # Could add proxy list here
                    'sleep_interval': 3
                }
            }
        }
        
        return configs.get(strategy_name, configs['no_auth'])
    
    def mark_strategy_failed(self, strategy_name: str, error: str):
        """Mark a strategy as failed"""
        self.failed_strategies.add(strategy_name)
        print(f"❌ [AUTH-MGR] Strategy '{strategy_name}' failed: {error}")
    
    def reset_strategies(self):
        """Reset strategy state for new video"""
        self.current_strategy = 0
        self.failed_strategies.clear()

def fetch_video_id(url: str) -> str:
    """Extract video ID from YouTube URL"""
    query = parse_qs(urlparse(url).query)
    video_id = query.get("v")
    if video_id:
        return video_id[0]
    raise ValueError("Invalid YouTube URL")

def get_transcript_api(video_id: str) -> Optional[str]:
    """Get transcript using YouTube Transcript API (no cookies support)"""
    try:
        time.sleep(1)  # Rate limiting
        
        print(f"🔄 [TRANSCRIPT-API] Attempting transcript extraction for: {video_id}")
        
        # Try multiple language options
        transcript_list = YouTubeTranscriptApi.get_transcript(
            video_id, 
            languages=['en', 'en-US', 'en-GB', 'auto']
        )
        
        transcript_text = " ".join([entry['text'] for entry in transcript_list])
        print(f"✅ [TRANSCRIPT-API] Success! Length: {len(transcript_text)} chars")
        return transcript_text
        
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable, ParseError) as e:
        print(f"🔄 [TRANSCRIPT-API] Expected error: {type(e).__name__} - {e}")
        return None
    except Exception as e:
        print(f"🔄 [TRANSCRIPT-API] Unexpected error: {type(e).__name__} - {e}")
        return None

def get_auto_caption_with_auth(video_url: str, auth_manager: YouTubeAuthManager, lang: str = 'en') -> Optional[str]:
    """Get auto captions using yt-dlp with robust authentication"""
    
    while True:
        strategy = auth_manager.get_next_auth_strategy()
        if not strategy:
            print(f"❌ [YT-DLP] All authentication strategies exhausted")
            return None
            
        print(f"🔄 [YT-DLP] Trying strategy: {strategy['name']}")
        
        try:
            # Build yt-dlp options
            ydl_opts = {
                'skip_download': True,
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': [lang],
                'subtitlesformat': 'vtt',
                'quiet': True,
                'no_warnings': True,
                'http_headers': {
                    'User-Agent': strategy['user_agent']
                }
            }
            
            # Add authentication
            if strategy['use_cookies'] and strategy['cookies_source'] == 'file':
                if auth_manager.cookies_path.exists():
                    ydl_opts['cookiefile'] = str(auth_manager.cookies_path)
                    print(f"🍪 [YT-DLP] Using cookies file: {auth_manager.cookies_path}")
                else:
                    print(f"⚠️ [YT-DLP] Cookies file not found, falling back to no-auth")
                    strategy['use_cookies'] = False
                    
            elif strategy['use_cookies'] and strategy['cookies_source'] == 'browser':
                ydl_opts.update(strategy['extra_opts'])
                print(f"🌐 [YT-DLP] Using browser cookies")
            
            # Add extra options
            ydl_opts.update(strategy.get('extra_opts', {}))
            
            # Add delay for rate limiting
            if 'sleep_interval' in strategy.get('extra_opts', {}):
                time.sleep(strategy['extra_opts']['sleep_interval'])
            else:
                time.sleep(2)
            
            # Extract info
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                vtt_url = extract_vtt_url_from_info(info, lang)
                
                if vtt_url:
                    print(f"✅ [YT-DLP] Strategy '{strategy['name']}' successful!")
                    return clean_vtt(vtt_url)
                else:
                    print(f"⚠️ [YT-DLP] No captions found with strategy '{strategy['name']}'")
                    auth_manager.mark_strategy_failed(strategy['name'], "No captions available")
                    continue
                    
        except Exception as e:
            error_msg = str(e).lower()
            
            # Categorize errors
            if any(keyword in error_msg for keyword in ['sign in', 'bot', 'authentication', 'cookies']):
                print(f"🔐 [YT-DLP] Authentication error with '{strategy['name']}': {e}")
                auth_manager.mark_strategy_failed(strategy['name'], f"Auth error: {e}")
            elif 'private' in error_msg or 'unavailable' in error_msg:
                print(f"🚫 [YT-DLP] Video unavailable: {e}")
                return None  # Don't try other strategies for unavailable videos
            else:
                print(f"❌ [YT-DLP] Unexpected error with '{strategy['name']}': {e}")
                auth_manager.mark_strategy_failed(strategy['name'], f"Unexpected: {e}")
            
            continue
    
    return None

def extract_vtt_url_from_info(info: Dict[str, Any], lang: str = 'en') -> Optional[str]:
    """Extract VTT URL from yt-dlp info dict"""
    # Try automatic captions first
    subs = info.get('automatic_captions', {})
    if lang in subs:
        for entry in subs[lang]:
            if entry['ext'] == 'vtt':
                url = entry['url']
                if not url.startswith('#EXTM3U') and 'fmt=vtt' in url:
                    print(f"✅ [VTT-EXTRACT] Found auto-caption VTT URL")
                    return url
                elif url.startswith('http') and 'fmt=vtt' in url:
                    print(f"✅ [VTT-EXTRACT] Found auto-caption VTT URL (alt format)")
                    return url
    
    # Fallback: try manual captions
    manual_subs = info.get('subtitles', {})
    if lang in manual_subs:
        for entry in manual_subs[lang]:
            if entry['ext'] == 'vtt':
                print(f"✅ [VTT-EXTRACT] Found manual caption VTT URL")
                return entry['url']
    
    print(f"❌ [VTT-EXTRACT] No VTT captions found for language: {lang}")
    return None

def clean_vtt(url: str) -> str:
    """Clean and process VTT content"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
        vtt_content = response.text
        
        # Check if we got an M3U8 playlist instead of VTT
        if vtt_content.startswith('#EXTM3U'):
            print("❌ [VTT-CLEAN] Received M3U8 playlist instead of VTT content")
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
                last_line = line

        text = ' '.join(filtered)

        # Remove repeated phrases
        words = text.split()
        result = []
        window = set()
        i = 0

        while i < len(words):
            phrase = ' '.join(words[i:i+5])
            if phrase in window:
                i += 5
                continue
            result.append(words[i])
            window.add(phrase)
            if len(window) > 50:
                window.pop()
            i += 1

        cleaned_text = ' '.join(result)
        print(f"✅ [VTT-CLEAN] Cleaned VTT content: {len(cleaned_text)} chars")
        return cleaned_text
    
    except Exception as e:
        print(f"❌ [VTT-CLEAN] Error cleaning VTT: {e}")
        return ""

def process_youtube_video(url: str) -> str:
    """Main function to process YouTube video with robust authentication"""
    start_time = time.time()
    
    print(f"🎬 [YT-HANDLER] Starting YouTube video processing")
    print(f"🎬 [YT-HANDLER] URL: {url}")
    
    # Initialize authentication manager
    auth_manager = YouTubeAuthManager()
    cookie_status = auth_manager.check_cookie_status()
    
    try:
        print(f"🎬 [YT-HANDLER] Step 1: Extracting video ID...")
        video_id = fetch_video_id(url)
        print(f"🎬 [YT-HANDLER] Video ID extracted: {video_id}")

        # Step 2: Try transcript API first (fastest, no auth needed)
        print(f"🎬 [YT-HANDLER] Step 2: Attempting transcript API...")
        transcript = None
        
        for attempt in range(2):
            if attempt > 0:
                wait_time = 2 ** attempt
                print(f"🔄 [YT-HANDLER] Retry attempt {attempt + 1} after {wait_time}s delay...")
                time.sleep(wait_time)
            
            transcript = get_transcript_api(video_id)
            if transcript:
                break

        if transcript:
            print(f"✅ [YT-HANDLER] Transcript API successful! Length: {len(transcript)} chars")
        else:
            print(f"⚠️ [YT-HANDLER] Transcript API failed, trying yt-dlp with authentication...")

        # Step 3: Fallback to yt-dlp with robust authentication
        if not transcript:
            print(f"🎬 [YT-HANDLER] Step 3: Attempting yt-dlp with authentication strategies...")
            transcript = get_auto_caption_with_auth(url, auth_manager)
            
            if not transcript:
                print(f"❌ [YT-HANDLER] All methods failed - no transcript available")
                transcript = ""

        # Step 4: Save transcript
        print(f"🎬 [YT-HANDLER] Step 4: Saving transcript...")
        
        current_dir = Path(__file__).parent
        parsed_files_dir = current_dir.parent / "Parsed_files"
        parsed_files_dir.mkdir(exist_ok=True)
        
        filename = parsed_files_dir / f"{video_id}.txt"
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"### SOURCE: youtube\n### URL: {url}\n\n")
            f.write(transcript)

        processing_time = time.time() - start_time
        print(f"✅ [YT-HANDLER] Processing completed successfully!")
        print(f"✅ [YT-HANDLER] Total time: {processing_time:.2f}s")
        print(f"✅ [YT-HANDLER] Final transcript length: {len(transcript)} characters")
        print(f"✅ [YT-HANDLER] Saved to: {filename}")
        
        return transcript
        
    except Exception as e:
        processing_time = time.time() - start_time
        print(f"❌ [YT-HANDLER] Processing failed after {processing_time:.2f}s")
        print(f"❌ [YT-HANDLER] Error: {type(e).__name__} - {str(e)}")
        raise

# Example usage
if __name__ == "__main__":
    url = "https://www.youtube.com/watch?v=9EqrUK7ghho"
    transcript = process_youtube_video(url)
    print(transcript[:1000])
