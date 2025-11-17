# Taiwan Celebrity Tracker - Frontend Documentation

**Status**: ✅ Production-Ready
**Version**: 1.0.0
**Last Updated**: November 14, 2025

---

## Overview

The Taiwan Celebrity Tracker Frontend is a modern React 18 application that provides dual-interface access to celebrity analytics and metrics:
- **Public Interface**: Browse celebrities, view trending, explore metrics
- **Admin Interface**: Manage scraping jobs, view analytics, control data

The application features:
- **Responsive Design**: Mobile-first Tailwind CSS with light/dark theme
- **Card-Based Architecture**: Reusable components with 3 rendering modes (React, static HTML, SVG)
- **Real-time Updates**: Live scraping job monitoring and status tracking
- **Token-Based Authentication**: Secure admin access with session persistence
- **Comprehensive Analytics**: Visual metrics, trending analysis, keyword tracking

---

## Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── cards/              # 5 reusable card components
│   │   │   ├── CelebrityCard.jsx    (3 modes: interactive/static/SVG)
│   │   │   ├── MetricsCard.jsx      (3 modes)
│   │   │   ├── MentionsCard.jsx     (2 modes: interactive/static)
│   │   │   ├── TrendingCard.jsx     (3 modes)
│   │   │   └── StatsCard.jsx        (3 modes)
│   │   └── shared/             # Shared UI components
│   │       ├── Header.jsx            (Navigation & theme toggle)
│   │       ├── ThemeToggle.jsx       (Light/dark toggle)
│   │       ├── LoadingSpinner.jsx    (Loading state)
│   │       └── ProtectedRoute.jsx    (Admin route guard)
│   ├── pages/
│   │   ├── public/             # Public pages (no auth required)
│   │   │   ├── CelebrityList.jsx     (Home page with search/filter/pagination)
│   │   │   ├── Trending.jsx          (Top 5 trending celebrities)
│   │   │   ├── CelebrityDetail.jsx   (Individual celebrity profile)
│   │   │   ├── MentionsDetail.jsx    (Full mention timeline)
│   │   │   └── CardEmbed.jsx         (Shareable card embeddings)
│   │   └── admin/              # Admin pages (auth required)
│   │       ├── AdminDashboard.jsx    (Overview & quick actions)
│   │       ├── ScrapeControl.jsx     (Start/monitor scraping)
│   │       ├── DataManagement.jsx    (Celebrity data table)
│   │       └── Analytics.jsx         (System statistics)
│   │   └── Login.jsx           (Authentication page)
│   ├── context/                # State management (Zustand)
│   │   ├── authStore.js        (Authentication & tokens)
│   │   └── themeStore.js       (Light/dark theme)
│   ├── services/               # API integration
│   │   └── api.js              (Axios client with interceptors)
│   ├── utils/                  # Utility functions
│   │   ├── constants.js        (Routes, API paths, themes)
│   │   ├── formatters.js       (Number, date, text formatting)
│   │   └── hooks/
│   │       └── useFetch.js     (Custom data fetching hook)
│   ├── styles/                 # Global styles
│   │   ├── globals.css         (Tailwind + custom animations)
│   │   └── theme.js            (Theme object definitions)
│   ├── App.jsx                 (Main app with routing)
│   └── index.jsx               (React entry point)
├── public/
│   └── index.html              (HTML template)
├── dist/                       (Production build output)
├── package.json                (Dependencies & scripts)
├── vite.config.js              (Vite configuration)
├── tailwind.config.js          (Tailwind theme config)
├── postcss.config.js           (PostCSS configuration)
├── .env.example                (Environment template)
└── .gitignore                  (Git ignore rules)
```

---

## Key Features

### 1. Component Architecture

**5 Card Components with 3 Rendering Modes**:

| Component | Interactive | Static | SVG | Usage |
|-----------|------------|--------|-----|-------|
| **CelebrityCard** | ✅ Hover effects, click handlers | ✅ Same structure | ✅ 300x350px | Celebrity display |
| **MetricsCard** | ✅ Click metrics for detail | ✅ Static metrics | ✅ 600x400px | Metrics visualization |
| **MentionsCard** | ✅ Click to expand | ✅ Static display | ❌ N/A | Mention listing |
| **TrendingCard** | ✅ Navigation, hover | ✅ Static ranking | ✅ 500x400px | Trending list |
| **StatsCard** | ✅ Interactive stats | ✅ Static display | ✅ 600x300px | System stats |

**Rendering Modes**:
- **Interactive**: React component with event handlers, hover effects, animations
- **Static**: HTML-only version for email/documentation/sharing
- **SVG**: Download-friendly vector format with embedded styling

### 2. Pages Overview

**Public Pages** (No Authentication Required)

1. **CelebrityList** (`/`)
   - Grid of celebrities with neon card styling
   - Search by name (client-side filtering)
   - Filter by category (Singer, Actor, Idol, etc.)
   - Pagination (20 celebrities per page)
   - Click to view detailed profile

2. **Trending** (`/trending`)
   - Top 5 trending celebrities
   - TrendingCard component with ranking
   - Trending score visualization
   - Links to individual profiles

3. **CelebrityDetail** (`/celebrity/:id`)
   - Main celebrity card on left
   - Tabbed interface on right:
     - **Metrics Tab**: 6 calculated metrics with values
     - **Mentions Tab**: Latest 10 mentions from media
     - **Sources Tab**: Top domains mentioning celebrity
     - **Share Tab**: Copy URL, embed code, download SVG
   - Real-time metric calculations
   - Responsive layout (stacked on mobile)

4. **MentionsDetail** (`/celebrity/:id/mentions`)
   - Full timeline of all mentions (up to 100)
   - MentionsCard for each mention
   - Domain information, dates, snippets
   - Click to expand full mention text
   - Sorted by most recent first

5. **CardEmbed** (`/card/:type/:id`)
   - Dynamic card rendering by type:
     - `/card/celebrity/:id` → CelebrityCard
     - `/card/metrics/:id` → MetricsCard
     - `/card/trending` → TrendingCard (top 5)
     - `/card/stats` → StatsCard
   - Query params:
     - `?theme=dark|light` (override system theme)
     - `?mode=interactive|static|svg` (rendering mode)
   - Features:
     - Download as SVG button
     - Copy card URL to clipboard
     - Copy HTML embed code
     - View current card URL

**Admin Pages** (Authentication Required)

1. **AdminDashboard** (`/admin/dashboard`)
   - StatsCard with 4 key metrics
   - Quick action buttons (Scrape, Manage Data, View Analytics)
   - Recent scraping jobs table (last 10)
   - System health status (API, Database, Cache)
   - Refresh button for manual updates

2. **ScrapeControl** (`/admin/scrape`)
   - **Batch Scrape**: Start scraping all 100 celebrities
   - **Single Scrape**: Select celebrity dropdown + scrape button
   - Job queue monitoring:
     - Job ID (uuid format)
     - Status badge (pending/running/completed/failed)
     - Progress bar with percentage
     - Mentions found counter
     - Start timestamp
   - Disable buttons during active scraping

3. **DataManagement** (`/admin/data`)
   - Table of all celebrities (100 total)
   - Columns:
     - Name (in Traditional Chinese)
     - English Name
     - Category badge
     - Mention count
     - Status badge (active/inactive)
   - Sortable columns
   - Responsive table with horizontal scroll on mobile

4. **Analytics** (`/admin/analytics`)
   - 4-metric grid:
     - Total Celebrities
     - Total Mentions
     - Average Mentions per Celebrity
     - Total Jobs
   - Trending Keywords section (up to 20 trending keywords)
   - System Information section:
     - Total records overview
     - Average metrics
     - Data sync status

6. **Login** (`/login`)
   - Username/password form
   - Error message display
   - Redirect to `/admin/dashboard` on success
   - Redirect to `/login` if accessing protected route without auth
   - Token-based session persistence

### 3. Theme System

**Light Theme** (`light` mode)
- Background: `bg-white`, `bg-light-bg-secondary`
- Text: `text-light-text-primary`, `text-light-text-secondary`
- Borders: `border-light-border`
- Accents: Neon colors (#00d9ff cyan, #ff00ff magenta, #00ff88 lime)

**Dark Theme** (`dark` mode)
- Background: `bg-dark-bg-primary`, `bg-dark-bg-secondary`
- Text: `text-dark-text-primary`, `text-dark-text-secondary`
- Borders: `border-dark-border`
- Accents: Same neon colors (high contrast)

**Theme Persistence**:
- localStorage key: `theme-storage` (Zustand persist plugin)
- Automatically applied on page load
- System theme detection (prefers-color-scheme) as fallback
- Toggle button in Header for manual switching

### 4. Authentication System

**Token-Based Flow**:
1. User submits login form with username/password
2. Backend validates credentials → returns auth token
3. Token stored in Zustand store + localStorage
4. Axios interceptor automatically adds token to API requests
5. On 401 response → auto-logout, redirect to /login
6. Protected routes use ProtectedRoute wrapper

**State Management** (Zustand store):
```javascript
{
  token: string,          // JWT or session token
  user: object,          // User info (username, role, etc.)
  isAuthenticated: boolean,
  login(username, password),  // Async login function
  logout(),              // Clear token & redirect
  setError(message),     // Error message display
  error: string | null
}
```

### 5. API Integration

**Base URL**: Configured via `VITE_API_URL` environment variable (default: http://localhost:5000)

**Endpoints Used**:
- `GET /api/celebrities` - List celebrities with filters
- `GET /api/celebrities/:id` - Single celebrity detail
- `GET /api/metrics/:id` - Celebrity metrics
- `GET /api/mentions/:celebrity_id` - Mentions for celebrity
- `GET /api/card/celebrity/:id` - Celebrity card data
- `GET /api/card/metrics/:id` - Metrics card data
- `GET /api/card/trending?limit=5` - Trending card data
- `GET /api/card/stats` - Stats card data
- `GET /api/admin/stats` - Admin dashboard statistics
- `GET /api/admin/jobs` - Scraping jobs list
- `POST /api/admin/scrape` - Start scraping job
- `POST /api/auth/login` - User authentication

**Error Handling**:
- All endpoints wrapped in try/catch
- User-friendly error messages
- Automatic retry on network errors
- Loading spinners during requests
- 401 errors trigger logout + redirect to /login

### 6. Styling & Design

**Tailwind CSS v3** with:
- Custom color palette (neon, light, dark)
- Custom fonts (Inter, Space Grotesk, JetBrains Mono)
- Responsive grid system (mobile-first)
- Accessibility features (focus states, color contrast)
- Animations (spin, fadeIn, slideInUp)

**Color System**:
```css
/* Neon Accents */
#00d9ff - Neon Cyan (primary)
#ff00ff - Neon Magenta (secondary)
#00ff88 - Neon Lime (success)

