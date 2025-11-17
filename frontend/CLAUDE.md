# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Taiwan Celebrity Tracker Frontend** - a dual-interface React application that displays celebrity data with two distinct experiences:

1. **Public Interface**: Read-only view of celebrity data (lists, details, trending, mentions)
2. **Admin Dashboard**: Protected interface for monitoring scraping jobs, analytics, and data management

The frontend is part of the larger Taiwan Celebrity Tracker full-stack application (see root CLAUDE.md for backend/database context).

**Tech Stack:**
- React 18 with ES6 modules
- Vite 5 for development and production builds
- Tailwind CSS v3 for styling
- Zustand for lightweight state management (auth, theme)
- Axios with caching adapter for API requests
- React Router v6 for navigation

## Frontend Architecture

### High-Level Structure

```
React App (Port 3000)
    ├── Public Routes (no auth required)
    │   ├── Celebrity List (with filters)
    │   ├── Trending Dashboard
    │   ├── Celebrity Detail (with metrics)
    │   ├── Mentions Detail
    │   └── Card Embed (for embeddable card components)
    │
    └── Admin Routes (JWT auth required)
        ├── Admin Dashboard (overview stats)
        ├── Scrape Control (trigger scraping jobs)
        ├── Data Management (view/manage data)
        └── Analytics (view metrics history)
```

### Directory Structure

```
src/
├── App.jsx                          # Main router setup
├── index.jsx                        # Entry point
├── components/
│   ├── cards/                       # Reusable card components (3 modes each)
│   │   ├── CelebrityCard.jsx
│   │   ├── MetricsCard.jsx
│   │   ├── MentionsCard.jsx
│   │   ├── TrendingCard.jsx
│   │   └── StatsCard.jsx
│   ├── shared/                      # Shared UI components
│   │   ├── Header.jsx               # Navigation header with theme toggle
│   │   ├── LoadingSpinner.jsx       # Loading indicator
│   │   └── ThemeToggle.jsx          # Dark/light mode toggle
│   └── ProtectedRoute.jsx           # Auth wrapper for admin routes
├── pages/
│   ├── Login.jsx                    # Authentication page
│   ├── public/                      # Public routes (no auth required)
│   │   ├── CelebrityList.jsx        # List all celebrities with filters
│   │   ├── Trending.jsx             # Trending celebrities dashboard
│   │   ├── CelebrityDetail.jsx      # Individual celebrity page
│   │   ├── MentionsDetail.jsx       # Celebrity mentions/articles page
│   │   └── CardEmbed.jsx            # Embeddable card component
│   └── admin/                       # Admin routes (protected)
│       ├── AdminDashboard.jsx       # Admin overview
│       ├── ScrapeControl.jsx        # Trigger scraping jobs
│       ├── DataManagement.jsx       # Data view/management
│       └── Analytics.jsx            # Metrics and trends
├── context/                         # Zustand stores (state management)
│   ├── authStore.js                 # Authentication state + login/logout
│   └── themeStore.js                # Light/dark theme state
├── hooks/
│   └── useFetch.js                  # Custom hooks for data fetching
├── services/
│   └── api.js                       # Axios API client with caching
├── utils/
│   ├── constants.js                 # Constants (categories, defaults)
│   └── formatters.js                # Helper functions (formatNumber, etc)
└── styles/
    ├── globals.css                  # Global styles + Tailwind directives
    └── theme.js                     # Color theme definitions
```

## Component Patterns

### Card Components (Reusable Pattern)

Each card component supports **three rendering modes**:

```javascript
// Mode 1: Interactive - for listing/dashboards (hoverable, clickable)
<CelebrityCard
  celebrity={data}
  metrics={metrics}
  theme="dark"
  mode="interactive"
  onCardClick={(id) => navigate(`/celebrity/${id}`)}
  showRanking={true}
  ranking={1}
/>

// Mode 2: Static - for embedding in articles (no interaction)
<CelebrityCard
  celebrity={data}
  metrics={metrics}
  theme="light"
  mode="static"
/>

// Mode 3: SVG - for exporting/sharing (server-rendered SVG)
// Generated via API: /api/card/{type}/{id}/svg?theme=dark
```

### Data Fetching Patterns

The app uses two custom hooks for data fetching:

**useFetch** - for single data loads:
```javascript
const { data, loading, error, refetch } = useFetch(
  () => fetchCelebrityById(id),
  [id] // dependencies
);
```

