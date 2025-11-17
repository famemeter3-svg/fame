# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Taiwan Celebrity Tracker**, a full-stack application that monitors 100 Taiwan entertainment celebrities, scrapes mentions from Google Search results, calculates analytics metrics, and displays them in a React UI.

**Current Status**: Production-ready with operational backend and database. Frontend is under active development.

**Core tech stack:**
- Backend: Node.js (Express.js) + Python (Google scraper)
- Database: MySQL 8.0+ (production-hardened v2.0)
- Frontend: React 18 (ready for development)
- Ports: Backend (5000), Frontend (3000), MySQL (3306)

## Architecture

### System Overview

```
React Frontend (3000)
    ↓ API calls
Express Backend (5000)
    ↓ Database queries + async scraping
MySQL Database
    + Python Scraper Pipeline (Google API)
```

### Key Tables

- **celebrities**: 100 Taiwan entertainment celebrities (name in Traditional Chinese + English, category, status)
- **celebrity_mentions**: ~1,800 scraped mentions with cleaned text, metadata, and analysis (~18 per celebrity)
- **metrics_cache**: Pre-calculated metrics (mention frequency, velocity, trending score, popularity index, source diversity, top keywords)
- **scraping_jobs**: Job tracking for monitoring and debugging

### Data Flow

1. User triggers scraping via frontend
2. Backend queries 100 celebrities from database
3. For each celebrity: search Google API → fetch URLs → parse HTML → extract text → store in database
4. Calculate 6 metrics per celebrity
5. Cache results in metrics_cache
6. Frontend fetches data via API endpoints and displays in React UI

### API Endpoints Structure

**Celebrities:**
- `GET /api/celebrities` - list all with filters (status, category), sorting, pagination
- `GET /api/celebrities/:id` - single celebrity detail with statistics

**Metrics:**
- `GET /api/metrics/:id` - calculated metrics for celebrity
- `GET /api/metrics/:id/history` - metric trends over time

**Mentions:**
- `GET /api/mentions/:celebrity_id` - recent mentions for celebrity
- Query params: limit, offset, date_range, domain filter

## Common Development Commands

### Database Setup & Operations
```bash
# Initialize fresh database (includes user creation)
bash database/scripts/init-db.sh

# Import schema into existing database
mysql -u celeb_user -p taiwan_celebrities < database/schema.sql

# Seed 100 celebrities from JSON seed file
cd backend && node scripts/seed-celebrities.js

# Database monitoring & maintenance
bash database/scripts/check-table-growth.sh      # Size & growth rate
bash database/scripts/check-slow-queries.sh      # Performance analysis
bash database/scripts/optimize-tables.sh         # Defragment & reclaim space
bash database/scripts/backup-restore-test.sh    # Verify disaster recovery

# Backup & restore
bash database/scripts/backup-db.sh               # Creates timestamped backup
bash database/scripts/restore-db.sh <backup_file> # Restore from backup

# Migrate from v1.0 to v2.0 (safe, includes rollback)
mysql -u celeb_user -p taiwan_celebrities < database/migrations/v1_to_v2.sql
```

### Backend (Express.js, Node 16+)
```bash
# Install dependencies
cd backend && npm install

# Development (hot-reload with --watch flag)
npm run dev

# Production mode
npm start

# Seed celebrities data into database
npm run seed

# Health check endpoint
curl http://localhost:5000/health
```

### Scraper (Python 3.8+, uses Google Custom Search API)
```bash
cd scraper

# Install Python dependencies
pip install -r requirements.txt

# Run batch scraping for all 100 celebrities
python3 run_scrape.py --batch

# Scrape single celebrity by ID
python3 run_scrape.py --celebrity_id 1

# Scrape with retry logic
python3 run_scrape.py --batch --retries 3

# Validate database schema compliance
python3 test_database_compliance.py

# Validate scraper configuration
python3 test_scraper_config_compliance.py
```

### Frontend (React 18 + Vite)
```bash
# Install dependencies
cd frontend && npm install

# Development server (runs on http://localhost:3000 with hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Testing & Validation
```bash
# Health check
curl http://localhost:5000/health

