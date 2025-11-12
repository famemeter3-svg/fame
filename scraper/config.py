"""
Configuration and constants for the Taiwan Celebrity Scraper
Loads environment variables from .env file
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# ============================================================================
# GOOGLE API CONFIGURATION (Support for 5 API Keys for quota management)
# ============================================================================
GOOGLE_API_KEYS = [
    os.getenv("GOOGLE_API_KEY_1", ""),
    os.getenv("GOOGLE_API_KEY_2", ""),
    os.getenv("GOOGLE_API_KEY_3", ""),
    os.getenv("GOOGLE_API_KEY_4", ""),
    os.getenv("GOOGLE_API_KEY_5", ""),
]
# Filter out empty keys
GOOGLE_API_KEYS = [key for key in GOOGLE_API_KEYS if key]

GOOGLE_SEARCH_ENGINE_IDS = [
    os.getenv("GOOGLE_SEARCH_ENGINE_ID_1", ""),
    os.getenv("GOOGLE_SEARCH_ENGINE_ID_2", ""),
    os.getenv("GOOGLE_SEARCH_ENGINE_ID_3", ""),
    os.getenv("GOOGLE_SEARCH_ENGINE_ID_4", ""),
    os.getenv("GOOGLE_SEARCH_ENGINE_ID_5", ""),
]
# Filter out empty IDs
GOOGLE_SEARCH_ENGINE_IDS = [id for id in GOOGLE_SEARCH_ENGINE_IDS if id]

# Validate API configuration
if not GOOGLE_API_KEYS:
    raise ValueError("No Google API keys found in environment variables. "
                     "Please set GOOGLE_API_KEY_1 through GOOGLE_API_KEY_5 in .env")

if not GOOGLE_SEARCH_ENGINE_IDS:
    raise ValueError("No Google Search Engine IDs found in environment variables. "
                     "Please set GOOGLE_SEARCH_ENGINE_ID_1 through GOOGLE_SEARCH_ENGINE_ID_5 in .env")

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "celeb_user")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "taiwan_celebrities")
DB_PORT = int(os.getenv("DB_PORT", 3306))

# Connection pool settings
DB_CONNECTION_LIMIT = int(os.getenv("DB_CONNECTION_LIMIT", 10))
DB_CHARSET = "utf8mb4"

# ============================================================================
# SCRAPING CONFIGURATION
# ============================================================================
# Number of search results to fetch per celebrity
SCRAPER_RESULTS_PER_CELEBRITY = int(os.getenv("SCRAPER_RESULTS_PER_CELEBRITY", 20))

# Delay between individual requests (milliseconds)
SCRAPER_DELAY_BETWEEN_REQUESTS = int(os.getenv("SCRAPER_DELAY_BETWEEN_REQUESTS", 1000))

# Timeout for individual HTTP requests (milliseconds)
SCRAPER_TIMEOUT_MS = int(os.getenv("SCRAPER_TIMEOUT", 10000))
SCRAPER_TIMEOUT_SEC = SCRAPER_TIMEOUT_MS / 1000

# Maximum retries for failed requests
SCRAPER_MAX_RETRIES = int(os.getenv("SCRAPER_MAX_RETRIES", 3))

# Backoff multiplier for exponential backoff (0.5 * backoff_factor^attempt)
SCRAPER_BACKOFF_FACTOR = 0.5

# ============================================================================
# MULTIPROCESSING CONFIGURATION
# ============================================================================
# Number of worker processes for parallel scraping
WORKER_COUNT = int(os.getenv("WORKER_COUNT", 20))

# Batch size for database inserts (insert every N mentions)
DB_BATCH_SIZE = int(os.getenv("DB_BATCH_SIZE", 50))

# Number of celebrities per batch (when splitting 100 celebrities into batches)
CELEBRITIES_PER_BATCH = int(os.getenv("CELEBRITIES_PER_BATCH", 20))

# ============================================================================
# SCHEDULING CONFIGURATION
# ============================================================================
# Cron schedule for daily scraping (default: 2:00 AM daily)
SCRAPER_SCHEDULE = os.getenv("SCRAPER_SCHEDULE", "0 2 * * *")

# Whether scheduled scraping is enabled
SCRAPER_ENABLED = os.getenv("SCRAPER_ENABLED", "true").lower() == "true"

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "scraper/logs/scraper.log")
FAILED_URLS_LOG = "scraper/logs/failed_urls.log"

# Log format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Max log file size before rotation (10 MB)
LOG_MAX_BYTES = 10 * 1024 * 1024

# Number of backup log files to keep
LOG_BACKUP_COUNT = 5

# ============================================================================
# TEXT EXTRACTION CONFIGURATION
# ============================================================================
# Confidence score thresholds
MIN_CONFIDENCE_SCORE = float(os.getenv("MIN_CONFIDENCE_SCORE", 0.5))
DEFAULT_CONFIDENCE_SCORE = float(os.getenv("DEFAULT_CONFIDENCE_SCORE", 0.85))

# Minimum content length for a valid extraction (characters)
MIN_CONTENT_LENGTH = int(os.getenv("MIN_CONTENT_LENGTH", 50))

# ============================================================================
# VALIDATION & CONSTANTS
# ============================================================================
VALID_STATUSES = ["pending", "running", "completed", "failed"]

# User-Agent string for HTTP requests
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
)

# Google Custom Search API endpoint
GOOGLE_SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_api_key_pair(index: int) -> tuple:
    """
    Get API key and search engine ID pair by index

    Args:
        index: 0-based index into API keys list

    Returns:
        Tuple of (api_key, search_engine_id)

    Raises:
        IndexError: If index out of range
    """
    if index >= len(GOOGLE_API_KEYS):
        raise IndexError(f"API key index {index} out of range. Available keys: {len(GOOGLE_API_KEYS)}")

    return GOOGLE_API_KEYS[index], GOOGLE_SEARCH_ENGINE_IDS[index]


def rotate_api_key_index(current_index: int) -> int:
    """
    Get next API key index (cycling through available keys)

    Args:
        current_index: Current API key index

    Returns:
        Next API key index
    """
    next_index = (current_index + 1) % len(GOOGLE_API_KEYS)
    return next_index


def validate_config() -> bool:
    """
    Validate that all required configuration is present

    Returns:
        True if valid, raises exception otherwise
    """
    errors = []

    if not GOOGLE_API_KEYS:
        errors.append("No Google API keys configured")

    if not GOOGLE_SEARCH_ENGINE_IDS:
        errors.append("No Google Search Engine IDs configured")

    if not DB_HOST:
        errors.append("Database host not configured")

    if not DB_USER:
        errors.append("Database user not configured")

    if len(GOOGLE_API_KEYS) != len(GOOGLE_SEARCH_ENGINE_IDS):
        errors.append("Number of API keys must match number of Search Engine IDs")

    if errors:
        raise ValueError("Configuration validation failed:\n" + "\n".join(f"  - {e}" for e in errors))

    return True


# Validate on module import
validate_config()
