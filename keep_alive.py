#!/usr/bin/env python3
"""
Standalone keep-alive script for Azure free tier.
This script can be run as a cron job externally to ping the website
and prevent the Azure free tier server from sleeping.

Usage:
    python keep_alive.py

For cron job (runs every 5 minutes):
    */5 * * * * /usr/bin/python3 /path/to/keep_alive.py

Or use external services like:
- UptimeRobot (free): https://uptimerobot.com
- cron-job.org (free): https://cron-job.org
- EasyCron (free tier): https://www.easycron.com
"""

import httpx
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Website URL to ping
WEBSITE_URL = "https://fdc-pucit.org"

def ping_website():
    """Ping the website to keep Azure free tier server awake"""
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(WEBSITE_URL)
            logger.info(f"✅ Keep-alive ping successful: {WEBSITE_URL} - Status: {response.status_code}")
            return True
    except Exception as e:
        logger.error(f"❌ Keep-alive ping failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = ping_website()
    sys.exit(0 if success else 1)

