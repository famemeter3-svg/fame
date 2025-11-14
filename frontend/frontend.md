# Frontend Development Instructions

This file provides comprehensive guidance to the AI agent assigned to develop the Taiwan Celebrity Tracker frontend in the `/frontend/` directory.

**IMPORTANT**: You are operating in a **strictly isolated directory sandbox**. Follow all constraints in Section 1 carefully.

---

## Section 1: Agent Constraints & Isolation Model

You are working within `/frontend/` with these boundaries:

### 1.1 What You CAN Do
- ✅ Read/write ALL files in `/frontend/` directory
- ✅ Create subdirectories: `src/`, `public/`, `node_modules/`, `dist/`, `output/`
- ✅ Run npm scripts: `npm install`, `npm start`, `npm build`
- ✅ Call backend API at `http://localhost:5000`
- ✅ Make git commits with meaningful messages
- ✅ Update `status.json` with progress
- ✅ Create `output/` directory with build artifacts and documentation

### 1.2 What You CANNOT Do
- ❌ Access parent directories (`../ or /`)
- ❌ Modify backend code in `/backend/`
- ❌ Modify database scripts in `/database/`
- ❌ Modify scraper code in `/scraper/`
- ❌ Modify CLAUDE.md, central_ai_instruction.md, or README.md in root
- ❌ Use absolute paths outside `/frontend/`
- ❌ Execute system commands beyond `npm`, `git`, `node`

### 1.3 Progress Tracking
Update `/frontend/status.json` daily with:
```json
{
  "agent_id": "frontend-agent",
  "status": "running",
  "current_phase": "components",
  "progress_percent": 45,
  "completed_tasks": [
    "Project setup",
    "Card components"
  ],
  "current_task": "Building admin dashboard",
  "eta_completion_days": 7,
  "blockers": [],
  "last_commit": "feat: CelebrityCard component with SVG export",
  "updated_at": "2025-11-14T10:30:00Z"
}
```

### 1.4 Git Communication
Commit regularly with clear messages:
```bash
git add src/
git commit -m "feat: Build CelebrityCard component with React + SVG modes"
git commit -m "feat: Integrate trending endpoint with TrendingCard"
git commit -m "fix: Theme toggle not persisting to localStorage"
git commit -m "docs: Update component API documentation"
```

---

## Section 2: Project Overview

### 2.1 What You're Building
A **dual-interface React application** for the Taiwan Celebrity Tracker:

1. **ADMIN INTERFACE** (Internal)
   - Dashboard: View system stats, scraping jobs, database metrics
   - Data Management: Trigger scrapes, view raw data, manage celebrities
   - Scraping Control: Start batch jobs, view job queue, monitor progress
   - Analytics: Export data, view raw mentions, analyze metrics

2. **PUBLIC INTERFACE** (Shareable/Embeddable)
   - Celebrity List: Browse all celebrities with basic info
   - Trending: See top 5 celebrities trending this week (PRIMARY FEATURE)
   - Celebrity Detail: Full profile with mention timeline (PRIMARY FEATURE)
   - Mentions Detail: Detailed timeline of all mentions for a celebrity (PRIMARY FEATURE)
   - Card Embed: Generate shareable cards (like github-readme-stats)

### 2.2 Architecture Philosophy: Card-Based UI
Inspired by **github-readme-stats**, your UI is built on **reusable card components**:

- Each card is a self-contained unit: `<CelebrityCard data={} theme={} mode="interactive" />`
- Each card can render in THREE modes:
  1. **React Component**: Interactive, stateful, real-time updates (used in dashboard/list)
  2. **Static HTML**: Non-interactive view-only (used in embed pages)
  3. **SVG Export**: Pure SVG string, embeddable, cached (like github-readme-stats)
- Cards accept theme prop (light/dark) and automatically style accordingly
- Cards are the building blocks for all pages

