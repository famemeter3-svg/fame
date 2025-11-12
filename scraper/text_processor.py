"""
Text processing module for cleaning and extracting content from HTML
Preserves Traditional Chinese characters and calculates extraction confidence
"""

import re
import logging
from typing import Dict, Tuple
from bs4 import BeautifulSoup
from config import MIN_CONTENT_LENGTH, DEFAULT_CONFIDENCE_SCORE, MIN_CONFIDENCE_SCORE

logger = logging.getLogger(__name__)


class TextCleaner:
    """Clean HTML and extract readable text content"""

    # HTML tags to completely remove (including content)
    REMOVE_TAGS = {'script', 'style', 'meta', 'link', 'noscript', 'iframe'}

    # Tags to extract but ignore structurally
    CONTENT_TAGS = {'p', 'div', 'section', 'article', 'main', 'span', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}

    @staticmethod
    def clean_html(html_content: str) -> str:
        """
        Parse HTML and extract clean text content

        Args:
            html_content: Raw HTML string

        Returns:
            Cleaned text content
        """
        try:
            soup = BeautifulSoup(html_content, 'lxml')
        except Exception as e:
            logger.warning(f"BeautifulSoup parsing failed with lxml: {e}, falling back to html.parser")
            try:
                soup = BeautifulSoup(html_content, 'html.parser')
            except Exception as e:
                logger.error(f"Failed to parse HTML: {e}")
                return ""

        # Remove specified tags and their content
        for tag_name in TextCleaner.REMOVE_TAGS:
            for tag in soup.find_all(tag_name):
                tag.decompose()

        # Remove common non-content elements
        for selector in ['nav', 'footer', 'sidebar', '.sidebar', '#sidebar', '.nav', '#nav', '.header', '#header', '.advertisement', '.ad']:
            for element in soup.select(selector):
                element.decompose()

        # Extract text
        text = soup.get_text(separator=' ', strip=True)
        return text

    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """
        Normalize whitespace in text

        Args:
            text: Text to normalize

        Returns:
            Text with normalized whitespace
        """
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)

        # Replace multiple newlines with single newline
        text = re.sub(r'\n\n+', '\n', text)

        # Replace tabs with space
        text = text.replace('\t', ' ')

        return text.strip()

    @staticmethod
    def remove_special_characters(text: str, preserve_unicode: bool = True) -> str:
        """
        Remove special characters while preserving useful content

        Args:
            text: Text to clean
            preserve_unicode: If True, preserve Chinese/Unicode characters

        Returns:
            Cleaned text
        """
        if preserve_unicode:
            # Keep: alphanumeric, Chinese characters (CJK), common punctuation, spaces
            # Chinese Unicode ranges:
            # \u4e00-\u9fff: CJK Unified Ideographs
            # \u3400-\u4dbf: CJK Unified Ideographs Extension A
            # \uf900-\ufaff: CJK Compatibility Ideographs
            pattern = r'[^\w\s\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\-\.,!?;:\(\)（）。，！？；：【】「」『』]'
            text = re.sub(pattern, '', text, flags=re.UNICODE)
        else:
            # Keep only ASCII alphanumeric and spaces
            pattern = r'[^\w\s]'
            text = re.sub(pattern, '', text)

        return text

    @staticmethod
    def calculate_confidence_score(
        original_length: int,
        cleaned_length: int,
        extraction_rate: float = None
    ) -> float:
        """
        Calculate extraction confidence score based on content preservation

        Args:
            original_length: Length of original HTML-stripped text
            cleaned_length: Length of final cleaned text
            extraction_rate: Optional pre-calculated extraction rate (cleaned/original)

        Returns:
            Confidence score between 0.0 and 1.0
        """
        if original_length == 0:
            return MIN_CONFIDENCE_SCORE

        # Calculate extraction rate if not provided
        if extraction_rate is None:
            extraction_rate = cleaned_length / original_length if original_length > 0 else 0

        # Confidence formula:
        # - High if we preserved most content (extraction_rate > 0.7)
        # - Medium if we preserved some content (extraction_rate > 0.3)
        # - Low if we preserved little content (extraction_rate < 0.3)
        if extraction_rate >= 0.7:
            confidence = 0.95
        elif extraction_rate >= 0.5:
            confidence = 0.85
        elif extraction_rate >= 0.3:
            confidence = 0.70
        elif extraction_rate >= 0.1:
            confidence = 0.50
        else:
            confidence = MIN_CONFIDENCE_SCORE

        return min(confidence, 1.0)