# Database connectivity
curl http://localhost:5000/api/admin/health

# Database statistics
curl http://localhost:5000/api/admin/stats

# List all celebrities (with pagination)
curl "http://localhost:5000/api/celebrities?limit=10&offset=0"

# Filter by category
curl "http://localhost:5000/api/celebrities?category=Singer"

# Test database connection directly
mysql -h 127.0.0.1 -u celeb_user -p'0000' taiwan_celebrities -e "SELECT COUNT(*) FROM celebrities;"
```

## Environment Configuration

Key variables in `.env`:

**Database:**
- `DB_HOST`: MySQL host (default: localhost)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_USER`: MySQL username (default: celeb_user)
- `DB_PASS`: MySQL password
- `DB_NAME`: Database name (default: taiwan_celebrities)
- `DB_CONNECTION_LIMIT`: Connection pool size (default: 10)

**Backend API:**
- `PORT`: Backend port (default: 5000)
- `NODE_ENV`: Environment mode (development, production)
- `FRONTEND_URL`: Frontend origin for CORS (http://localhost:3000 for dev)

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 15 min = 900000)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

**Google API (for scraper):**
- `GOOGLE_API_KEY`: Google Custom Search API key
- `GOOGLE_SEARCH_ENGINE_ID`: Custom search engine ID

**Scraper:**
- `SCRAPER_BATCH_SIZE`: Celebrities per batch (default: 10)
- `SCRAPER_RESULTS_PER_CELEBRITY`: Results per search (default: 20)
- `SCRAPER_DELAY_SECONDS`: Delay between requests (default: 1)
- `SCRAPER_TIMEOUT_SECONDS`: Request timeout (default: 10)
- `SCRAPER_MAX_RETRIES`: Retry attempts (default: 3)
- `SCRAPER_SCHEDULE`: Cron format for scheduled scraping (e.g., `0 2 * * *` = daily at 2am)

**Metrics:**
- `METRICS_CACHE_DAYS`: Cache duration in days (default: 1 = daily recalculation)
- `METRICS_DEFAULT_PERIOD_DAYS`: Analysis period (default: 30)

**Frontend (Vite):**
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000)
- `VITE_API_TIMEOUT`: HTTP request timeout in milliseconds (default: 10000)
- `VITE_CACHE_DURATION`: Axios cache duration in milliseconds (default: 21600000 = 6 hours)

## Important Implementation Details

### MySQL Character Set
Always use `utf8mb4` with `utf8mb4_unicode_ci` collation for Traditional Chinese support. This is critical for storing celebrity names correctly.

### Foreign Key Relationships
- `celebrity_mentions.celebrity_id` → `celebrities.celebrity_id` (ON DELETE CASCADE)
- `metrics_cache.celebrity_id` → `celebrities.celebrity_id` (ON DELETE CASCADE)
- `scraping_jobs.celebrity_id` → `celebrities.celebrity_id` (ON DELETE CASCADE)

When deleting a celebrity, all related mentions, metrics, and jobs are automatically deleted.

### Unique Constraints
- `celebrities.name`: Each celebrity name is unique (prevents duplicates)
- `celebrity_mentions` (celebrity_id, original_url): Same URL not stored twice per celebrity

### Indexes for Performance
Core queries that should always be indexed:
- `celebrity_mentions (celebrity_id, time_stamp)` - main query pattern
- `celebrity_mentions (time_stamp)` - finding recent mentions
- `celebrity_mentions.cleaned_text` - full-text search
- `celebrities (status, category)` - filtering queries

### Google API Rate Limiting
- Free tier: 100 queries/day (1 per celebrity = 100 total)
- Each search counts as 1 query
- Paid tier available: $5 per 1,000 additional queries
- Store API key in `.env` (never commit to git)

### Scraping Pipeline Details
Python scraper handles:
1. Google Custom Search API querying (gets 20 URLs per celebrity)
2. HTML fetching with timeout and retry logic
3. Text extraction and cleaning (removes scripts, styles, nav elements)
4. Metadata extraction (domain, timestamp, sentiment, keywords)
5. Database insertion with duplicate detection