### 2.3 Tech Stack
- **React 18** - UI library
- **React Router v6** - Page navigation
- **Vite** - Ultra-fast build tool
- **Axios** - API client with caching
- **Zustand** - Lightweight state management (or Context API)
- **CSS-in-JS** - Styled Components OR Tailwind CSS (your choice, recommend Tailwind for consistency)
- **date-fns** - Date formatting
- **axios-cache-adapter** - Automatic caching for API responses

---

## Section 3: Detailed Component Architecture

### 3.1 Card Components (The Foundation)

All card components follow this **exact pattern**:

```jsx
// Pattern: Each card component has THREE render modes
const CelebrityCard = ({
  celebrity,           // Object: { id, name, category, last_mention_date }
  metrics,             // Object: { mention_count, velocity, trending_score }
  theme = "light",     // "light" | "dark" | custom color object
  mode = "interactive", // "interactive" | "static" | "svg"
  onCardClick,         // Callback for interactive mode
  showRanking,         // Boolean: show ranking badge
}) => {

  // MODE 1: Interactive React component
  if (mode === "interactive") {
    return (
      <div className={`card card-${theme}`} onClick={onCardClick}>
        {/* Clickable, with hover effects, animations */}
        {/* Updates on new props, responds to user input */}
      </div>
    );
  }

  // MODE 2: Static HTML (view-only)
  if (mode === "static") {
    return (
      <div className={`card card-${theme} card-static`}>
        {/* Same structure as interactive, but no click handlers */}
      </div>
    );
  }

  // MODE 3: SVG export (for embedding/sharing)
  if (mode === "svg") {
    return <svg>{/* Pure SVG string rendering */}</svg>;
  }
};
```

### 3.2 Five Required Card Components

**Card 1: CelebrityCard.jsx** (Main card)
- Displays: Celebrity name, category, mention count, last mention date, ranking badge
- Data from: `/api/card/celebrity/:id`
- Modes: All three (interactive, static, svg)
- Used in: List pages, dashboard, embed pages
- Design: Name prominently, category as pill, mention count as highlight
- Interactive mode: Click to view details, hover shows more metrics

**Card 2: MetricsCard.jsx** (6 metrics)
- Displays: Mention frequency, velocity, trending score, popularity index, source diversity, top keywords
- Data from: `/api/card/metrics/:id`
- Modes: All three
- Used in: Detail page, admin analytics
- Design: Grid of 6 metric boxes with icons, color-coded values
- Interactive mode: Click metric to see history/details

**Card 3: MentionsCard.jsx** (Recent mentions)
- Displays: List of recent mentions with source, title, sentiment
- Data from: `/api/card/mentions/:id?limit=5`
- Modes: Interactive and static (no SVG mode needed)
- Used in: Detail page, mentions timeline
- Design: Vertical list with domain favicon, title, date, sentiment indicator
- Interactive mode: Click mention to view full text, copy URL

**Card 4: TrendingCard.jsx** (Top 5 celebrities)
- Displays: Ranked list of top 5 trending celebrities this week
- Data from: `/api/card/trending?limit=5`
- Modes: All three
- Used in: Homepage, public dashboard, trending page
- Design: Numbered list (1-5) with celebrity name, ranking change indicator (↑↓), metrics
- Interactive mode: Click celebrity to go to detail page

**Card 5: StatsCard.jsx** (System statistics)
- Displays: Total celebrities, total mentions, average mentions per celebrity, trending keywords
- Data from: `/api/card/stats`
- Modes: All three
- Used in: Admin dashboard, system overview
- Design: Grid of 4 stat boxes with icons and large numbers
- Interactive mode: Click stat to drill down or filter

### 3.3 Card Rendering Service

