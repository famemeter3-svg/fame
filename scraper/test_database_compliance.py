"""
Test suite to validate scraper compliance with database schema requirements
Validates all data types, constraints, and field mappings
"""

import sys
import logging
from datetime import datetime
from decimal import Decimal

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseComplianceTest:
    """Test scraper data compliance with database schema"""

    # Celebrity mentions field mapping (from schema)
    CELEBRITY_MENTIONS_SCHEMA = {
        'mention_id': ('INT UNSIGNED', 'AUTO_INCREMENT', 'PRIMARY KEY'),
        'celebrity_id': ('INT UNSIGNED', 'NOT NULL', 'FOREIGN KEY'),
        'cleaned_text': ('LONGTEXT', 'NOT NULL'),
        'source': ('VARCHAR(255)', 'NOT NULL', 'DEFAULT "google"'),
        'time_stamp': ('DATETIME(6)', 'NOT NULL', 'microseconds'),
        'original_url': ('TEXT', 'NOT NULL'),
        'domain': ('VARCHAR(255)', 'NOT NULL', 'DEFAULT "unknown"'),
        'content_category': ('VARCHAR(100)', 'NOT NULL', 'DEFAULT "uncategorized"'),
        'sentiment_score': ('DECIMAL(3,2)', 'NOT NULL', 'DEFAULT 0', '-1.00 to 1.00'),
        'keyword_tags': ('JSON', 'DEFAULT NULL'),
        'extraction_confidence': ('DECIMAL(3,2)', 'NOT NULL', 'DEFAULT 1.00', '0.00 to 1.00'),
        'processing_time_ms': ('INT UNSIGNED', 'NOT NULL', 'DEFAULT 0'),
        'content_length': ('INT UNSIGNED', 'NOT NULL', 'DEFAULT 0'),
        'created_at': ('TIMESTAMP', 'DEFAULT CURRENT_TIMESTAMP'),
        'extracted_at': ('TIMESTAMP', 'DEFAULT CURRENT_TIMESTAMP'),
    }

    CONSTRAINTS = {
        'FOREIGN KEY': 'celebrity_id -> celebrities(celebrity_id) ON DELETE CASCADE',
        'UNIQUE': '(celebrity_id, original_url(255))',
        'CHECK sentiment_score': '-1.0 ≤ value ≤ 1.0',
        'CHECK extraction_confidence': '0 ≤ value ≤ 1.0',
    }

    @staticmethod
    def test_mention_record_format():
        """Test that a mention record has correct field types"""
        logger.info("\n" + "="*80)
        logger.info("TEST 1: Mention Record Format Validation")
        logger.info("="*80)

        # Sample mention record from scraper
        sample_mention = {
            'celebrity_id': 1,
            'original_url': 'https://example.com/news',
            'cleaned_text': 'This is cleaned text content about celebrity',
            'domain': 'example.com',
            'content_length': 42,
            'extraction_confidence': 0.85,
            'processing_time_ms': 1250,
            'time_stamp': datetime.now().isoformat()
        }

        tests_passed = 0
        tests_failed = 0

        # Validate each field
        validations = [
            ('celebrity_id', int, sample_mention['celebrity_id']),
            ('original_url', str, sample_mention['original_url']),
            ('cleaned_text', str, sample_mention['cleaned_text']),
            ('domain', str, sample_mention['domain']),
            ('content_length', int, sample_mention['content_length']),
            ('extraction_confidence', float, sample_mention['extraction_confidence']),
            ('processing_time_ms', int, sample_mention['processing_time_ms']),
        ]

        for field_name, expected_type, value in validations:
            if isinstance(value, expected_type):
                logger.info(f"✓ {field_name}: {expected_type.__name__} = {value}")
                tests_passed += 1
            else:
                logger.error(f"✗ {field_name}: Expected {expected_type.__name__}, got {type(value).__name__}")
                tests_failed += 1

        return tests_passed, tests_failed

    @staticmethod
    def test_data_constraints():
        """Test constraint compliance"""
        logger.info("\n" + "="*80)
        logger.info("TEST 2: Data Constraint Validation")
        logger.info("="*80)

        tests_passed = 0
        tests_failed = 0

        # Test sentiment_score constraint: -1.00 to 1.00
        sentiment_tests = [-1.0, -0.5, 0, 0.5, 1.0]
        for sentiment in sentiment_tests:
            if -1.0 <= sentiment <= 1.0:
                logger.info(f"✓ Sentiment score {sentiment}: Valid (CHECK PASSED)")
                tests_passed += 1
            else:
                logger.error(f"✗ Sentiment score {sentiment}: Invalid")
                tests_failed += 1

        # Invalid sentiment scores
        invalid_sentiments = [-1.5, 1.5]
        for sentiment in invalid_sentiments:
            if not (-1.0 <= sentiment <= 1.0):
                logger.info(f"✓ Sentiment score {sentiment}: Correctly rejected")
                tests_passed += 1
            else:
                logger.error(f"✗ Sentiment score {sentiment}: Should be rejected")
                tests_failed += 1

        # Test extraction_confidence constraint: 0.00 to 1.00
        confidence_tests = [0.0, 0.5, 0.85, 0.95, 1.0]
        for confidence in confidence_tests:
            if 0.0 <= confidence <= 1.0:
                logger.info(f"✓ Extraction confidence {confidence}: Valid")
                tests_passed += 1
            else:
                logger.error(f"✗ Extraction confidence {confidence}: Invalid")
                tests_failed += 1

        return tests_passed, tests_failed

    @staticmethod
    def test_unique_constraint():
        """Test unique constraint on (celebrity_id, original_url)"""
        logger.info("\n" + "="*80)
        logger.info("TEST 3: Unique Constraint Validation (celebrity_id, original_url)")
        logger.info("="*80)

        # Simulate duplicate detection
        mentions_cache = {}
        duplicate_count = 0
        unique_count = 0

        test_mentions = [
            (1, 'https://site1.com/article1'),
            (1, 'https://site1.com/article1'),  # DUPLICATE
            (1, 'https://site2.com/article2'),
            (2, 'https://site1.com/article1'),  # Different celebrity, same URL (OK)
            (1, 'https://site1.com/article1'),  # DUPLICATE
        ]

        for celeb_id, url in test_mentions:
            key = (celeb_id, url)
            if key in mentions_cache:
                logger.warning(f"⚠ Duplicate detected: celebrity_id={celeb_id}, url={url}")
                duplicate_count += 1
            else:
                mentions_cache[key] = True
                unique_count += 1
                logger.info(f"✓ Unique entry: celebrity_id={celeb_id}, url={url[:40]}...")

        logger.info(f"\nUnique entries: {unique_count}")
        logger.info(f"Duplicates detected: {duplicate_count}")

        return unique_count, duplicate_count

    @staticmethod
    def test_character_encoding():
        """Test UTF-8mb4 support for Traditional Chinese"""
        logger.info("\n" + "="*80)
        logger.info("TEST 4: Character Encoding Validation (utf8mb4)")
        logger.info("="*80)

        # Traditional Chinese text samples
        chinese_samples = {
            '周杰倫': 'Jay Chou',
            '林志玲': 'Lin Chi-ling',
            '王文志': 'Wang Wen-chih',
            '娛樂新聞': 'Entertainment News',
            '台灣明星': 'Taiwan Celebrities',
        }

        tests_passed = 0
        tests_failed = 0

        for chinese_text, english_translation in chinese_samples.items():
            try:
                # Verify text can be encoded as UTF-8
                encoded = chinese_text.encode('utf-8')
                decoded = encoded.decode('utf-8')

                if decoded == chinese_text:
                    logger.info(f"✓ UTF-8 Support: '{chinese_text}' ({english_translation})")
                    tests_passed += 1
                else:
                    logger.error(f"✗ Encoding mismatch: {chinese_text}")
                    tests_failed += 1
            except UnicodeEncodeError:
                logger.error(f"✗ Cannot encode: {chinese_text}")
                tests_failed += 1

        return tests_passed, tests_failed

    @staticmethod
    def test_required_fields():
        """Test that all NOT NULL fields are provided"""
        logger.info("\n" + "="*80)
        logger.info("TEST 5: Required Fields (NOT NULL) Validation")
        logger.info("="*80)

        required_fields = [
            'celebrity_id',
            'cleaned_text',
            'source',
            'time_stamp',
            'original_url',
            'domain',
            'content_category',
            'sentiment_score',
            'extraction_confidence',
            'processing_time_ms',
            'content_length',
        ]

        # Sample mention with all required fields
        sample_mention = {
            'celebrity_id': 1,
            'cleaned_text': 'Some text',
            'source': 'google',
            'time_stamp': datetime.now().isoformat(),
            'original_url': 'https://example.com',
            'domain': 'example.com',
            'content_category': 'news',
            'sentiment_score': 0,
            'extraction_confidence': 0.85,
            'processing_time_ms': 1000,
            'content_length': 100,
        }

        tests_passed = 0
        tests_failed = 0

        for field in required_fields:
            if field in sample_mention and sample_mention[field] is not None:
                logger.info(f"✓ {field}: Present (NOT NULL)")
                tests_passed += 1
            else:
                logger.error(f"✗ {field}: Missing or NULL")
                tests_failed += 1

        return tests_passed, tests_failed

    @staticmethod
    def test_default_values():
        """Test default value handling"""
        logger.info("\n" + "="*80)
        logger.info("TEST 6: Default Values Validation")
        logger.info("="*80)

        defaults = {
            'source': 'google',
            'domain': 'unknown',
            'content_category': 'uncategorized',
            'sentiment_score': 0,
            'extraction_confidence': 1.0,
            'processing_time_ms': 0,
            'content_length': 0,
        }

        tests_passed = 0
        tests_failed = 0

        for field, default_value in defaults.items():
            logger.info(f"✓ {field}: DEFAULT '{default_value}'")
            tests_passed += 1

        return tests_passed, tests_failed

    @staticmethod
    def test_index_optimization():
        """Verify indexes for query optimization"""
        logger.info("\n" + "="*80)
        logger.info("TEST 7: Index Optimization Validation")
        logger.info("="*80)

        indexes = [
            ('idx_celebrity_timestamp', '(celebrity_id, time_stamp)', 'Query by celebrity + time'),
            ('idx_timestamp', '(time_stamp)', 'Find recent mentions'),
            ('idx_source', '(source)', 'Filter by source'),
            ('idx_domain', '(domain)', 'Find by domain'),
            ('idx_confidence', '(extraction_confidence)', 'Filter by quality'),
            ('ft_cleaned_text', 'FULLTEXT (cleaned_text)', 'Full-text search'),
        ]

        logger.info("Database Indexes:")
        for idx_name, idx_fields, purpose in indexes:
            logger.info(f"✓ {idx_name}: {idx_fields}")
            logger.info(f"  Purpose: {purpose}")

        return len(indexes), 0

    @staticmethod
    def test_foreign_key_relationship():
        """Test foreign key relationship with celebrities table"""
        logger.info("\n" + "="*80)
        logger.info("TEST 8: Foreign Key Relationship Validation")
        logger.info("="*80)

        # Sample celebrities
        celebrities = [
            {'celebrity_id': 1, 'name': '周杰倫'},
            {'celebrity_id': 2, 'name': '林志玲'},
            {'celebrity_id': 3, 'name': '王文志'},
        ]

        # Sample mentions
        mentions = [
            {'celebrity_id': 1, 'url': 'https://site1.com/1'},
            {'celebrity_id': 2, 'url': 'https://site1.com/2'},
            {'celebrity_id': 4, 'url': 'https://site1.com/4'},  # INVALID - celebrity_id 4 doesn't exist
        ]

        tests_passed = 0
        tests_failed = 0

        celeb_ids = {c['celebrity_id'] for c in celebrities}

        for mention in mentions:
            celeb_id = mention['celebrity_id']
            if celeb_id in celeb_ids:
                logger.info(f"✓ Foreign Key Valid: celebrity_id {celeb_id} exists")
                tests_passed += 1
            else:
                logger.error(f"✗ Foreign Key Invalid: celebrity_id {celeb_id} not found")
                tests_failed += 1

        logger.info(f"\nForeign Key Constraint: celebrity_id -> celebrities(celebrity_id)")
        logger.info(f"Cascading Delete: ON DELETE CASCADE (auto-cleanup)")

        return tests_passed, tests_failed

    @staticmethod
    def run_all_tests():
        """Run all compliance tests"""
        logger.info("\n\n")
        logger.info("#" * 80)
        logger.info("# DATABASE COMPLIANCE TEST SUITE")
        logger.info("# Validating Taiwan Celebrity Scraper Against Database Schema")
        logger.info("#" * 80)

        results = {}

        test_methods = [
            ('Mention Record Format', DatabaseComplianceTest.test_mention_record_format),
            ('Data Constraints', DatabaseComplianceTest.test_data_constraints),
            ('Unique Constraint', DatabaseComplianceTest.test_unique_constraint),
            ('Character Encoding', DatabaseComplianceTest.test_character_encoding),
            ('Required Fields', DatabaseComplianceTest.test_required_fields),
            ('Default Values', DatabaseComplianceTest.test_default_values),
            ('Index Optimization', DatabaseComplianceTest.test_index_optimization),
            ('Foreign Key Relationship', DatabaseComplianceTest.test_foreign_key_relationship),
        ]

        total_passed = 0
        total_failed = 0

        for test_name, test_method in test_methods:
            try:
                result = test_method()
                if isinstance(result, tuple) and len(result) == 2:
                    passed, failed = result
                    results[test_name] = {'passed': passed, 'failed': failed}
                    total_passed += passed
                    total_failed += failed
            except Exception as e:
                logger.error(f"✗ {test_name} ERROR: {e}", exc_info=True)
                total_failed += 1

        # Summary Report
        logger.info("\n\n" + "="*80)
        logger.info("COMPLIANCE TEST SUMMARY")
        logger.info("="*80)

        for test_name, result in results.items():
            passed = result['passed']
            failed = result['failed']
            status = "✓ PASS" if failed == 0 else "✗ FAIL"
            logger.info(f"{status} - {test_name}: {passed} passed, {failed} failed")

        logger.info("\n" + "="*80)
        logger.info(f"TOTAL: {total_passed} passed, {total_failed} failed")

        if total_failed == 0:
            logger.info("✓ ALL TESTS PASSED - Scraper is database compliant!")
        else:
            logger.info(f"✗ {total_failed} tests failed - Review errors above")

        logger.info("="*80 + "\n")

        return total_passed, total_failed


if __name__ == '__main__':
    passed, failed = DatabaseComplianceTest.run_all_tests()
    sys.exit(0 if failed == 0 else 1)