### Metrics Calculation
6 key metrics calculated per celebrity:
1. **Mention Frequency**: Total count of mentions in period
2. **Mention Velocity**: Mentions per day (rate of change)
3. **Trending Score**: Weighted formula showing momentum
4. **Popularity Index**: Overall fame level (0-100 scale)
5. **Source Diversity**: Number of unique domains mentioning the celebrity
6. **Top Keywords**: Most frequent keywords in mentions (JSON array)

Metrics are cached to avoid recalculation on every API request.

## Backend Code Patterns & Conventions

### Module System & Imports
- Uses ES6 modules (`"type": "module"` in package.json)
- All imports use explicit `.js` extension (e.g., `import x from './config/database.js'`)
- Avoid CommonJS (`require`) - use ES6 `import/export` only

### Route Implementation Pattern
All route handlers follow this structure:
1. Input validation (query params, body, path params)
2. Get database connection from pool
3. Build parameterized SQL query with `?` placeholders (SQL injection prevention)
4. Execute query with parameters
5. Release connection in `finally` block (guaranteed cleanup)
6. Return JSON: `{ success: boolean, data/error, count }`

Example pattern from routes:
```javascript
export default (app) => {
  app.get('/api/endpoint', async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.query('SELECT * FROM table WHERE id = ?', [req.params.id]);
      res.json({ success: true, data: result, count: result.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });
};
```

### Database Connection Pooling
- Uses `mysql2/promise` for async/await support
- Pool initialized in `config/database.js`
- Always release connections in `finally` blocks to prevent exhaustion
- Pool size: `DB_CONNECTION_LIMIT` (default: 10, production: 20)

### Error Handling
- Global error handler middleware in `middleware/errorHandler.js`
- All endpoints should use try/catch with proper error responses
- Avoid logging sensitive data (URLs, API keys)

## Frontend Code Patterns & Architecture

### Frontend Module System & Structure
- Uses ES6 modules (`import`/`export`) with Vite
- Environment variables via `import.meta.env.VITE_*` (e.g., `VITE_API_URL`, `VITE_API_TIMEOUT`)
- Zustand stores for state management (minimal, localStorage integrated)
- Axios API client with automatic caching and auth token injection

### Frontend File Structure
```
frontend/
├── src/
│   ├── App.jsx                  # Main router setup with all routes
│   ├── index.jsx                # Entry point
│   ├── components/
│   │   ├── cards/               # Reusable card components (5 different types)
│   │   │   ├── CelebrityCard.jsx      # Celebrity display with 3 rendering modes
│   │   │   ├── MetricsCard.jsx        # Metrics visualization
│   │   │   ├── StatsCard.jsx          # Statistics display
│   │   │   ├── MentionsCard.jsx       # Recent mentions list
│   │   │   └── TrendingCard.jsx       # Trending indicators
│   │   ├── layouts/             # Layout wrappers
│   │   ├── forms/               # Form components
│   │   ├── shared/              # Shared UI elements (buttons, modals, etc.)
│   │   └── ProtectedRoute.jsx   # Route protection wrapper for admin pages
│   ├── pages/
│   │   ├── Login.jsx            # Authentication page
│   │   ├── public/              # Public pages (no auth required)
│   │   │   ├── CelebrityList.jsx        # Main celebrity list (pagination, filters)
│   │   │   ├── Trending.jsx             # Trending celebrities
│   │   │   ├── CelebrityDetail.jsx      # Single celebrity detail view
│   │   │   ├── MentionsDetail.jsx       # Celebrity mentions detail page
│   │   │   └── CardEmbed.jsx            # Embedded card rendering (multiple modes)
│   │   └── admin/               # Admin pages (protected by ProtectedRoute)
│   │       ├── AdminDashboard.jsx       # Admin overview
│   │       ├── ScrapeControl.jsx        # Trigger and monitor scraping jobs
│   │       ├── DataManagement.jsx       # Manage celebrities and data
│   │       └── Analytics.jsx            # Analytics and metrics view
│   ├── services/
│   │   └── api.js               # Centralized API client with caching & auth
│   ├── context/                 # Zustand state stores
│   │   ├── authStore.js         # Authentication state (token, user, login/logout)
│   │   └── themeStore.js        # Theme state (light/dark mode)
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── styles/                  # Global and Tailwind CSS configuration
│   └── assets/                  # Images, fonts, static files
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies and scripts
└── tailwind.config.js           # Tailwind CSS configuration
```