Create `/src/services/cardRenderer.js`:
```javascript
export const renderCardAsReact = (cardType, data, theme, mode) => {
  // Returns React component
};

export const renderCardAsSVG = (cardType, data, theme) => {
  // Returns SVG string that can be:
  // - Rendered: <div dangerouslySetInnerHTML={{ __html: svgString }} />
  // - Downloaded: Pass to FileSaver
  // - Embedded: <img src={`data:image/svg+xml;...`} />
};

export const cacheCardSVG = (cardType, dataId, theme) => {
  // Cache SVG on backend via: GET /api/card/{type}/{id}/svg?theme=...
};
```

---

## Section 4: Page Structure

### 4.1 Admin Interface Pages

**AdminDashboard.jsx** - Entry point for admin
```
Layout: Sidebar + Main content
Shows:
  - Quick stats cards (total celebrities, mentions, mentions today)
  - Recent scraping jobs (status, progress, errors)
  - Quick action buttons (Start batch scrape, View data, Analytics)
  - System health (API status, database status, cache status)

Uses Components: StatsCard, JobStatusCards
Data from: /api/admin/stats, /api/admin/jobs
```

**ScrapeControl.jsx** - Trigger and monitor scraping jobs
```
Shows:
  - "Batch Scrape All 100 Celebrities" button
  - "Scrape Single Celebrity" dropdown + button
  - Job queue table with columns: Job ID, Type, Status, Progress, Time, Actions
  - Last completed job details

Uses Components: Form inputs, Job status table, Log viewer
Data from: /api/admin/jobs, WebSocket for live updates (optional)
```

**DataManagement.jsx** - Upload, delete, manage celebrities
```
Shows:
  - Celebrity count: 100
  - List of all celebrities with actions (Edit, Delete, View mentions)
  - Upload CSV feature (future)
  - Filter/search

Uses Components: Celebrity list table, Edit forms
Data from: /api/celebrities, /api/admin/celebrity/:id
```

**Analytics.jsx** - Data analysis and export
```
Shows:
  - Charts: Mentions over time, top domains, top keywords
  - Export buttons: Download mentions CSV, export metrics JSON
  - Filters: Date range, category, status

Uses Components: Chart library (recharts or d3), Export buttons
Data from: /api/mentions, /api/metrics
```

### 4.2 Public Interface Pages

**CelebrityList.jsx** - Browse all celebrities
```
Layout: Grid of celebrity cards
Shows:
  - Grid of all 100 celebrities as CelebrityCard components
  - Filter by category (Singer, Actor, Actress, Host, Director, Dancer, Model)
  - Search by name
  - Sort options (A-Z, trending, most mentioned, recently updated)
  - Pagination (20 per page)

Uses Components: CelebrityCard (mode="interactive"), FilterForm
Data from: /api/celebrities?category=...&search=...&sort=...&limit=20&offset=0
```

