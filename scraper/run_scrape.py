#!/usr/bin/env python3
"""
CLI entry point for the scraper
Supports single celebrity scraping and batch scraping
"""

import sys
import logging
import argparse
from datetime import datetime

from config import LOG_FILE, LOG_LEVEL, LOG_FORMAT, LOG_DATE_FORMAT, LOG_MAX_BYTES, LOG_BACKUP_COUNT, FAILED_URLS_LOG
from database_handler import DatabaseHandler
from scraping_pipeline import BatchScraper, scrape_all_celebrities


def setup_logging(verbose: bool = False) -> logging.Logger:
    """
    Setup logging configuration

    Args:
        verbose: If True, set to DEBUG level

    Returns:
        Logger instance
    """
    import logging.handlers
    import os

    # Ensure logs directory exists
    log_dir = os.path.dirname(LOG_FILE)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)

    # Determine log level
    level = logging.DEBUG if verbose else getattr(logging, LOG_LEVEL.upper(), logging.INFO)

    # Create logger
    logger = logging.getLogger()
    logger.setLevel(level)

    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))

    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


def save_failed_urls(failed_urls: list) -> None:
    """
    Save failed URLs to log file for manual retry

    Args:
        failed_urls: List of failed URL dictionaries
    """
    if not failed_urls:
        return

    try:
        with open(FAILED_URLS_LOG, 'a') as f:
            timestamp = datetime.now().isoformat()
            f.write(f"\n=== Failed URLs - {timestamp} ===\n")

            for failed_url in failed_urls:
                url = failed_url.get('url', 'Unknown')
                error = failed_url.get('error', 'Unknown error')
                status = failed_url.get('status', 'unknown')
                f.write(f"URL: {url}\n")
                f.write(f"Status: {status}\n")
                f.write(f"Error: {error}\n")
                f.write("---\n")

        logger = logging.getLogger(__name__)
        logger.info(f"Saved {len(failed_urls)} failed URLs to {FAILED_URLS_LOG}")

    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to save failed URLs: {e}")


def test_connections() -> bool:
    """
    Test database and API connections

    Returns:
        True if all tests pass, False otherwise
    """
    logger = logging.getLogger(__name__)

    logger.info("Testing database connection...")
    if not DatabaseHandler.test_connection():
        logger.error("Database connection test failed")
        return False
    logger.info("✓ Database connection successful")

    logger.info("Testing Google API connection...")
    from google_scraper import GoogleSearcher
    searcher = GoogleSearcher()
    if not searcher.test_connection():
        logger.error("Google API connection test failed")
        return False
    logger.info("✓ Google API connection successful")

    return True


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Taiwan Celebrity Scraper - Web scraping pipeline for Google Search results"
    )

    parser.add_argument(
        '--celebrity_id',
        type=int,
        help='Scrape single celebrity by ID'
    )
    parser.add_argument(
        '--batch',
        action='store_true',
        help='Scrape all 100 celebrities (batch mode)'
    )
    parser.add_argument(
        '--batch-start',
        type=int,
        help='Start batch scraping from celebrity ID (for resume)'
    )
    parser.add_argument(
        '--workers',
        type=int,
        default=20,
        help='Number of parallel workers (default: 20)'
    )
    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose logging (DEBUG level)'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Test database and API connections'
    )

    args = parser.parse_args()

    # Setup logging
    logger = setup_logging(verbose=args.verbose)
    logger.info("=" * 80)
    logger.info(f"Taiwan Celebrity Scraper started at {datetime.now().isoformat()}")
    logger.info("=" * 80)

    try:
        # Test connections if requested
        if args.test:
            logger.info("Running connection tests...")
            if test_connections():
                logger.info("All tests passed ✓")
                return 0
            else:
                logger.error("Connection tests failed")
                return 1

        # Validate arguments
        if not any([args.celebrity_id, args.batch, args.batch_start]):
            parser.print_help()
            logger.error("Must specify --celebrity_id, --batch, or --batch-start")
            return 1

        # Single celebrity scraping
        if args.celebrity_id:
            logger.info(f"Starting single celebrity scrape: ID {args.celebrity_id}")

            # Get celebrity details
            conn = DatabaseHandler.get_connection()
            celebrities = DatabaseHandler.get_all_celebrities(conn)
            DatabaseHandler.close_connection(conn)

            # Find celebrity
            celebrity = next((c for c in celebrities if c['celebrity_id'] == args.celebrity_id), None)

            if not celebrity:
                logger.error(f"Celebrity with ID {args.celebrity_id} not found")
                return 1

            logger.info(f"Found celebrity: {celebrity['name']}")

            # Scrape
            scraper = BatchScraper(worker_count=args.workers)
            mentions, failed_urls, failed_url_list = scraper.scrape_celebrity_single(
                args.celebrity_id,
                celebrity['name']
            )

            logger.info(f"✓ Scraping complete")
            logger.info(f"  Mentions found: {mentions}")
            logger.info(f"  Failed URLs: {failed_urls}")

            # Save failed URLs
            if failed_url_list:
                save_failed_urls(failed_url_list)

            return 0 if mentions > 0 else 1

        # Batch scraping
        if args.batch or args.batch_start:
            logger.info("Starting batch scrape of all celebrities")

            mentions, failed_urls, failed_url_list = scrape_all_celebrities()

            logger.info("=" * 80)
            logger.info(f"✓ Batch scraping complete")
            logger.info(f"  Total mentions: {mentions}")
            logger.info(f"  Total failed URLs: {failed_urls}")
            logger.info("=" * 80)

            # Save failed URLs
            if failed_url_list:
                save_failed_urls(failed_url_list)
                logger.warning(f"Failed URLs saved to {FAILED_URLS_LOG}")

            return 0

    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        return 1
    finally:
        logger.info(f"Scraper finished at {datetime.now().isoformat()}")
        logger.info("=" * 80)


if __name__ == '__main__':
    sys.exit(main())
