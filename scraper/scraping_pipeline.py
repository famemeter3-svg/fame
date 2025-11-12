"""
Scraping pipeline orchestration with multiprocessing
Coordinates the workflow: search -> fetch -> clean -> batch insert
"""

import logging
import time
from typing import List, Dict, Tuple
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime

from config import WORKER_COUNT, DB_BATCH_SIZE, CELEBRITIES_PER_BATCH
from database_handler import DatabaseHandler
from google_scraper import GoogleSearcher
from crawl4ai_scraper import Crawl4AIScraper

logger = logging.getLogger(__name__)


def scrape_celebrity_worker(celebrity_data: Dict) -> Dict:
    """
    Worker function: scrape a single celebrity
    This function is designed to be run in a separate process

    Args:
        celebrity_data: Dictionary with:
            - celebrity_id: ID of celebrity
            - name: Name of celebrity (Traditional Chinese)

    Returns:
        Dictionary with:
            - celebrity_id: ID
            - mentions: List of mention dictionaries
            - failed_urls: List of failed URLs
            - error: Error message if any
    """
    try:
        celebrity_id = celebrity_data['celebrity_id']
        name = celebrity_data['name']

        logger.info(f"Starting scrape for celebrity {celebrity_id}: {name}")

        # Initialize Google searcher
        searcher = GoogleSearcher()

        # Search Google for this celebrity
        try:
            urls = searcher.search_google(name)
            if not urls:
                logger.warning(f"No URLs found for celebrity {celebrity_id}: {name}")
                return {
                    "celebrity_id": celebrity_id,
                    "mentions": [],
                    "failed_urls": [],
                    "error": "No search results found"
                }
        except Exception as e:
            logger.error(f"Google search failed for {name}: {e}")
            return {
                "celebrity_id": celebrity_id,
                "mentions": [],
                "failed_urls": [],
                "error": f"Google search failed: {str(e)}"
            }

        # Scrape URLs with Crawl4AI (async batch processing)
        scraper = Crawl4AIScraper()
        results, failed_urls = scraper.scrape_urls(urls)

        # Build mention records
        mentions = []
        for result in results:
            mention = {
                "celebrity_id": celebrity_id,
                "original_url": result["original_url"],
                "cleaned_text": result["cleaned_text"],
                "domain": result["domain"],
                "content_length": result["content_length"],
                "extraction_confidence": result["extraction_confidence"],
                "processing_time_ms": result["processing_time_ms"],
                "time_stamp": datetime.now().isoformat()
            }
            mentions.append(mention)

        logger.info(f"Completed scrape for {name}: {len(mentions)} mentions, {len(failed_urls)} failed URLs")

        return {
            "celebrity_id": celebrity_id,
            "mentions": mentions,
            "failed_urls": failed_urls,
            "error": None
        }

    except Exception as e:
        logger.error(f"Worker error processing celebrity {celebrity_data.get('celebrity_id')}: {e}", exc_info=True)
        return {
            "celebrity_id": celebrity_data.get('celebrity_id'),
            "mentions": [],
            "failed_urls": [],
            "error": f"Worker error: {str(e)}"
        }