**Trending.jsx** - Top trending celebrities (PRIORITY #1)
```
Layout: Vertical list or cards
Shows:
  - TrendingCard component showing top 5
  - Trend indicators (↑↑ +45%, ↑ +12%, - stable, ↓ -8%)
  - Metrics for each: mentions this week, velocity, popular keywords
  - Click to view full profile

Uses Components: TrendingCard, CelebrityCard (for detail when clicked)
Data from: /api/card/trending?limit=5
Refresh: Every 2 hours (cache for 2 hours)
```

**CelebrityDetail.jsx** - Full profile page (PRIORITY #2)
```
Layout: Header + tabs
Shows:
  - Celebrity header: Name, category, photo if available, basic stats
  - Tabs:
    1. Metrics: MetricsCard showing all 6 metrics
    2. Mentions: MentionsCard showing all mentions with timeline
    3. Sources: Domain breakdown, source diversity chart
    4. Share: Generate shareable card

Uses Components: CelebrityCard, MetricsCard, MentionsCard, Charts
Data from: /api/celebrities/:id, /api/metrics/:id, /api/mentions/:id
```

**MentionsDetail.jsx** - Timeline of mentions (PRIORITY #3)
```
Layout: Vertical timeline
Shows:
  - All mentions for a celebrity in chronological order
  - Each mention: Date, source domain, title, snippet, sentiment badge, keywords
  - Filter by date range, source domain
  - Sort: newest first, oldest first
  - Expand/collapse to view full text

Uses Components: MentionCard (individual mention), Timeline layout, Filters
Data from: /api/mentions/:id?limit=100&offset=0
```

**CardEmbed.jsx** - Shareable card page
```
Layout: Centered card display
Shows:
  - Renders a CelebrityCard or MetricsCard in SVG mode
  - URL parameters: /card/celebrity/1?theme=dark&mode=svg
  - Shareable URL that can be embedded in README, webpage, etc.
  - "Copy Embed Code" button
  - "Download as PNG" button (convert SVG to PNG)

Uses Components: CelebrityCard or MetricsCard (mode="svg")
Data from: /api/card/celebrity/:id, /api/card/metrics/:id
```

---

## Section 5: API Integration Specifications

### 5.1 Existing Backend Endpoints You'll Use

```javascript
// CELEBRITIES
GET /api/celebrities
  Query: ?limit=20&offset=0&category=Singer&status=active
  Returns: { success, data: [{id, name, name_english, category, status, last_scraped}], count }

GET /api/celebrities/:id
  Returns: { success, data: {id, name, name_english, category, status, mention_count, last_scraped, metadata} }

// METRICS
GET /api/metrics/:id
  Returns: { success, data: {id, frequency, velocity, trending_score, popularity_index, diversity, keywords_json} }

GET /api/metrics/:id/history
  Returns: { success, data: [{date, frequency, velocity, trending_score, ...}] }

// MENTIONS
GET /api/mentions/:id
  Query: ?limit=20&offset=0
  Returns: { success, data: [{mention_id, domain, url, title, cleaned_text, sentiment_score, time_stamp}] }

// ADMIN
GET /api/admin/stats
  Returns: { success, data: {total_celebrities, total_mentions, total_jobs, avg_mentions_per_celeb} }

POST /api/admin/scrape
  Body: {job_type: "batch" | "single", celebrity_id: null | number}
  Returns: { success, job_id, status }

GET /api/admin/jobs
  Returns: { success, data: [{job_id, status, progress, mentions_found, start_time, end_time}] }
```

### 5.2 NEW Card-Specific Endpoints to Use

These should already exist on backend (if not, request central agent to add them):

```javascript
// CARD DATA (Minimal, optimized for card rendering)
GET /api/card/celebrity/:id
  Returns: { id, name, category, mention_count, last_mention_date }

GET /api/card/metrics/:id
  Returns: { id, frequency, velocity, trending_score, popularity_index, diversity, keywords }

GET /api/card/mentions/:id?limit=5
  Returns: { mentions: [{date, source, title, sentiment}] }

GET /api/card/trending?limit=5
  Returns: { celebrities: [{id, name, category, mention_count, velocity, trending_score, ranking_change}] }

GET /api/card/stats
  Returns: { total_celebrities, total_mentions, avg_mentions, trending_keywords }

// SVG RENDERING (Server-side cached SVGs - optional, for heavy load optimization)
GET /api/card/celebrity/:id/svg?theme=dark
  Returns: SVG string
  Cache-Control: max-age=604800 (1 week)
```

### 5.3 API Client Setup (`/src/services/api.js`)

```javascript
import axios from 'axios';
import cacheAdapter from 'axios-cache-adapter';

const cacheConfig = {
  maxAge: 6 * 60 * 60 * 1000, // 6 hours default
  exclude: {
    query: false,
    methods: ['put', 'patch', 'delete', 'post'], // Don't cache mutations
  }
};

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  adapter: cacheAdapter(cacheConfig),
});

// Custom methods for data fetching
export const fetchCelebrities = (limit=20, offset=0, filters={}) =>
  apiClient.get('/api/celebrities', { params: { limit, offset, ...filters } });

export const fetchCelebrityDetails = (id) =>
  apiClient.get(`/api/celebrities/${id}`);

export const fetchMetrics = (id) =>
  apiClient.get(`/api/metrics/${id}`);

export const fetchMentions = (id, limit=20, offset=0) =>
  apiClient.get(`/api/mentions/${id}`, { params: { limit, offset } });

export const fetchTrending = () =>
  apiClient.get('/api/card/trending?limit=5');

// ... more methods for card endpoints
```

---

## Section 6: Styling & Design System

### 6.1 Design Aesthetic: Tech & Futuristic

Your UI should feel:
- **Tech**: Clean, minimal, code-like
- **Futuristic**: Neon accents, dark backgrounds, modern typography
- **Interactive**: Smooth transitions, hover effects, loading states
- **Readable**: High contrast, clear hierarchy, accessible

### 6.2 Color Palette

```css
/* Light Theme */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f5f5f5;
--color-text-primary: #1a1a1a;
--color-text-secondary: #666666;
--color-accent-primary: #00d9ff;    /* Neon cyan */
--color-accent-secondary: #ff00ff;  /* Neon magenta */
--color-accent-tertiary: #00ff88;   /* Neon lime */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-border: #e5e7eb;

/* Dark Theme */
--color-bg-primary: #0f172a;        /* Dark blue */
--color-bg-secondary: #1e293b;      /* Slate */
--color-text-primary: #f8fafc;
--color-text-secondary: #cbd5e1;
--color-accent-primary: #00d9ff;    /* Neon cyan (same) */
--color-accent-secondary: #ff00ff;  /* Neon magenta (same) */
--color-accent-tertiary: #00ff88;   /* Neon lime (same) */
--color-success: #34d399;
--color-warning: #fbbf24;
--color-error: #f87171;
--color-border: #334155;
```

### 6.3 Typography

```css
/* Fonts to import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

--font-body: 'Inter', sans-serif;
--font-display: 'Space Grotesk', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Sizing */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

### 6.4 Component Styling (CSS-in-JS with Styled Components or Tailwind)

Example with Tailwind:
```jsx
// Card component with Tailwind
const CelebrityCard = ({ celebrity, theme, mode, onCardClick }) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`
        rounded-lg p-6 cursor-pointer transition-all duration-300
        ${isDark
          ? 'bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20'
          : 'bg-white border border-gray-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-400/10'
        }
      `}
      onClick={onCardClick}
    >
      <h3 className={`text-xl font-bold font-display ${isDark ? 'text-cyan-400' : 'text-gray-900'}`}>
        {celebrity.name}
      </h3>
      {/* Content */}
    </div>
  );
};
```

### 6.5 Animations

Keep animations subtle and purposeful:
- **Card hover**: Slight scale (1.02), shadow increase, border color change
- **Loading**: Spinner or skeleton loader (subtle pulse)
- **Transitions**: 200-300ms ease-in-out
- **SVG animations**: Optional: Metric number counter animation (0 → final value)

---

## Section 7: Development Workflow

### 7.1 Phase 1: Setup (Day 1)
```bash
# You'll do this first
npm install                    # Install all dependencies
npm run dev                    # Start dev server on http://localhost:3000