def clean_text(html_content: str) -> Dict[str, any]:
    """
    Main text cleaning function - cleans HTML and returns structured result

    Args:
        html_content: Raw HTML string from web page

    Returns:
        Dictionary with:
            - cleaned_text: Final clean text for storage
            - content_length: Length of cleaned text
            - extraction_confidence: Confidence score (0-1)
            - raw_text_length: Length before final cleaning
    """
    try:
        # Step 1: Extract text from HTML
        raw_text = TextCleaner.clean_html(html_content)
        raw_text_length = len(raw_text)

        if raw_text_length == 0:
            logger.warning("HTML extraction resulted in empty text")
            return {
                "cleaned_text": "",
                "content_length": 0,
                "extraction_confidence": MIN_CONFIDENCE_SCORE,
                "raw_text_length": 0,
                "status": "failed"
            }

        # Step 2: Normalize whitespace
        normalized_text = TextCleaner.normalize_whitespace(raw_text)

        # Step 3: Remove special characters (preserve Chinese)
        cleaned_text = TextCleaner.remove_special_characters(normalized_text, preserve_unicode=True)
        cleaned_length = len(cleaned_text)

        # Step 4: Calculate confidence
        confidence = TextCleaner.calculate_confidence_score(raw_text_length, cleaned_length)

        # Check if extraction met minimum threshold
        if cleaned_length < MIN_CONTENT_LENGTH:
            logger.warning(f"Extracted content too short: {cleaned_length} < {MIN_CONTENT_LENGTH}")
            status = "partial"
        else:
            status = "success"

        return {
            "cleaned_text": cleaned_text,
            "content_length": cleaned_length,
            "extraction_confidence": confidence,
            "raw_text_length": raw_text_length,
            "status": status
        }

    except Exception as e:
        logger.error(f"Error cleaning text: {e}", exc_info=True)
        return {
            "cleaned_text": "",
            "content_length": 0,
            "extraction_confidence": MIN_CONFIDENCE_SCORE,
            "raw_text_length": 0,
            "status": "error",
            "error": str(e)
        }


def extract_metadata_from_text(text: str, top_n: int = 5) -> Dict[str, any]:
    """
    Extract metadata from cleaned text (optional keyword analysis)

    Args:
        text: Cleaned text content
        top_n: Number of top keywords to extract

    Returns:
        Dictionary with metadata including top_keywords
    """
    try:
        # Simple keyword extraction: split into words, filter stopwords
        # For production, consider using TF-IDF or YAKE library

        # Common Chinese stopwords
        chinese_stopwords = {'的', '了', '是', '在', '不', '了', '我', '他', '她', '它', '们', '中', '上', '下', '和', '或', '及', '与', '但', '等', '个', '首', '个', '一', '一个'}

        # Split text into words and filter
        words = text.split()
        filtered_words = [w for w in words if len(w) > 1 and w not in chinese_stopwords]

        # Simple frequency count
        word_freq = {}
        for word in filtered_words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # Get top N keywords
        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:top_n]
        keywords = [{"keyword": k, "frequency": f} for k, f in top_keywords]

        return {
            "top_keywords": keywords,
            "unique_words": len(word_freq),
            "total_words": len(filtered_words)
        }

    except Exception as e:
        logger.warning(f"Error extracting metadata: {e}")
        return {
            "top_keywords": [],
            "unique_words": 0,
            "total_words": 0
        }