class BatchScraper:
    """Orchestrate scraping with multiprocessing"""

    def __init__(self, worker_count: int = WORKER_COUNT):
        """
        Initialize batch scraper

        Args:
            worker_count: Number of parallel workers
        """
        self.worker_count = worker_count
        self.connection = None
        logger.info(f"BatchScraper initialized with {worker_count} workers")

    def scrape_batch(self, celebrities: List[Dict]) -> Tuple[int, int, List[Dict]]:
        """
        Scrape a batch of celebrities in parallel

        Args:
            celebrities: List of celebrity dictionaries (celebrity_id, name)

        Returns:
            Tuple of (mentions_count, failed_urls_count, all_failed_urls)
        """
        total_mentions = 0
        total_failed_urls = 0
        all_failed_urls = []

        logger.info(f"Starting batch scrape of {len(celebrities)} celebrities with {self.worker_count} workers")

        try:
            # Use ProcessPoolExecutor for parallel processing
            with ProcessPoolExecutor(max_workers=self.worker_count) as executor:
                # Submit all tasks
                futures = {
                    executor.submit(scrape_celebrity_worker, celeb): celeb
                    for celeb in celebrities
                }

                completed = 0
                # Process completed tasks as they finish
                for future in as_completed(futures):
                    try:
                        result = future.result(timeout=300)  # 5 minute timeout per celebrity

                        celebrity_id = result['celebrity_id']
                        mentions = result.get('mentions', [])
                        failed_urls = result.get('failed_urls', [])
                        error = result.get('error')

                        if error:
                            logger.warning(f"Celebrity {celebrity_id} had error: {error}")

                        # Batch insert mentions
                        if mentions:
                            inserted, skipped = self._batch_insert_mentions(mentions)
                            total_mentions += inserted
                            logger.info(f"Celebrity {celebrity_id}: {inserted} mentions inserted, {skipped} skipped")

                        # Collect failed URLs
                        if failed_urls:
                            total_failed_urls += len(failed_urls)
                            all_failed_urls.extend(failed_urls)

                        completed += 1
                        logger.debug(f"Progress: {completed}/{len(celebrities)} completed")

                    except Exception as e:
                        logger.error(f"Error processing completed future: {e}", exc_info=True)

            logger.info(f"Batch scrape complete: {total_mentions} mentions, {total_failed_urls} failed URLs")

        except Exception as e:
            logger.error(f"Batch scraping failed: {e}", exc_info=True)

        return total_mentions, total_failed_urls, all_failed_urls

    def scrape_celebrity_single(self, celebrity_id: int, name: str) -> Tuple[int, int, List[Dict]]:
        """
        Scrape a single celebrity (for testing/debugging)

        Args:
            celebrity_id: ID of celebrity
            name: Name of celebrity

        Returns:
            Tuple of (mentions_count, failed_urls_count, failed_urls_list)
        """
        logger.info(f"Starting single celebrity scrape: {celebrity_id} - {name}")

        result = scrape_celebrity_worker({
            'celebrity_id': celebrity_id,
            'name': name
        })

        mentions = result.get('mentions', [])
        failed_urls = result.get('failed_urls', [])

        # Batch insert mentions
        if mentions:
            inserted, skipped = self._batch_insert_mentions(mentions)
            logger.info(f"Inserted {inserted} mentions, skipped {skipped}")
        else:
            inserted = 0

        logger.info(f"Single scrape complete: {inserted} mentions, {len(failed_urls)} failed URLs")

        return inserted, len(failed_urls), failed_urls

    def _batch_insert_mentions(self, mentions: List[Dict]) -> Tuple[int, int]:
        """
        Batch insert mentions to database

        Args:
            mentions: List of mention dictionaries

        Returns:
            Tuple of (inserted_count, skipped_count)
        """
        try:
            if not mentions:
                return 0, 0

            # Get database connection
            self.connection = DatabaseHandler.get_connection()

            # Insert all mentions
            inserted, skipped = DatabaseHandler.batch_insert_mentions(
                self.connection,
                mentions
            )

            DatabaseHandler.close_connection(self.connection)
            return inserted, skipped

        except Exception as e:
            logger.error(f"Failed to batch insert mentions: {e}", exc_info=True)
            if self.connection:
                DatabaseHandler.close_connection(self.connection)
            return 0, len(mentions)

    @staticmethod
    def split_into_batches(celebrities: List[Dict], batch_size: int = CELEBRITIES_PER_BATCH) -> List[List[Dict]]:
        """
        Split celebrities into batches

        Args:
            celebrities: All celebrities
            batch_size: Size of each batch

        Returns:
            List of celebrity batches
        """
        batches = []
        for i in range(0, len(celebrities), batch_size):
            batch = celebrities[i:i + batch_size]
            batches.append(batch)
        logger.info(f"Split {len(celebrities)} celebrities into {len(batches)} batches of ~{batch_size} each")
        return batches


def scrape_all_celebrities() -> Tuple[int, int, List[Dict]]:
    """
    Main pipeline: scrape all celebrities in batches

    Returns:
        Tuple of (total_mentions, total_failed_urls, all_failed_urls)
    """
    try:
        # Get database connection
        connection = DatabaseHandler.get_connection()

        # Get all celebrities
        celebrities = DatabaseHandler.get_all_celebrities(connection)
        DatabaseHandler.close_connection(connection)

        if not celebrities:
            logger.error("No celebrities found in database")
            return 0, 0, []

        logger.info(f"Starting scrape of {len(celebrities)} celebrities")

        # Create job record
        connection = DatabaseHandler.get_connection()
        job_id = DatabaseHandler.get_scraping_job_id(connection, celebrity_id=None)
        DatabaseHandler.close_connection(connection)

        # Split into batches
        batches = BatchScraper.split_into_batches(celebrities, CELEBRITIES_PER_BATCH)

        # Process each batch
        total_mentions = 0
        total_failed_urls = 0
        all_failed_urls = []

        scraper = BatchScraper(worker_count=WORKER_COUNT)

        for batch_idx, batch in enumerate(batches, 1):
            logger.info(f"Processing batch {batch_idx}/{len(batches)} ({len(batch)} celebrities)")

            mentions, failed_urls, failed_url_list = scraper.scrape_batch(batch)
            total_mentions += mentions
            total_failed_urls += failed_urls
            all_failed_urls.extend(failed_url_list)

            # Update job progress
            connection = DatabaseHandler.get_connection()
            DatabaseHandler.update_scraping_job(
                connection,
                job_id,
                mentions_found=total_mentions,
                urls_processed=(batch_idx * CELEBRITIES_PER_BATCH * 20)  # Approximate
            )
            DatabaseHandler.close_connection(connection)

        # Mark job as completed
        connection = DatabaseHandler.get_connection()
        DatabaseHandler.update_scraping_job(
            connection,
            job_id,
            status="completed",
            mentions_found=total_mentions,
            urls_processed=(len(celebrities) * 20)
        )
        DatabaseHandler.close_connection(connection)

        logger.info(f"Scraping pipeline complete: {total_mentions} mentions, {total_failed_urls} failed URLs")

        return total_mentions, total_failed_urls, all_failed_urls

    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        return 0, 0, []