# Verify backend is running
curl http://localhost:5000/health

# Verify you can fetch data
curl http://localhost:5000/api/celebrities?limit=1
```

Checklist:
- [ ] `npm install` succeeds without errors
- [ ] Dev server starts on port 3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Backend API responds to requests
- [ ] No console errors in browser

**Commit**: `init: Project setup with Vite and dependencies`

### 7.2 Phase 2: Component Library (Days 2-4)
Build the 5 card components and their rendering utilities:

```bash
# File structure to create
src/components/cards/
  ├── CelebrityCard.jsx           (Days 2-3)
  ├── MetricsCard.jsx             (Day 3)
  ├── MentionsCard.jsx            (Day 3)
  ├── TrendingCard.jsx            (Day 4)
  └── StatsCard.jsx               (Day 4)

src/services/
  ├── cardRenderer.js             (Utilities for card rendering)
  └── svgGenerator.js             (SVG string generation)

src/styles/
  ├── theme.js                    (Theme object)
  ├── colors.js                   (Color definitions)
  └── globals.css                 (Global styles)
```

For each card component:
1. Create component file with all three modes (interactive, static, svg)
2. Add prop validation (PropTypes or TypeScript)
3. Add sample data usage in comments
4. Create Storybook story or test file (optional)
5. Commit with: `feat: CelebrityCard component with React + SVG modes`

### 7.3 Phase 3: Pages & Routing (Days 5-7)

```bash
# Install React Router if not already included
npm install react-router-dom@6