**usePaginatedFetch** - for paginated data:
```javascript
const { data, loading, error, page, nextPage, prevPage } = usePaginatedFetch(
  fetchCelebrities,
  20 // items per page
);
```

### State Management

**Zustand stores** (lightweight alternative to Redux):
- `authStore`: Manages auth token, user, login/logout
- `themeStore`: Manages light/dark theme preference

Access via hook pattern:
```javascript
const { isDark, toggleTheme } = themeStore();
const { token, isAuthenticated, logout } = authStore();
```

## API Integration

### API Client Setup (src/services/api.js)

- **Base URL**: `VITE_API_URL` (default: http://localhost:5000)
- **Timeout**: `VITE_API_TIMEOUT` (default: 10000ms)
- **Caching**: 6-hour cache for GET requests (configurable via `VITE_CACHE_DURATION`)
- **Auth**: Automatic Bearer token injection from authStore
- **Error Handling**: 401 errors trigger logout

### Common API Endpoints Used

**Celebrities:**
```javascript
fetchCelebrities(limit, offset, filters) // GET /api/celebrities
fetchCelebrityById(id)                    // GET /api/celebrities/:id
```

**Metrics:**
```javascript
fetchMetrics(id)           // GET /api/metrics/:id
fetchMetricsHistory(id)    // GET /api/metrics/:id/history
```

**Mentions:**
```javascript
fetchMentions(id, limit, offset) // GET /api/mentions/:id
```

**Admin/Cards:**
```javascript
fetchAdminStats()          // GET /api/admin/stats
startScrape(jobType, id)   // POST /api/admin/scrape
fetchCardMetrics(id)       // GET /api/card/metrics/:id
```

See `src/services/api.js` for full endpoint list.

## Styling & Theme

### Tailwind Configuration

Custom color palette in `tailwind.config.js`:
- **Light theme**: white background, dark text
- **Dark theme**: slate backgrounds (#0f172a, #1e293b), light text
- **Neon accents**: cyan, magenta, lime (for trending/highlights)
- **Status colors**: green (success), amber (warning), red (error)

### Theme Implementation

Theme is toggled via `themeStore` and applied as:
1. CSS class on `<html>` element (`dark` or absence of `dark`)
2. Tailwind `dark:` prefix selectors
3. Conditional class names in components

Example:
```javascript
const bgClass = isDark ? 'bg-dark-bg-secondary' : 'bg-white';
const textClass = isDark ? 'text-dark-text-primary' : 'text-light-text-primary';
```

## Development Commands

### Installation & Setup
```bash
npm install                # Install dependencies
npm run dev               # Start Vite dev server (http://localhost:3000)
npm run build            # Production build (outputs to dist/)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Development Workflow

```bash
# 1. Start backend (in another terminal from root)
cd ../backend && npm run dev

# 2. Start frontend dev server
npm run dev

# 3. Frontend automatically opens at http://localhost:3000
```

### Building for Production

```bash
npm run build            # Builds to dist/
# Output: dist/index.html, dist/assets/*, etc
```

The production build:
- Minifies JavaScript (via Terser, removes console logs)
- Optimizes CSS via Tailwind purge
- Generates source maps (disabled for security)
- Uses autoprefixer for browser compatibility

### Testing Code Quality

```bash
npm run lint             # Check for code style issues
npm run format           # Auto-fix formatting issues
```

## Environment Configuration

**File**: `.env` in frontend root

```
# Backend API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000

# Caching Configuration (milliseconds)
VITE_CACHE_DURATION=21600000  # 6 hours

# Feature Flags
VITE_ENABLE_DEBUG=false

# Theme Configuration
VITE_DEFAULT_THEME=light
```

All variables must start with `VITE_` to be exposed to the frontend (Vite security feature).

## Authentication Flow

1. User navigates to `/login`
2. User enters username/password
3. Login form calls `authStore.login(username, password)`
4. API posts to `/api/auth/login`
5. Server returns JWT token
6. Token stored in localStorage and authStore
7. User can now access protected routes (`/admin/*`)
8. API client automatically includes token in Authorization header
9. If token invalid, 401 response triggers `logout()` and redirects to login

**Protected Routes** use `ProtectedRoute` component wrapper that checks `authStore.isAuthenticated`.

## Important Implementation Details

### React Router Setup

Routes use lowercase names and follow pattern:
```javascript
<Route path="/path" element={<ComponentName />} />
<Route path="/admin/scrape" element={<ProtectedRoute><ScrapeControl /></ProtectedRoute>} />
```

Navigation via `useNavigate()` hook, not direct links in most cases:
```javascript
const navigate = useNavigate();
navigate(`/celebrity/${id}`);
```

### Component Lifecycle Patterns

All pages/components follow this pattern:
```javascript
export default function PageName() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchData();
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dependencies]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return <div>/* Component JSX */</div>;
}
```

### CSS-in-Tailwind

- **No CSS-in-JS**: Use only Tailwind utility classes
- **Global styles**: `src/styles/globals.css` for global imports and custom directives
- **Dark mode**: Use `dark:` prefix for dark theme variants
- **Responsive**: Use `sm:`, `md:`, `lg:`, `xl:` prefixes (mobile-first)

Example:
```jsx
<div className="bg-white dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

### Data Flow

```
User Action → useEffect/Event Handler
  ↓
Call API function from src/services/api.js (Axios)
  ↓
Axios request with caching (GET cached for 6 hours)
  ↓
Response interceptor handles auth errors (401 → logout)
  ↓
Component state updated (setData, setLoading, setError)
  ↓
Component re-renders with new state
```

## Common Development Tasks

### Adding a New Page

1. Create component in `src/pages/public/` or `src/pages/admin/`
2. Add route in `App.jsx`
3. If admin, wrap with `<ProtectedRoute>`
4. Import and use API functions from `src/services/api.js`
5. Use `useFetch` or `usePaginatedFetch` for data loading
6. Apply Tailwind classes for styling
7. Use `themeStore` for theme-aware styling

### Adding a New API Endpoint

1. Add function to `src/services/api.js` using existing pattern
2. Export the function
3. Use in components via `useFetch` hook
4. Handle loading/error states

### Adding a New Component

1. Create file in `src/components/` (or subdirectory)
2. Export default function component
3. Accept props for data/callbacks
4. Use Tailwind classes only (no CSS files)
5. Use theme-aware color classes if needed

### Styling with Dark Mode

Always provide both light and dark variants:
```jsx
const isDark = themeStore(state => state.isDark);
const bgClass = isDark ? 'bg-dark-bg-secondary' : 'bg-white';
```

Or use Tailwind's dark: prefix:
```jsx
<div className="bg-white dark:bg-dark-bg-secondary">
```

## Performance Considerations

### Caching

- GET requests cached for 6 hours by default
- Useful for celebrity lists, metrics (doesn't change frequently)
- POST/PUT/PATCH/DELETE bypass cache automatically
- Override cache with `VITE_CACHE_DURATION` env var

### Code Splitting

Vite automatically handles code splitting for production builds. No manual configuration needed.

### Image Optimization

Current app has minimal images (mostly text). If adding images:
- Use relative paths from public/ folder
- Consider using WebP format with fallback
- Lazy load images below the fold

## File Naming Conventions

- **Components**: PascalCase (e.g., `CelebrityCard.jsx`)
- **Utilities/hooks**: camelCase (e.g., `useFetch.js`, `formatters.js`)
- **Stores**: camelCase (e.g., `authStore.js`)
- **CSS**: globals.css (only one global stylesheet)

## Common Gotchas

### Vite Environment Variables

- Must start with `VITE_` prefix to be exposed
- Must be defined before dev server starts
- Use `import.meta.env.VITE_*` (not `process.env`)

### React Router Nesting

- Public routes: no nesting needed
- Admin routes: wrap each with `<ProtectedRoute>`
- Don't nest `BrowserRouter` (only one at root)

### Zustand State Updates

- Use function setters for complex updates
- Store state is shallow-merged (no nested updates)
- Call hooks directly in components (not in callbacks outside render)

### Tailwind Dark Mode

- Dark mode is controlled by `dark` class on `<html>`
- Manually managed via `themeStore.setTheme()`
- Use `dark:` prefix for dark variants

### API Caching

- Only GET requests are cached
- If data changes server-side, cache won't reflect it for 6 hours
- Can bust cache by changing URL params or using POST for forced refresh

## Deployment Notes

Before deploying to production:

1. Update `VITE_API_URL` to point to production backend
2. Set `VITE_CACHE_DURATION` to appropriate value (6 hours for stable data)
3. Ensure backend CORS allows frontend origin
4. Run `npm run build` and verify `dist/` folder is created
5. Deploy `dist/` folder to web server (static file serving)
6. Set up proper caching headers (short TTL for index.html, long TTL for assets)
7. Configure API proxy if needed (backend on different domain)
8. Test admin login with production credentials

For SPA routing (React Router), configure web server to serve `index.html` for all non-asset requests.