/* Light Theme */
Background: #ffffff
Surface: #f5f5f5
Text Primary: #000000
Text Secondary: #666666

/* Dark Theme */
Background: #0f0f0f
Surface: #1a1a1a
Text Primary: #ffffff
Text Secondary: #cccccc
```

**Responsive Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## Setup Instructions

### 1. Installation

```bash
# Install dependencies
cd frontend
npm install

# Create .env file
cp .env.example .env

# Update VITE_API_URL if needed (default: http://localhost:5000)
```

### 2. Development

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Dev server includes hot module reloading (HMR)
```

### 3. Production Build

```bash
# Build optimized bundle
npm run build

# Output in dist/ directory:
# - index.html (~1KB)
# - assets/index-*.css (~18KB gzip)
# - assets/index-*.js (~265KB gzip)

# Preview production build locally
npm run preview
```

---

## Environment Variables

### Development (`.env`)
```
VITE_API_URL=http://localhost:5000
```

### Production (`.env.production`)
```
VITE_API_URL=https://api.your-domain.com
```

**Note**: Vite automatically loads `.env.production` during build when `NODE_ENV=production`

---

## Build Information

**Build Date**: November 14, 2025
**Build Tool**: Vite 5.4.21
**React Version**: 18.3.1
**Node Version**: 18.0+