# File structure to create
src/pages/
  ├── admin/
  │   ├── AdminDashboard.jsx      (Day 5)
  │   ├── ScrapeControl.jsx       (Day 5)
  │   ├── DataManagement.jsx      (Day 6)
  │   └── Analytics.jsx           (Day 6)
  └── public/
      ├── CelebrityList.jsx       (Day 6)
      ├── Trending.jsx            (Day 7)
      ├── CelebrityDetail.jsx     (Day 7)
      ├── MentionsDetail.jsx      (Day 7)
      └── CardEmbed.jsx           (Day 7)

src/
  ├── App.jsx                     (Router setup)
  └── Router.jsx                  (Route definitions)
```

Router structure:
```jsx
const Router = [
  { path: '/', element: <CelebrityList /> },
  { path: '/trending', element: <Trending /> },
  { path: '/celebrity/:id', element: <CelebrityDetail /> },
  { path: '/celebrity/:id/mentions', element: <MentionsDetail /> },
  { path: '/card/celebrity/:id', element: <CardEmbed /> },
  { path: '/admin', element: <AdminDashboard />, protected: true },
  { path: '/admin/scrape', element: <ScrapeControl />, protected: true },
  { path: '/admin/data', element: <DataManagement />, protected: true },
  { path: '/admin/analytics', element: <Analytics />, protected: true },
];
```

**Commits**:
- `feat: Add admin dashboard page`
- `feat: Add public pages (list, trending, detail)`
- `feat: Implement React Router navigation`

### 7.4 Phase 4: API Integration (Days 8-10)

Connect all pages to backend:
1. Update API client (`services/api.js`) with all fetch functions
2. Update each page to call API endpoints
3. Add loading states (spinners, skeletons)
4. Add error handling (error messages, retry buttons)
5. Add caching strategy for metrics (6-day cache)

```javascript
// Example page update
const CelebrityList = () => {
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCelebrities(limit=20, offset=0)
      .then(res => setCelebrities(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // JSX rendering...
};
```

**Commits**:
- `feat: Integrate celebrity list API`
- `feat: Integrate metrics and mentions endpoints`
- `feat: Add API error handling and loading states`

### 7.5 Phase 5: Styling & Polish (Days 11-13)

1. Apply theme system (light/dark toggle)
2. Ensure responsive design (test on mobile, tablet, desktop)
3. Add transitions and animations
4. Optimize performance (lazy loading, code splitting)
5. Add accessibility (ARIA labels, keyboard navigation, color contrast)
6. Test all interactive features

```bash
# Testing setup
npm run build           # Ensure build succeeds
npm run preview         # Test production build locally
```

**Commits**:
- `style: Apply theme system and responsive design`
- `perf: Add code splitting and lazy loading`
- `a11y: Add accessibility improvements`

### 7.6 Phase 6: Deployment & Documentation (Day 14)

1. Create `output/` directory with build artifacts
2. Create deployment checklist
3. Document deployment steps
4. Verify all features work
5. Create final status report

```bash
npm run build          # Creates dist/ folder
cp -r dist/* output/   # Copy to output for central agent
```

Create `/frontend/output/DEPLOYMENT_CHECKLIST.md`:
```markdown
# Frontend Deployment Checklist

Pre-Deployment:
- [ ] npm build succeeds with no errors
- [ ] Build size < 500kb (gzipped)
- [ ] No console errors in dev or production build
- [ ] All pages load without errors
- [ ] API calls work correctly
- [ ] Theme toggle works (light/dark)
- [ ] Responsive design tested on 3+ devices
- [ ] Mobile navigation works
- [ ] Share/embed URLs work
- [ ] Admin panel authenticated and functional
- [ ] Metrics data displays correctly
- [ ] Trending shows correct rankings

Performance:
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3.5s

Accessibility:
- [ ] Color contrast >= 4.5:1 for text
- [ ] All buttons keyboard accessible
- [ ] Images have alt text
- [ ] ARIA labels where needed

Deployment Steps:
1. Run `npm run build`
2. Verify `dist/` folder is created
3. Upload to hosting (Vercel, Netlify, etc.)
4. Test in production environment
5. Monitor for errors

Rollback Plan:
If issues found, revert to previous commit:
- git revert <commit-hash>
- git push to revert on deployed service
```

---

## Section 8: Common Commands You'll Use

```bash
# Development
npm run dev                   # Start dev server (http://localhost:3000)
npm run build               # Build for production
npm run preview             # Preview production build locally

# Git workflow
git status                  # Check what changed
git add src/               # Stage changes
git commit -m "feat: ..."  # Commit with clear message
git log --oneline          # See recent commits

# Debugging
npm run dev -- --host      # Expose to network (for mobile testing)

# Installation (if new packages needed)
npm install package-name   # Add dependency

# Formatting (optional, but recommended)
npm install prettier --save-dev
npm run format             # Format code
```

---

## Section 9: Success Criteria

Your frontend is **COMPLETE** when:

### Feature Completeness
- ✅ All 5 card components built with three modes each (React, static, SVG)
- ✅ Admin dashboard functional with scrape controls
- ✅ Public pages: List, Trending, Detail, Mentions, Embed
- ✅ All pages connect to backend API
- ✅ Trending page shows top 5 celebrities correctly
- ✅ Mention timeline shows all mentions in order
- ✅ Card embed generates shareable SVG URLs

### Design & UX
- ✅ Tech/futuristic aesthetic applied throughout
- ✅ Light and dark themes both working
- ✅ Theme toggle persists to localStorage
- ✅ Responsive design works on mobile, tablet, desktop
- ✅ Loading states show while fetching data
- ✅ Error messages display clearly
- ✅ Smooth transitions and animations

### Performance
- ✅ Dev build loads < 3 seconds
- ✅ Production build < 500kb gzipped
- ✅ No console errors or warnings
- ✅ API caching works (metrics cache 6 days)
- ✅ Page transitions smooth (no janky animations)

### Code Quality
- ✅ All components reusable and well-documented
- ✅ Git history clean with meaningful commits
- ✅ No hardcoded values (use environment variables)
- ✅ Error handling on all API calls
- ✅ No commented-out code or debug statements

### Documentation
- ✅ `/frontend/output/DEPLOYMENT_CHECKLIST.md` created
- ✅ `status.json` updated with final completion
- ✅ `README.md` in `/frontend/` explains how to run dev/build
- ✅ Component files have JSDoc comments

---

## Section 10: Troubleshooting Guide

### Issue: Backend API not responding
**Check**:
1. Is backend running? `curl http://localhost:5000/health`
2. Check `.env`: Is `VITE_API_URL` correct?
3. Check browser console for CORS errors
4. Try: `npm run dev` in backend directory

### Issue: Theme not persisting
**Check**:
1. Is localStorage being written? Check DevTools → Application → Storage
2. Is context provider wrapping entire app?
3. Try clearing localStorage: `localStorage.clear()` in console

### Issue: Metrics show stale data
**Check**:
1. Caching period: 6 days for metrics is by design
2. To force refresh: `apiClient.cache.clear()` or delete browser cache
3. Check `/api/metrics/:id` returns fresh data

### Issue: Build fails
**Check**:
1. All files have proper imports (no missing relative paths)
2. No circular dependencies
3. Try: `rm -rf node_modules && npm install`
4. Check for TypeScript errors if using TypeScript

### Issue: Cards not rendering in SVG mode
**Check**:
1. Is SVG string being generated? Check in DevTools console
2. Are all data fields present? Card needs: id, name, metrics
3. SVG rendering might need `dangerouslySetInnerHTML`

---

## Section 11: File Structure You Must Create

When you start, create this exact structure:

```
frontend/
├── frontend.md                  ← You are reading this
├── package.json                 ← Core dependencies
├── .env.example                 ← Environment template
├── .gitignore                   ← Git exclusions
├── vite.config.js              ← Vite build config
├── index.html                  ← Entry HTML
│
├── src/
│   ├── index.jsx               ← React entry point
│   ├── App.jsx                 ← Main router component
│   ├── components/
│   │   ├── cards/
│   │   │   ├── CelebrityCard.jsx
│   │   │   ├── MetricsCard.jsx
│   │   │   ├── MentionsCard.jsx
│   │   │   ├── TrendingCard.jsx
│   │   │   └── StatsCard.jsx
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx
│   │   │   └── PublicLayout.jsx
│   │   ├── shared/
│   │   │   ├── Header.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── forms/
│   │       └── FilterForm.jsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ScrapeControl.jsx
│   │   │   ├── DataManagement.jsx
│   │   │   └── Analytics.jsx
│   │   └── public/
│   │       ├── CelebrityList.jsx
│   │       ├── Trending.jsx
│   │       ├── CelebrityDetail.jsx
│   │       ├── MentionsDetail.jsx
│   │       └── CardEmbed.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── cardRenderer.js
│   │   ├── svgGenerator.js
│   │   └── themeService.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── theme.js
│   │   ├── colors.js
│   │   └── fonts.css
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   └── helpers.js
│   ├── hooks/
│   │   └── useFetch.js
│   └── context/
│       └── ThemeContext.jsx
├── public/
│   ├── index.html
│   └── favicon.ico
├── output/
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── build/                   (after npm run build)
└── status.json                  (created by you during development)
```

---

## Section 12: Key Reminders

1. **Isolation First**: Never access files outside `/frontend/`. All relative paths must be within this directory.

2. **Commit Often**: Make meaningful git commits after completing each feature. This is your communication channel.

3. **API Driven**: All data comes from `/api/` endpoints. Don't hardcode data.

4. **Three Card Modes**: Every card must support React, static, and SVG modes. Test all three.

5. **Environment Variables**: Use `VITE_API_URL` and other env vars from `.env`. Never hardcode URLs.

6. **Caching Strategy**: Metrics cache 6 days, mentions cache 1 day. Be aware of stale data.

7. **Theme System**: Build with light/dark themes from the start. Not a "feature to add later".

8. **Responsive First**: Test on mobile, tablet, desktop. Not just desktop.

9. **Accessibility Matters**: Add ARIA labels, ensure keyboard navigation, check color contrast.

10. **Document as You Go**: Update `status.json` daily. Write JSDoc comments in components.

---

## Final Notes

This frontend will be the face of the Taiwan Celebrity Tracker. It needs to:
- Show who's trending (Trending page is CRITICAL)
- Show detailed mention timelines (Detail pages are CRITICAL)
- Let admins control the backend (Admin interface is CRITICAL)
- Look modern and futuristic (Design aesthetic matters)
- Be shareable (Card embed feature)

You have everything you need in this document. Read carefully, follow the phases, and commit regularly.

**Your central agent will monitor your progress via status.json and git commits. Good luck!**

---

**Created**: 2025-11-14
**Project**: Taiwan Celebrity Tracker Frontend
**Agent Scope**: `/frontend/` directory only
**Expected Completion**: 14 days
