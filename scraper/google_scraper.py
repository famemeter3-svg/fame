"""
Google Search API integration and web scraping module
Handles Google Custom Search API queries with key rotation and URL fetching with retry logic
"""

import logging
import time
import requests
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlparse
from datetime import datetime
from functools import wraps

from config import (
    GOOGLE_API_KEYS, GOOGLE_SEARCH_ENGINE_IDS,
    GOOGLE_SEARCH_API_URL, USER_AGENT,
    SCRAPER_RESULTS_PER_CELEBRITY, SCRAPER_MAX_RETRIES, SCRAPER_TIMEOUT_SEC,
    SCRAPER_DELAY_BETWEEN_REQUESTS, SCRAPER_BACKOFF_FACTOR, DEFAULT_CONFIDENCE_SCORE
)
from text_processor import clean_text

logger = logging.getLogger(__name__)


def exponential_backoff(func):
    """
    Decorator implementing exponential backoff retry logic

    Retries on network errors with exponential backoff delays
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        last_exception = None

        for attempt in range(1, SCRAPER_MAX_RETRIES + 1):
            try:
                return func(*args, **kwargs)
            except requests.RequestException as e:
                last_exception = e
                if attempt < SCRAPER_MAX_RETRIES:
                    # Calculate backoff: 0.5 * (0.5 ^ (attempt-1)) seconds
                    delay = SCRAPER_BACKOFF_FACTOR * (SCRAPER_BACKOFF_FACTOR ** (attempt - 1))
                    logger.warning(f"Attempt {attempt} failed: {e}. Retrying in {delay:.1f}s...")
                    time.sleep(delay)
                else:
                    logger.error(f"All {SCRAPER_MAX_RETRIES} attempts failed: {e}")

        raise last_exception

    return wrapper


class GoogleSearcher:
    """Google Custom Search API client with key rotation"""

    def __init__(self):
        """Initialize Google Search client"""
        self.api_keys = GOOGLE_API_KEYS
        self.search_engine_ids = GOOGLE_SEARCH_ENGINE_IDS
        self.current_key_index = 0
        self.session = self._create_session()

        logger.info(f"GoogleSearcher initialized with {len(self.api_keys)} API key(s)")

    @staticmethod
    def _create_session() -> requests.Session:
        """Create requests session with connection pooling"""
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=10,
            max_retries=0  # We handle retries manually
        )
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        session.headers.update({'User-Agent': USER_AGENT})
        return session

    def _rotate_api_key(self):
        """Rotate to next API key"""
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        logger.debug(f"Rotated to API key index {self.current_key_index}")

    def _get_current_key_pair(self) -> Tuple[str, str]:
        """Get current API key and search engine ID pair"""
        return self.api_keys[self.current_key_index], self.search_engine_ids[self.current_key_index]

    @exponential_backoff
    def search_google(self, query: str) -> List[str]:
        """
        Search Google Custom Search API for a query

        Args:
            query: Search query (e.g., "周杰倫 台灣 娛樂")

        Returns:
            List of URLs from top search results

        Raises:
            requests.RequestException: Network error
            ValueError: Invalid API response
        """
        try:
            api_key, search_engine_id = self._get_current_key_pair()

            params = {
                'q': query,
                'key': api_key,
                'cx': search_engine_id,
                'num': 10,  # Google API returns in chunks of 10, request 2 chunks = 20 results
                'start': 1
            }

            logger.debug(f"Querying Google API: {query} (key index: {self.current_key_index})")

            response = self.session.get(
                GOOGLE_SEARCH_API_URL,
                params=params,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()

            # Check for API errors
            if 'error' in data:
                error = data['error']
                raise ValueError(f"Google API error: {error.get('message', 'Unknown error')}")

            # Extract URLs
            urls = []
            if 'items' in data:
                urls = [item['link'] for item in data['items']]

            # Get second page of results
            params['start'] = 11
            response = self.session.get(
                GOOGLE_SEARCH_API_URL,
                params=params,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            if 'items' in data:
                urls.extend([item['link'] for item in data['items']])

            logger.info(f"Retrieved {len(urls)} URLs for query: {query}")

            # Rotate API key for next search
            self._rotate_api_key()

            return urls[:SCRAPER_RESULTS_PER_CELEBRITY]  # Return up to 20 results

        except Exception as e:
            logger.error(f"Google search failed for query '{query}': {e}")
            # Still rotate key even on failure for balanced distribution
            self._rotate_api_key()
            raise

    def test_connection(self) -> bool:
        """
        Test Google API connection

        Returns:
            True if connection successful
        """
        try:
            urls = self.search_google("test query")
            if urls:
                logger.info("Google API test successful")
                return True
            else:
                logger.warning("Google API returned no results for test query")
                return False
        except Exception as e:
            logger.error(f"Google API test failed: {e}")
            return False


class WebScraper:
    """Web page scraping and content extraction"""

    def __init__(self):
        """Initialize web scraper"""
        self.session = self._create_session()
        logger.info("WebScraper initialized")

    @staticmethod
    def _create_session() -> requests.Session:
        """Create requests session with connection pooling"""
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=20,
            pool_maxsize=20,
            max_retries=0
        )
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        session.headers.update({'User-Agent': USER_AGENT})
        return session

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path
            return domain.replace('www.', '')
        except Exception as e:
            logger.warning(f"Failed to extract domain from {url}: {e}")
            return ""

    @exponential_backoff
    def fetch_and_parse(self, url: str) -> Dict:
        """
        Fetch HTML from URL and parse content

        Args:
            url: URL to fetch

        Returns:
            Dictionary with:
                - status: success/failed/timeout
                - cleaned_text: Extracted text
                - content_length: Length of cleaned text
                - extraction_confidence: Confidence score
                - domain: Domain extracted from URL
                - processing_time_ms: Processing time
        """
        start_time = time.time()

        try:
            logger.debug(f"Fetching URL: {url}")

            # Fetch HTML with timeout
            response = self.session.get(
                url,
                timeout=SCRAPER_TIMEOUT_SEC,
                allow_redirects=True
            )
            response.raise_for_status()

            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if 'text' not in content_type and 'html' not in content_type:
                return {
                    "status": "failed",
                    "error": f"Invalid content type: {content_type}",
                    "domain": self._extract_domain(url),
                    "processing_time_ms": int((time.time() - start_time) * 1000)
                }

            # Clean text
            clean_result = clean_text(response.text)

            # Extract domain
            domain = self._extract_domain(url)

            processing_time = int((time.time() - start_time) * 1000)

            return {
                "status": clean_result.get("status", "success"),
                "cleaned_text": clean_result.get("cleaned_text", ""),
                "content_length": clean_result.get("content_length", 0),
                "extraction_confidence": clean_result.get("extraction_confidence", DEFAULT_CONFIDENCE_SCORE),
                "domain": domain,
                "processing_time_ms": processing_time
            }

        except requests.Timeout:
            logger.warning(f"Timeout fetching URL: {url}")
            return {
                "status": "timeout",
                "error": "Request timeout",
                "domain": self._extract_domain(url),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        except requests.RequestException as e:
            logger.warning(f"Failed to fetch URL {url}: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "domain": self._extract_domain(url),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        except Exception as e:
            logger.error(f"Unexpected error fetching {url}: {e}", exc_info=True)
            return {
                "status": "failed",
                "error": str(e),
                "domain": self._extract_domain(url),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }

    def scrape_urls(self, urls: List[str]) -> Tuple[List[Dict], List[str]]:
        """
        Scrape multiple URLs

        Args:
            urls: List of URLs to scrape

        Returns:
            Tuple of (successful_results, failed_urls)
        """
        results = []
        failed_urls = []

        for url in urls:
            # Add delay between requests
            time.sleep(SCRAPER_DELAY_BETWEEN_REQUESTS / 1000)

            result = self.fetch_and_parse(url)

            if result["status"] == "success" or result["status"] == "partial":
                results.append({
                    "original_url": url,
                    "cleaned_text": result.get("cleaned_text", ""),
                    "domain": result.get("domain", ""),
                    "content_length": result.get("content_length", 0),
                    "extraction_confidence": result.get("extraction_confidence", DEFAULT_CONFIDENCE_SCORE),
                    "processing_time_ms": result.get("processing_time_ms", 0)
                })
            else:
                failed_urls.append({
                    "url": url,
                    "error": result.get("error", "Unknown error"),
                    "status": result["status"]
                })

        logger.info(f"Scraped {len(results)} URLs successfully, {len(failed_urls)} failed")
        return results, failed_urls
