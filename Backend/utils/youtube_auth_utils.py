#!/usr/bin/env python3
"""
YouTube Authentication Utilities
Provides tools for managing YouTube authentication, cookies, and troubleshooting
"""

import json
import time
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class YouTubeAuthUtils:
    """Utility class for YouTube authentication management"""
    
    def __init__(self):
        self.backend_dir = Path(__file__).parent.parent
        self.cookies_path = self.backend_dir / "youtube_cookies.txt"
        self.config_path = self.backend_dir / "config" / "youtube_auth_config.json"
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load authentication configuration"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r') as f:
                    return json.load(f)
            else:
                print(f"⚠️ Config file not found: {self.config_path}")
                return self.get_default_config()
        except Exception as e:
            print(f"❌ Error loading config: {e}")
            return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """Get default configuration if file doesn't exist"""
        return {
            "authentication": {
                "global_settings": {
                    "cookie_expiry_hours": 24,
                    "max_retries_per_strategy": 2
                }
            }
        }
    
    def check_cookie_health(self) -> Dict[str, Any]:
        """Comprehensive cookie health check"""
        health_report = {
            "overall_status": "unknown",
            "file_exists": False,
            "file_size": 0,
            "age_hours": 0,
            "format_valid": False,
            "has_youtube_cookies": False,
            "estimated_expiry": None,
            "recommendations": []
        }
        
        print("🔍 [AUTH-UTILS] Running comprehensive cookie health check...")
        
        # Check file existence
        if not self.cookies_path.exists():
            health_report["overall_status"] = "missing"
            health_report["recommendations"].append("Create cookies file using browser extension or manual export")
            print(f"❌ [AUTH-UTILS] Cookies file not found: {self.cookies_path}")
            return health_report
        
        health_report["file_exists"] = True
        
        try:
            # File stats
            stat = self.cookies_path.stat()
            health_report["file_size"] = stat.st_size
            
            age_seconds = time.time() - stat.st_mtime
            health_report["age_hours"] = age_seconds / 3600
            
            # Estimate expiry
            expiry_hours = self.config["authentication"]["global_settings"]["cookie_expiry_hours"]
            health_report["estimated_expiry"] = datetime.fromtimestamp(stat.st_mtime + expiry_hours * 3600)
            
            if stat.st_size == 0:
                health_report["overall_status"] = "empty"
                health_report["recommendations"].append("Cookies file is empty - re-export cookies from browser")
                print(f"❌ [AUTH-UTILS] Cookies file is empty")
                return health_report
            
            # Content analysis
            with open(self.cookies_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Format validation
            non_comment_lines = [l for l in lines if not l.startswith('#') and l.strip()]
            has_netscape_header = any('netscape' in line.lower() for line in lines[:5])
            
            health_report["format_valid"] = has_netscape_header or len(non_comment_lines) > 0
            
            # YouTube-specific cookies
            youtube_lines = [l for l in lines if 'youtube.com' in l and not l.startswith('#')]
            health_report["has_youtube_cookies"] = len(youtube_lines) > 0
            
            # Overall status determination
            if health_report["age_hours"] > expiry_hours:
                health_report["overall_status"] = "expired"
                health_report["recommendations"].append(f"Cookies are {health_report['age_hours']:.1f} hours old - consider refreshing")
            elif not health_report["has_youtube_cookies"]:
                health_report["overall_status"] = "invalid"
                health_report["recommendations"].append("No YouTube cookies found - ensure you're logged into YouTube when exporting")
            elif not health_report["format_valid"]:
                health_report["overall_status"] = "malformed"
                health_report["recommendations"].append("Cookies file format appears invalid - re-export in Netscape format")
            else:
                health_report["overall_status"] = "healthy"
                health_report["recommendations"].append("Cookies appear healthy and up-to-date")
            
            # Age-based recommendations
            if health_report["age_hours"] > 12:
                health_report["recommendations"].append("Consider refreshing cookies for better reliability")
            
            print(f"✅ [AUTH-UTILS] Cookie health check complete: {health_report['overall_status']}")
            
        except Exception as e:
            health_report["overall_status"] = "error"
            health_report["recommendations"].append(f"Error reading cookies file: {e}")
            print(f"❌ [AUTH-UTILS] Error during health check: {e}")
        
        return health_report
    
    def generate_troubleshooting_report(self) -> str:
        """Generate a comprehensive troubleshooting report"""
        print("📋 [AUTH-UTILS] Generating troubleshooting report...")
        
        report_lines = [
            "=" * 60,
            "YOUTUBE AUTHENTICATION TROUBLESHOOTING REPORT",
            "=" * 60,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            ""
        ]
        
        # Cookie health check
        health = self.check_cookie_health()
        report_lines.extend([
            "🍪 COOKIE HEALTH CHECK:",
            f"   Status: {health['overall_status'].upper()}",
            f"   File exists: {health['file_exists']}",
            f"   File size: {health['file_size']} bytes",
            f"   Age: {health['age_hours']:.1f} hours",
            f"   Format valid: {health['format_valid']}",
            f"   Has YouTube cookies: {health['has_youtube_cookies']}",
            ""
        ])
        
        if health['recommendations']:
            report_lines.extend([
                "📝 RECOMMENDATIONS:",
                *[f"   • {rec}" for rec in health['recommendations']],
                ""
            ])
        
        # General troubleshooting tips
        report_lines.extend([
            "🔧 GENERAL TROUBLESHOOTING TIPS:",
            "   • Ensure you're logged into YouTube in your browser",
            "   • Export cookies while logged in and with an active session",
            "   • Use browser extensions like 'Get cookies.txt' for easy export",
            "   • Refresh cookies every 12-24 hours for best results",
            "   • Check that the video is public and has captions available",
            "   • Try different videos if one specific video fails",
            "",
            "🔗 USEFUL LINKS:",
            "   • yt-dlp cookie guide: https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies",
            "   • Get cookies.txt extension: https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid",
            "",
            "=" * 60
        ])
        
        report_text = "\n".join(report_lines)
        
        # Save report to file
        report_file = self.backend_dir / f"youtube_auth_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        print(f"📄 [AUTH-UTILS] Report saved to: {report_file}")
        return report_text

def main():
    """Main function for command-line usage"""
    import sys
    
    utils = YouTubeAuthUtils()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "health":
            health = utils.check_cookie_health()
            print(json.dumps(health, indent=2, default=str))
        elif command == "report":
            report = utils.generate_troubleshooting_report()
            print(report)
        else:
            print("Usage: python youtube_auth_utils.py [health|report]")
    else:
        # Interactive mode
        print("🔧 YouTube Authentication Utils")
        print("1. Cookie health check")
        print("2. Generate troubleshooting report")
        
        choice = input("Choose an option (1-2): ").strip()
        
        if choice == "1":
            health = utils.check_cookie_health()
            print(json.dumps(health, indent=2, default=str))
        elif choice == "2":
            report = utils.generate_troubleshooting_report()
            print(report)
        else:
            print("Invalid choice")

if __name__ == "__main__":
    main() 