### API Client Pattern (services/api.js)
All HTTP requests go through centralized `api.js`:
```javascript
// Usage in components
import { fetchCelebrities, fetchMetrics } from '../services/api.js';

const response = await fetchCelebrities(limit, offset, filters);
// Returns axios response with:
// - Built-in 6-hour cache (configurable)
// - Automatic auth token injection via request interceptor
// - 401 error handling (auto-logout on auth failure)
// - Base URL pointing to backend (VITE_API_URL env var)
```

### State Management Pattern (Zustand)
```javascript
import { create } from 'zustand';

const store = create((set) => ({
  // State
  data: [],
  isLoading: false,
  error: null,

  // Actions
  setData: (data) => set({ data }),
  setError: (error) => set({ error }),
}));

// Usage in components
const { data, setData } = store();
```

### Protected Routes
Admin pages use `ProtectedRoute` wrapper that checks auth token in localStorage:
```javascript
<Route
  path="/admin/scrape"
  element={
    <ProtectedRoute>
      <ScrapeControl />
    </ProtectedRoute>
  }
/>
```

### Card Rendering Modes
Each card component supports multiple rendering modes:
1. **React Component** - Dynamic, interactive, real-time updates
2. **Static HTML** - Export as standalone HTML
3. **SVG** - Vector rendering for embedding

## Code Organization Patterns

### Backend File Structure
```
backend/
├── server.js                # Entry point: Express app setup, middleware
├── config/
│   ├── database.js         # MySQL pool initialization
│   └── environment.js      # Environment variable loading
├── routes/
│   ├── celebrities.js      # GET /api/celebrities, /api/celebrities/:id
│   ├── metrics.js          # GET /api/metrics endpoints
│   ├── mentions.js         # GET /api/mentions endpoints
│   └── admin.js            # GET /api/admin, POST scraping jobs
├── middleware/
│   ├── cors.js             # CORS header configuration
│   ├── rateLimiter.js      # Express rate limit middleware
│   └── errorHandler.js     # Global error handler
├── services/
│   └── metrics-calculator.js  # Metric calculation logic
└── scripts/
    └── seed-celebrities.js   # Database seeding utility
```

### Backend Routes
Routes are organized by resource type. Each route file:
- Uses async/await throughout
- Releases database connections in finally blocks
- Returns consistent JSON format: `{ success: boolean, data/error, count }`
- Includes input validation and error handling
- Uses morgan middleware for HTTP request logging

### Query Building
Dynamic SQL queries are built with:
- Parameterized queries to prevent SQL injection (uses `?` placeholders)
- Conditional filters added to arrays
- Proper escaping and validation of sort/order parameters
- Pagination with LIMIT and OFFSET (default limit: 20, offset: 0)

### Database Connection
- Uses `mysql2/promise` connection pool for performance
- Pool size configurable via `DB_CONNECTION_LIMIT` env var (default: 10)
- Connections are always released after use
- Connection pooling prevents database connection exhaustion
- Connection timeout: 10 seconds

## Database Architecture & Schema (MySQL)

### Current Version
- **v2.0** (Production-hardened, November 2025)
- Includes comprehensive data validation, optimized indexes, and monitoring scripts
- Safe migration path from v1.0 available in `database/migrations/`

### Key Schema Changes in v2.0
- **Data Precision**: FLOAT → DECIMAL for sentiment/metrics (no precision loss)
- **Validation**: Added CHECK constraints for valid ranges
- **Completeness**: Added NOT NULL constraints with sensible defaults
- **Performance**: Added composite indexes (50-70% query improvement)
- **Monitoring**: 4 new scripts for growth tracking and optimization