**Bundle Metrics**:
- JavaScript: 264.95 KB (76.84 KB gzip)
- CSS: 18.83 KB (4.14 kB gzip)
- HTML: 0.98 KB (0.51 KB gzip)
- **Total**: 284.76 KB (81.49 KB gzip)

**Build Performance**:
- Build Time: 4.12 seconds
- Modules Transformed: 955
- Source Maps: Included in dev, disabled in production

---

## Deployment

### Static Hosting (Recommended)

1. **Build Production Bundle**
   ```bash
   npm run build
   ```

2. **Copy dist/ to Web Server**
   ```bash
   cp -r dist/* /var/www/html/frontend/
   ```

3. **Configure Web Server**
   - Serve index.html for all routes (SPA routing)
   - Enable gzip/brotli compression
   - Set appropriate Cache-Control headers
   - Configure CORS for API backend

4. **Example Nginx Config**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     root /var/www/html/frontend;
     index index.html;

     # SPA routing
     location / {
       try_files $uri /index.html;
     }

     # Cache static assets
     location ~* \.(js|css|png|jpg|gif|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }

     # Don't cache HTML
     location = /index.html {
       add_header Cache-Control "no-cache";
     }
   }
   ```

### Vercel/Netlify Deployment

1. **Connect GitHub Repository**
2. **Configure Build Settings**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Add Environment Variables**:
   - `VITE_API_URL`: Your backend API URL
4. **Deploy**

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build & Run**
   ```bash
   docker build -t taiwan-celebrity-frontend .
   docker run -p 3000:80 taiwan-celebrity-frontend
   ```

---

## Performance Optimization

### Already Implemented
- ✅ Vite for instant HMR
- ✅ Code splitting with dynamic imports
- ✅ Tailwind CSS minification
- ✅ JavaScript minification & tree-shaking
- ✅ CSS purging (unused styles removed)
- ✅ Image optimization recommendations

### Recommended Production Steps
- [ ] Enable gzip/brotli compression on server
- [ ] Use CDN for static assets (CloudFlare, AWS CloudFront)
- [ ] Enable HTTP/2 on server
- [ ] Set aggressive Cache-Control headers
- [ ] Monitor Core Web Vitals (LCP, FID, CLS)

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Full support |
| Firefox | Latest | ✅ Full support |
| Safari | Latest | ✅ Full support |
| Edge | Latest | ✅ Full support |
| IE 11 | - | ❌ Not supported |

---

## Troubleshooting

### API Connection Issues
- Verify `VITE_API_URL` matches backend location
- Check backend API is running on correct port
- Verify CORS headers from backend
- Check browser Network tab for failed requests

### Theme Not Persisting
- Ensure localStorage is enabled
- Check browser console for errors
- Clear browser cache and reload

### Routes Not Working (404 on Refresh)
- Web server must route all requests to index.html
- Configure SPA routing on your web server
- See deployment section for examples

### Slow Page Loads
- Check network requests in browser DevTools
- Enable server-side compression (gzip/brotli)
- Use Lighthouse to identify bottlenecks
- Consider CDN for static assets

### CSS Not Loading
- Verify `dist/` files exist after build
- Check web server is serving assets correctly
- Look for 404 errors in Network tab
- Clear browser cache

---

## Dependencies

**Core Framework**:
- react@18.3.1 - UI framework
- react-dom@18.3.1 - React DOM rendering
- react-router-dom@6.20.1 - Client-side routing

**State Management**:
- zustand@4.4.3 - Lightweight state management

**HTTP Client**:
- axios@1.6.2 - API requests

**Styling**:
- tailwindcss@3.3.6 - Utility CSS framework
- postcss@8.4.32 - CSS preprocessor
- autoprefixer@10.4.16 - CSS vendor prefixing

**Utilities**:
- date-fns@2.30.0 - Date formatting and manipulation

**Build Tools**:
- vite@5.4.21 - Frontend build tool
- @vitejs/plugin-react@4.2.0 - React plugin for Vite

See `package.json` for complete dependency list.

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally: `npm run dev`
3. Commit with clear messages: `git commit -m "feat: description"`
4. Push to repository: `git push origin feature/your-feature`
5. Create Pull Request for review

---

## License

This project is part of the Taiwan Celebrity Tracker. See root LICENSE file for details.

---

## Support

For issues and questions:
- **Frontend Issues**: GitHub Issues (taiwan-celebrity-tracker)
- **Documentation**: See `/frontend/README.md`
- **Backend API**: Documentation at `/backend/README.md`

---

**Last Updated**: November 14, 2025
**Status**: Production Ready
**Version**: 1.0.0
