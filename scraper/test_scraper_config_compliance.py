"""
Test scraper configuration compliance with database requirements
"""

import os
import sys
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ConfigComplianceTest:
    """Test scraper configuration against database requirements"""

    @staticmethod
    def test_config_imports():
        """Test that config.py can be imported and has required settings"""
        logger.info("\n" + "="*80)
        logger.info("TEST: Config Module Compliance")
        logger.info("="*80)

        try:
            from config import (
                GOOGLE_API_KEYS, GOOGLE_SEARCH_ENGINE_IDS,
                DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT,
                WORKER_COUNT, DB_BATCH_SIZE, CELEBRITIES_PER_BATCH,
                SCRAPER_RESULTS_PER_CELEBRITY,
                MIN_CONTENT_LENGTH, DEFAULT_CONFIDENCE_SCORE,
                LOG_LEVEL, LOG_FILE
            )

            logger.info("✓ All required config variables imported successfully")

            checks = [
                ("GOOGLE_API_KEYS", len(GOOGLE_API_KEYS) >= 1),
                ("GOOGLE_SEARCH_ENGINE_IDS", len(GOOGLE_SEARCH_ENGINE_IDS) >= 1),
                ("DB_HOST", DB_HOST is not None),
                ("DB_USER", DB_USER is not None),
                ("DB_NAME", DB_NAME is not None),
                ("WORKER_COUNT", WORKER_COUNT == 20),
                ("DB_BATCH_SIZE", DB_BATCH_SIZE == 50),
                ("SCRAPER_RESULTS_PER_CELEBRITY", SCRAPER_RESULTS_PER_CELEBRITY == 20),
                ("DEFAULT_CONFIDENCE_SCORE", 0 <= DEFAULT_CONFIDENCE_SCORE <= 1),
            ]

            passed = 0
            failed = 0

            for var_name, check in checks:
                if check:
                    logger.info(f"✓ {var_name}: Valid configuration")
                    passed += 1
                else:
                    logger.error(f"✗ {var_name}: Invalid configuration")
                    failed += 1

            return passed, failed

        except ImportError as e:
            logger.error(f"✗ Cannot import config: {e}")
            return 0, 1

    @staticmethod
    def test_module_imports():
        """Test that all required modules can be imported"""
        logger.info("\n" + "="*80)
        logger.info("TEST: Required Modules Import")
        logger.info("="*80)

        modules = [
            'config',
            'text_processor',
            'database_handler',
            'google_scraper',
            'scraping_pipeline',
        ]

        passed = 0
        failed = 0

        for module_name in modules:
            try:
                __import__(module_name)
                logger.info(f"✓ {module_name}: Module imported successfully")
                passed += 1
            except ImportError as e:
                logger.error(f"✗ {module_name}: Import failed - {e}")
                failed += 1

        return passed, failed

    @staticmethod
    def test_text_processor_functionality():
        """Test text processor with sample data"""
        logger.info("\n" + "="*80)
        logger.info("TEST: Text Processor Functionality")
        logger.info("="*80)

        try:
            from text_processor import clean_text

            # Sample HTML with Chinese text
            sample_html = '''
            <html>
            <head><script>alert('test');</script></head>
            <body>
                <nav>Navigation</nav>
                <article>
                    <h1>周杰倫新聞</h1>
                    <p>這是關於周杰倫的新聞文章。</p>
                    <p>他是台灣著名歌手。</p>
                </article>
                <footer>Footer content</footer>
            </body>
            </html>
            '''

            result = clean_text(sample_html)

            checks = [
                ("cleaned_text exists", 'cleaned_text' in result),
                ("cleaned_text not empty", len(result.get('cleaned_text', '')) > 0),
                ("content_length is int", isinstance(result.get('content_length'), int)),
                ("extraction_confidence is float", isinstance(result.get('extraction_confidence'), float)),
                ("confidence in range", 0 <= result.get('extraction_confidence', 0) <= 1),
                ("status present", 'status' in result),
            ]

            passed = 0
            failed = 0

            logger.info(f"Sample text length: {result.get('content_length')} characters")
            logger.info(f"Confidence score: {result.get('extraction_confidence')}")
            logger.info(f"Status: {result.get('status')}")

            for check_name, check_result in checks:
                if check_result:
                    logger.info(f"✓ {check_name}")
                    passed += 1
                else:
                    logger.error(f"✗ {check_name}")
                    failed += 1

            return passed, failed

        except Exception as e:
            logger.error(f"✗ Text processor test failed: {e}")
            return 0, 1

    @staticmethod
    def test_database_handler_structure():
        """Test database handler class structure"""
        logger.info("\n" + "="*80)
        logger.info("TEST: Database Handler Class Structure")
        logger.info("="*80)

        try:
            from database_handler import DatabaseHandler

            required_methods = [
                'initialize_pool',
                'get_connection',
                'test_connection',
                'insert_mention',
                'batch_insert_mentions',
                'get_scraping_job_id',
                'update_scraping_job',
                'get_all_celebrities',
                'close_connection',
            ]

            passed = 0
            failed = 0

            for method_name in required_methods:
                if hasattr(DatabaseHandler, method_name):
                    logger.info(f"✓ DatabaseHandler.{method_name}() exists")
                    passed += 1
                else:
                    logger.error(f"✗ DatabaseHandler.{method_name}() missing")
                    failed += 1

            return passed, failed

        except Exception as e:
            logger.error(f"✗ Database handler test failed: {e}")
            return 0, 1

    @staticmethod
    def test_google_scraper_structure():
        """Test Google scraper class structure"""
        logger.info("\n" + "="*80)
        logger.info("TEST: Google Scraper Class Structure")
        logger.info("="*80)

        try:
            from google_scraper import GoogleSearcher, WebScraper

            # Check GoogleSearcher
            gs_methods = [
                'search_google',
                'test_connection',
                '_rotate_api_key',
                '_get_current_key_pair',
            ]

            ws_methods = [
                'fetch_and_parse',
                'scrape_urls',
            ]

            passed = 0
            failed = 0

            logger.info("GoogleSearcher methods:")
            for method_name in gs_methods:
                if hasattr(GoogleSearcher, method_name):
                    logger.info(f"✓ GoogleSearcher.{method_name}() exists")
                    passed += 1
                else:
                    logger.error(f"✗ GoogleSearcher.{method_name}() missing")
                    failed += 1

            logger.info("\nWebScraper methods:")
            for method_name in ws_methods:
                if hasattr(WebScraper, method_name):
                    logger.info(f"✓ WebScraper.{method_name}() exists")
                    passed += 1
                else:
                    logger.error(f"✗ WebScraper.{method_name}() missing")
                    failed += 1

            return passed, failed

        except Exception as e:
            logger.error(f"✗ Google scraper test failed: {e}")
            return 0, 1

    @staticmethod
    def test_pipeline_structure():
        """Test scraping pipeline class structure"""
        logger.info("\n" + "="*80)
        logger.info("TEST: Scraping Pipeline Class Structure")
        logger.info("="*80)

        try:
            from scraping_pipeline import BatchScraper, scrape_celebrity_worker, scrape_all_celebrities

            required_methods = [
                'scrape_batch',
                'scrape_celebrity_single',
                '_batch_insert_mentions',
                'split_into_batches',
            ]

            passed = 0
            failed = 0

            for method_name in required_methods:
                if hasattr(BatchScraper, method_name):
                    logger.info(f"✓ BatchScraper.{method_name}() exists")
                    passed += 1
                else:
                    logger.error(f"✗ BatchScraper.{method_name}() missing")
                    failed += 1

            # Check worker function
            if callable(scrape_celebrity_worker):
                logger.info(f"✓ scrape_celebrity_worker() function exists")
                passed += 1
            else:
                logger.error(f"✗ scrape_celebrity_worker() function missing")
                failed += 1

            if callable(scrape_all_celebrities):
                logger.info(f"✓ scrape_all_celebrities() function exists")
                passed += 1
            else:
                logger.error(f"✗ scrape_all_celebrities() function missing")
                failed += 1

            return passed, failed

        except Exception as e:
            logger.error(f"✗ Pipeline test failed: {e}")
            return 0, 1

    @staticmethod
    def run_all_tests():
        """Run all configuration tests"""
        logger.info("\n\n")
        logger.info("#" * 80)
        logger.info("# SCRAPER CONFIGURATION COMPLIANCE TEST")
        logger.info("# Validating scraper implementation against requirements")
        logger.info("#" * 80)

        test_methods = [
            ('Config Module Compliance', ConfigComplianceTest.test_config_imports),
            ('Required Modules Import', ConfigComplianceTest.test_module_imports),
            ('Text Processor Functionality', ConfigComplianceTest.test_text_processor_functionality),
            ('Database Handler Structure', ConfigComplianceTest.test_database_handler_structure),
            ('Google Scraper Structure', ConfigComplianceTest.test_google_scraper_structure),
            ('Pipeline Structure', ConfigComplianceTest.test_pipeline_structure),
        ]

        total_passed = 0
        total_failed = 0
        results = {}

        for test_name, test_method in test_methods:
            try:
                passed, failed = test_method()
                results[test_name] = {'passed': passed, 'failed': failed}
                total_passed += passed
                total_failed += failed
            except Exception as e:
                logger.error(f"✗ {test_name} ERROR: {e}", exc_info=True)
                total_failed += 1

        # Summary
        logger.info("\n\n" + "="*80)
        logger.info("CONFIGURATION TEST SUMMARY")
        logger.info("="*80)

        for test_name, result in results.items():
            passed = result['passed']
            failed = result['failed']
            status = "✓ PASS" if failed == 0 else "✗ FAIL"
            logger.info(f"{status} - {test_name}: {passed} passed, {failed} failed")

        logger.info("\n" + "="*80)
        logger.info(f"TOTAL: {total_passed} passed, {total_failed} failed")

        if total_failed == 0:
            logger.info("✓ ALL CONFIGURATION TESTS PASSED")
        else:
            logger.info(f"✗ {total_failed} configuration tests failed")

        logger.info("="*80 + "\n")

        return total_passed, total_failed


if __name__ == '__main__':
    passed, failed = ConfigComplianceTest.run_all_tests()
    sys.exit(0 if failed == 0 else 1)