### Schema Documentation
- **schema.sql**: Complete schema with inline comments explaining design
- **IMPROVEMENTS.md**: Detailed rationale for all changes (450+ lines)
- **DEPLOYMENT_CHECKLIST.md**: Step-by-step production deployment guide

### Database File Structure
```
database/
├── schema.sql                 # Complete schema (production-ready)
├── migrations/
│   └── v1_to_v2.sql         # Safe migration with rollback
├── scripts/
│   ├── init-db.sh           # Initialize database & user
│   ├── backup-db.sh         # Create timestamped backups
│   ├── restore-db.sh        # Restore from backup with safety checks
│   ├── backup-restore-test.sh # Verify disaster recovery
│   ├── check-table-growth.sh  # Monitor size & growth rate
│   ├── check-slow-queries.sh  # Identify performance bottlenecks
│   └── optimize-tables.sh     # Defragment & reclaim space
├── seeds/
│   └── celebrities.json      # 100 validated Taiwan celebrities
├── README.md                 # Overview & features
├── IMPROVEMENTS.md           # Detailed improvement guide
└── DEPLOYMENT_CHECKLIST.md   # Production deployment steps
```

## Scraper Architecture (Python)

### File Structure
```
scraper/
├── run_scrape.py               # CLI entry point with argparse
├── config.py                   # Configuration loading
├── google_scraper.py           # Google Custom Search API integration
├── scraping_pipeline.py        # Orchestrates scraping workflow
├── database_handler.py         # MySQL operations for mentions
├── text_processor.py           # HTML → text extraction & cleaning
├── requirements.txt            # Python dependencies
├── test_database_compliance.py # Database schema validation
└── test_scraper_config_compliance.py  # Configuration validation
```

### Scraper Workflow
1. Load configuration from `.env` and `config.py`
2. Query Google Custom Search API (20 results per celebrity)
3. Fetch HTML from each URL with retry logic
4. Extract and clean text (remove scripts, styles, nav)
5. Extract metadata: domain, sentiment (placeholder), keywords
6. Insert into `celebrity_mentions` table with duplicate detection
7. Update `celebrity.last_scraped` timestamp
8. Log results to `scraping_jobs` table

### Scraper Code Patterns
- **Python 3.8+** with async/await support via `aiohttp` and `asyncio`
- Uses **crawl4ai** for advanced web scraping with JavaScript support
- **BeautifulSoup4** for HTML parsing and text extraction
- **APScheduler** for scheduled batch scraping (configured in `.env`)
- **Parameterized queries** in database operations to prevent SQL injection
- All database operations use `mysql-connector-python` for safe connections

### Common Scraper Issues
- **API Quota Exceeded**: Free tier = 100 queries/day. Use paid API if exceeding.
- **Timeout Errors**: Adjust `SCRAPER_TIMEOUT_SECONDS` in `.env` (default: 10)
- **Database Connection Lost**: Verify MySQL is running and credentials are correct
- **Unicode Errors**: Ensure database uses `utf8mb4` charset (already configured)
- **Import Errors**: Run `pip install -r requirements.txt` after pulling new code

## Security Considerations

- API rate limiting enabled (configurable via `RATE_LIMIT_*` env vars)
- CORS configured to allow only frontend origin
- Helmet.js for HTTP security headers
- Environment variables for all secrets (API keys, DB passwords)
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- No sensitive data logged (avoid logging full URLs, API keys)
- Connection pooling prevents database exhaustion attacks

## Working with This Repository

### Project Structure
- **Root**: Full-stack project with `/backend`, `/scraper`, `/database`, `/frontend` subdirectories
- **Each subdirectory** has its own `.env` file for configuration
- **Database scripts** are executable (chmod +x) - run with `bash` or `./`
- **Documentation** is comprehensive - start with README.md in each directory

### Testing Workflow
```bash
# 1. Verify database is accessible
mysql -h 127.0.0.1 -u celeb_user -p'0000' taiwan_celebrities -e "SELECT COUNT(*) FROM celebrities;"

# 2. Verify backend API health
curl http://localhost:5000/health

# 3. Test a specific endpoint
curl "http://localhost:5000/api/celebrities?limit=5&offset=0"

# 4. Verify scraper setup (after installing dependencies)
cd scraper && python3 test_database_compliance.py
```

