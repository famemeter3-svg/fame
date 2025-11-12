"""
Database handler for MySQL integration
Manages connections, batch insertions, and job tracking
"""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import mysql.connector
from mysql.connector import pooling, Error as MySQLError

from config import (
    DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT, DB_CHARSET,
    DB_CONNECTION_LIMIT, DB_BATCH_SIZE
)

logger = logging.getLogger(__name__)


class DatabaseHandler:
    """Handle MySQL database connections and operations"""

    # Connection pool
    _pool = None

    @classmethod
    def initialize_pool(cls):
        """Initialize connection pool on first use"""
        if cls._pool is None:
            try:
                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="scraper_pool",
                    pool_size=DB_CONNECTION_LIMIT,
                    pool_reset_session=True,
                    host=DB_HOST,
                    user=DB_USER,
                    password=DB_PASS,
                    database=DB_NAME,
                    port=DB_PORT,
                    charset=DB_CHARSET,
                    autocommit=False
                )
                logger.info(f"MySQL connection pool initialized: {DB_HOST}:{DB_PORT}/{DB_NAME}")
            except MySQLError as e:
                logger.error(f"Failed to initialize connection pool: {e}")
                raise

    @classmethod
    def get_connection(cls):
        """Get connection from pool"""
        if cls._pool is None:
            cls.initialize_pool()

        try:
            conn = cls._pool.get_connection()
            return conn
        except MySQLError as e:
            logger.error(f"Failed to get connection from pool: {e}")
            raise

    @staticmethod
    def test_connection() -> bool:
        """
        Test database connection

        Returns:
            True if connection successful, False otherwise
        """
        try:
            conn = DatabaseHandler.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            logger.info("Database connection test successful")
            return True
        except MySQLError as e:
            logger.error(f"Database connection test failed: {e}")
            return False

    @staticmethod
    def insert_mention(
        connection,
        celebrity_id: int,
        original_url: str,
        cleaned_text: str,
        domain: str,
        content_length: int,
        extraction_confidence: float,
        processing_time_ms: int,
        time_stamp: str = None
    ) -> Tuple[bool, str]:
        """
        Insert a single mention into celebrity_mentions table

        Args:
            connection: MySQL connection object
            celebrity_id: ID of celebrity
            original_url: Source URL
            cleaned_text: Extracted and cleaned text
            domain: Domain extracted from URL
            content_length: Length of cleaned text
            extraction_confidence: Confidence score (0-1)
            processing_time_ms: Processing time in milliseconds
            time_stamp: Publication timestamp (defaults to NOW())

        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            cursor = connection.cursor()

            # Use current time if not provided
            if time_stamp is None:
                time_stamp = datetime.now().isoformat()

            # Insert query
            insert_query = """
                INSERT INTO celebrity_mentions (
                    celebrity_id, original_url, cleaned_text, domain,
                    content_length, extraction_confidence, processing_time_ms,
                    time_stamp, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """

            values = (
                celebrity_id,
                original_url,
                cleaned_text,
                domain,
                content_length,
                extraction_confidence,
                processing_time_ms,
                time_stamp
            )

            cursor.execute(insert_query, values)
            cursor.close()

            return True, "Mention inserted successfully"

        except MySQLError as e:
            if "Duplicate entry" in str(e) and "for key" in str(e):
                # Duplicate detected (unique constraint)
                logger.debug(f"Duplicate mention skipped: {celebrity_id} @ {original_url}")
                return False, "Duplicate URL for this celebrity"
            else:
                logger.error(f"Failed to insert mention: {e}")
                return False, f"Insert failed: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error inserting mention: {e}")
            return False, f"Unexpected error: {str(e)}"

    @staticmethod
    def batch_insert_mentions(
        connection,
        mentions: List[Dict]
    ) -> Tuple[int, int]:
        """
        Batch insert multiple mentions

        Args:
            connection: MySQL connection object
            mentions: List of mention dictionaries, each with keys:
                - celebrity_id, original_url, cleaned_text, domain,
                - content_length, extraction_confidence, processing_time_ms,
                - time_stamp (optional)

        Returns:
            Tuple of (inserted_count, skipped_count)
        """
        inserted = 0
        skipped = 0

        try:
            cursor = connection.cursor()

            for mention in mentions:
                try:
                    insert_query = """
                        INSERT INTO celebrity_mentions (
                            celebrity_id, original_url, cleaned_text, domain,
                            content_length, extraction_confidence, processing_time_ms,
                            time_stamp, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """

                    time_stamp = mention.get('time_stamp', datetime.now().isoformat())

                    values = (
                        mention['celebrity_id'],
                        mention['original_url'],
                        mention['cleaned_text'],
                        mention['domain'],
                        mention['content_length'],
                        mention['extraction_confidence'],
                        mention['processing_time_ms'],
                        time_stamp
                    )

                    cursor.execute(insert_query, values)
                    inserted += 1

                except MySQLError as e:
                    if "Duplicate entry" in str(e):
                        skipped += 1
                        logger.debug(f"Duplicate skipped: {mention['celebrity_id']} @ {mention['original_url']}")
                    else:
                        logger.warning(f"Failed to insert mention: {e}")
                        skipped += 1

            # Commit all inserts
            connection.commit()
            logger.info(f"Batch insert complete: {inserted} inserted, {skipped} skipped")

        except Exception as e:
            logger.error(f"Batch insert failed: {e}")
            connection.rollback()

        finally:
            cursor.close()

        return inserted, skipped

    @staticmethod
    def get_scraping_job_id(connection, celebrity_id: int = None) -> int:
        """
        Get or create scraping job record

        Args:
            connection: MySQL connection object
            celebrity_id: Celebrity ID (None for batch job)

        Returns:
            Job ID
        """
        try:
            cursor = connection.cursor()

            # Insert new job record
            insert_query = """
                INSERT INTO scraping_jobs (celebrity_id, status, start_time)
                VALUES (%s, %s, NOW())
            """

            cursor.execute(insert_query, (celebrity_id, "running"))
            connection.commit()
            job_id = cursor.lastrowid

            cursor.close()
            logger.info(f"Created scraping job {job_id} for celebrity {celebrity_id}")
            return job_id

        except MySQLError as e:
            logger.error(f"Failed to create scraping job: {e}")
            raise

    @staticmethod
    def update_scraping_job(
        connection,
        job_id: int,
        status: str = None,
        mentions_found: int = None,
        urls_processed: int = None,
        error_message: str = None
    ) -> bool:
        """
        Update scraping job status and progress

        Args:
            connection: MySQL connection object
            job_id: Job ID to update
            status: New status (running, completed, failed)
            mentions_found: Number of mentions found
            urls_processed: Number of URLs processed
            error_message: Error message if failed

        Returns:
            True if successful, False otherwise
        """
        try:
            cursor = connection.cursor()

            updates = []
            values = []

            if status:
                updates.append("status = %s")
                values.append(status)

            if mentions_found is not None:
                updates.append("mentions_found = %s")
                values.append(mentions_found)

            if urls_processed is not None:
                updates.append("urls_processed = %s")
                values.append(urls_processed)

            if error_message:
                updates.append("error_message = %s")
                values.append(error_message)

            # Always update end_time if status is completed or failed
            if status in ["completed", "failed"]:
                updates.append("end_time = NOW()")

            if not updates:
                return False

            values.append(job_id)

            update_query = f"UPDATE scraping_jobs SET {', '.join(updates)} WHERE job_id = %s"
            cursor.execute(update_query, values)
            connection.commit()

            cursor.close()
            logger.info(f"Updated job {job_id}: {', '.join(updates)}")
            return True

        except MySQLError as e:
            logger.error(f"Failed to update scraping job {job_id}: {e}")
            return False

    @staticmethod
    def get_all_celebrities(connection) -> List[Dict]:
        """
        Get all celebrities from database

        Args:
            connection: MySQL connection object

        Returns:
            List of celebrity dictionaries with celebrity_id and name
        """
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT celebrity_id, name FROM celebrities ORDER BY celebrity_id")
            celebrities = cursor.fetchall()
            cursor.close()
            logger.info(f"Retrieved {len(celebrities)} celebrities from database")
            return celebrities

        except MySQLError as e:
            logger.error(f"Failed to retrieve celebrities: {e}")
            return []

    @staticmethod
    def get_celebrity_mentions_count(connection, celebrity_id: int) -> int:
        """
        Get count of mentions for a celebrity

        Args:
            connection: MySQL connection object
            celebrity_id: Celebrity ID

        Returns:
            Number of mentions
        """
        try:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM celebrity_mentions WHERE celebrity_id = %s",
                (celebrity_id,)
            )
            count = cursor.fetchone()[0]
            cursor.close()
            return count

        except MySQLError as e:
            logger.error(f"Failed to get mention count for celebrity {celebrity_id}: {e}")
            return 0

    @staticmethod
    def close_connection(connection):
        """Close database connection"""
        try:
            if connection:
                connection.close()
                logger.debug("Database connection closed")
        except MySQLError as e:
            logger.warning(f"Error closing connection: {e}")
