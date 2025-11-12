"""
Crawl4AI-based web scraping module
Async web crawler with improved performance for batch URL processing
Replaces the synchronous WebScraper class with async batch processing capability
"""

import logging
import asyncio
import time
from typing import List, Dict, Tuple
from urllib.parse import urlparse

try:
    from crawl4ai import AsyncWebCrawler, CacheMode, MemoryAdaptiveDispatcher
except ImportError:
    raise ImportError(
        "crawl4ai is required. Install with: pip install crawl4ai>=0.3.0"
    )

from config import (
    SCRAPER_TIMEOUT_SEC, SCRAPER_DELAY_BETWEEN_REQUESTS,
    DEFAULT_CONFIDENCE_SCORE, SCRAPER_BACKOFF_FACTOR, SCRAPER_MAX_RETRIES
)
from text_processor import clean_text

logger = logging.getLogger(__name__)


class Crawl4AIScraper:
    """
    Async web scraper using crawl4ai's AsyncWebCrawler

    Features:
    - Async batch processing of multiple URLs simultaneously
    - Memory-adaptive concurrency control (MemoryAdaptiveDispatcher)
    - Automatic retry with exponential backoff
    - Cache mode for efficient repeated requests
    - Superior performance vs synchronous scraping
    """

    def __init__(self):
        """Initialize Crawl4AIScraper with async crawler"""
        self.crawler = None
        self.memory_dispatcher = None
        logger.info("Crawl4AIScraper initialized")

    async def _init_crawler(self):
        """
        Lazy initialize the AsyncWebCrawler
        Done async to avoid blocking during import
        """
        if self.crawler is None:
            # Memory-adaptive dispatcher: auto-scales concurrency based on available memory
            # memory_threshold_percent=90 means it scales down when 90% of memory is used
            # max_session_permit=20 caps concurrent requests
            self.memory_dispatcher = MemoryAdaptiveDispatcher(
                memory_threshold_percent=90,
                max_session_permit=20
            )

            self.crawler = AsyncWebCrawler(
                dispatcher=self.memory_dispatcher,
                timeout=SCRAPER_TIMEOUT_SEC
            )

            logger.info("AsyncWebCrawler initialized with MemoryAdaptiveDispatcher")

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

    @staticmethod
    async def _fetch_single_url(crawler, url: str, attempt: int = 1) -> Dict:
        """
        Fetch and parse a single URL with error handling

        Args:
            crawler: AsyncWebCrawler instance
            url: URL to fetch
            attempt: Current attempt number (for retry logic)

        Returns:
            Dictionary with scraped content and metadata
        """
        start_time = time.time()

        try:
            logger.debug(f"Fetching URL (attempt {attempt}/{SCRAPER_MAX_RETRIES}): {url}")

            # Use crawl4ai's AsyncWebCrawler
            # CacheMode.ENABLED: Use cache when available for efficiency
            result = await crawler.arun(
                url=url,
                cache_mode=CacheMode.ENABLED,
                javascript_enabled=True  # Enable for JavaScript-heavy sites
            )

            processing_time = int((time.time() - start_time) * 1000)

            # Check if crawl was successful
            if not result or not result.success:
                error_msg = result.error_message if result else "Unknown error"
                logger.warning(f"Failed to crawl {url}: {error_msg}")

                # Implement retry with exponential backoff for transient errors
                if attempt < SCRAPER_MAX_RETRIES and result and result.error_message:
                    # Backoff delay: 0.5 * (0.5 ^ (attempt-1)) seconds
                    backoff_delay = SCRAPER_BACKOFF_FACTOR * (SCRAPER_BACKOFF_FACTOR ** (attempt - 1))
                    await asyncio.sleep(backoff_delay)
                    return await Crawl4AIScraper._fetch_single_url(
                        crawler, url, attempt + 1
                    )

                return {
                    "status": "failed",
                    "error": error_msg,
                    "domain": Crawl4AIScraper._extract_domain(url),
                    "processing_time_ms": processing_time
                }

            # Extract markdown (crawl4ai provides clean markdown output)
            markdown_content = result.markdown or ""

            if not markdown_content:
                logger.warning(f"No content extracted from {url}")
                return {
                    "status": "failed",
                    "error": "No content extracted",
                    "domain": Crawl4AIScraper._extract_domain(url),
                    "processing_time_ms": processing_time
                }

            # Clean the markdown content
            clean_result = clean_text(markdown_content)

            domain = Crawl4AIScraper._extract_domain(url)

            logger.debug(f"Successfully crawled {url}: {clean_result.get('content_length', 0)} chars")

            return {
                "status": clean_result.get("status", "success"),
                "cleaned_text": clean_result.get("cleaned_text", ""),
                "content_length": clean_result.get("content_length", 0),
                "extraction_confidence": clean_result.get("extraction_confidence", DEFAULT_CONFIDENCE_SCORE),
                "domain": domain,
                "processing_time_ms": processing_time
            }

        except asyncio.TimeoutError:
            processing_time = int((time.time() - start_time) * 1000)
            logger.warning(f"Timeout crawling URL: {url}")

            # Retry on timeout (transient error)
            if attempt < SCRAPER_MAX_RETRIES:
                backoff_delay = SCRAPER_BACKOFF_FACTOR * (SCRAPER_BACKOFF_FACTOR ** (attempt - 1))
                await asyncio.sleep(backoff_delay)
                return await Crawl4AIScraper._fetch_single_url(
                    crawler, url, attempt + 1
                )

            return {
                "status": "timeout",
                "error": "Request timeout",
                "domain": Crawl4AIScraper._extract_domain(url),
                "processing_time_ms": processing_time
            }

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"Unexpected error crawling {url}: {e}", exc_info=True)
            return {
                "status": "failed",
                "error": str(e),
                "domain": Crawl4AIScraper._extract_domain(url),
                "processing_time_ms": processing_time
            }

    async def scrape_urls_async(self, urls: List[str]) -> Tuple[List[Dict], List[str]]:
        """
        Scrape multiple URLs concurrently using crawl4ai

        This is the main advantage: process multiple URLs in parallel
        instead of sequentially

        Args:
            urls: List of URLs to scrape

        Returns:
            Tuple of (successful_results, failed_urls)
        """
        await self._init_crawler()

        if not urls:
            return [], []

        logger.info(f"Starting async scrape of {len(urls)} URLs")

        # Create coroutine for each URL
        tasks = [
            self._fetch_single_url(self.crawler, url)
            for url in urls
        ]

        # Execute all tasks concurrently
        # The MemoryAdaptiveDispatcher will manage concurrency limits
        results = await asyncio.gather(*tasks, return_exceptions=False)

        # Separate successful results from failures
        successful_results = []
        failed_urls = []

        for url, result in zip(urls, results):
            if result["status"] == "success" or result["status"] == "partial":
                successful_results.append({
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

        logger.info(f"Async scrape complete: {len(successful_results)} successful, {len(failed_urls)} failed")

        return successful_results, failed_urls

    def scrape_urls(self, urls: List[str]) -> Tuple[List[Dict], List[str]]:
        """
        Synchronous wrapper for async scrape_urls_async

        This maintains compatibility with the existing scraping_pipeline.py
        which expects a synchronous interface.

        Args:
            urls: List of URLs to scrape

        Returns:
            Tuple of (successful_results, failed_urls)
        """
        # Create new event loop or use existing one
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        # Run the async function
        if loop.is_running():
            # If we're already in an async context, create a new loop in thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return loop.run_in_executor(pool, lambda: asyncio.run(self.scrape_urls_async(urls)))
        else:
            return loop.run_until_complete(self.scrape_urls_async(urls))

    async def close(self):
        """Close the crawler and clean up resources"""
        if self.crawler:
            await self.crawler.close()
            logger.info("Crawl4AIScraper closed")