### Before Starting Development
1. Copy `.env.example` to `.env` in each directory (if exists)
2. Update environment variables (API keys, DB credentials)
3. Verify MySQL is running: `mysql -u root -p`
4. Initialize database: `bash database/scripts/init-db.sh` (for fresh setup)
5. Start backend: `cd backend && npm install && npm run dev`
6. In another terminal, test endpoints with curl

### Common Workflows

**Adding a new API endpoint:**
1. Create route handler in `backend/routes/` with try/catch pattern
2. Always parameterize SQL queries
3. Always release database connections in finally block
4. Return JSON: `{ success: boolean, data/error, count }`
5. Test with curl before considering complete

**Modifying database schema:**
1. Test changes on a backup first
2. Create migration script in `database/migrations/`
3. Run tests: `bash database/scripts/backup-restore-test.sh`
4. Document changes in README and IMPROVEMENTS.md

**Running scraper batch job:**
1. Verify API credentials in `.env`
2. Check Google API quota (max 100/day on free tier)
3. Run: `cd scraper && python3 run_scrape.py --batch`
4. Monitor with: `bash database/scripts/check-table-growth.sh`

## Important Notes & Gotchas

### Database
- Always use `utf8mb4` charset for Traditional Chinese character support
- Foreign key constraints cascade on delete - deleting a celebrity removes all mentions, metrics, and jobs
- Indexes are critical for performance - query patterns are documented in CLAUDE.md
- Connection pool exhaustion causes "too many connections" errors - always release connections in finally blocks

### Backend (Node.js)
- ES6 modules only - no CommonJS `require()`
- Always specify `.js` file extensions in imports
- Never commit `.env` files - use `.env.example` template instead
- Rate limiting is enabled by default - whitelist internal IPs if needed
- CORS is configured for `http://localhost:3000` (development only)

### Scraper (Python)
- Google API free tier: 100 queries/day (one per celebrity)
- Always run `pip install -r requirements.txt` after pulling code changes
- Database connection timeouts indicate MySQL isn't running or credentials are wrong
- Sentiment scoring is currently a placeholder - implement real ML model if needed
- Large batch scraping takes time - use `--retries 3` for reliability

### Frontend (React 18 + Vite)
- Uses Zustand for state management (auth, theme)
- Axios with cache adapter for HTTP requests (6-hour default cache)
- Vite for build tooling (port 3000, hot reload enabled)
- Tailwind CSS v3 for styling
- React Router v6 for navigation
- Multiple rendering modes for cards: React components, static HTML, SVG exports
- File structure: components/, pages/, services/, context/, styles/, utils/
- All API calls via `services/api.js` (handles auth tokens, caching, error interception)
- Pages organized as: public routes (/, /trending, /celebrity/:id) and admin routes (protected)
- Auth token stored in localStorage with key `auth_token`
- `import.meta.env` pattern for environment variables (NOT `process.env`)
- Always run `npm run format` before committing to maintain consistent code style

## Deployment Notes

Before deploying to production:
1. Set `NODE_ENV=production`
2. Update all environment variables (API keys, database credentials)
3. Disable rate limiting if behind a reverse proxy (proxy will handle it)
4. Consider database backup strategy for daily scraping data
5. Set up log rotation for long-running processes
6. Test Google API quota to ensure it doesn't exceed free tier limit (100/day)
7. Database should be on dedicated server with automatic backups
8. Use connection pooling (`DB_CONNECTION_LIMIT=20` for production)
9. Monitor memory usage of Node.js process (especially with large result sets)
10. Set up cron job for scheduled scraping: `0 2 * * * cd /path/to/scraper && python3 run_scrape.py --batch`
11. Run database optimization on schedule: `0 3 * * 0 bash /path/to/database/scripts/optimize-tables.sh`
12. Verify disaster recovery: `0 3 1 * * bash /path/to/database/scripts/backup-restore-test.sh`
