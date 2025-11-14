# Taiwan Celebrity Tracker - Frontend

This is the React frontend for the Taiwan Celebrity Tracker, featuring a dual-interface design with admin dashboard and public celebrity cards.

## Quick Start

### Prerequisites
- Node.js 16+
- npm 8+
- Backend running on http://localhost:5000

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

### Build for Production

```bash
npm run build      # Creates dist/ folder
npm run preview    # Test production build locally
```

## Project Structure

See `/frontend/frontend.md` for **complete development instructions**.

That file contains:
- Full project overview
- Component architecture (github-readme-stats inspired)
- Dual interface (Admin + Public) specifications
- API integration details
- Styling guidelines (tech/futuristic aesthetic)
- Development workflow (14-day phases)
- Success criteria
- Troubleshooting guide

## Key Directories

- `src/components/` - Reusable React components (cards, layouts, shared)
- `src/pages/` - Page components (admin pages, public pages)
- `src/services/` - API client and utilities
- `src/styles/` - Global styles and theme
- `src/utils/` - Helper functions
- `src/context/` - Global state (theme, auth)
- `public/` - Static assets

## Development Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

## Features

### Admin Interface
- Dashboard with system stats
- Scraping control (trigger batch/single jobs)
- Data management
- Analytics and exports

### Public Interface
- **Trending** - Top 5 celebrities this week (Priority #1)
- **Celebrity List** - Browse all 100 celebrities
- **Details** - Full profile with metrics (Priority #2)
- **Mentions Timeline** - All mentions with sources (Priority #3)
- **Card Embed** - Shareable SVG cards

## Design Aesthetic

- **Tech & Futuristic** feel
- Dark backgrounds with neon accents (cyan, magenta, lime)
- Modern typography (Space Grotesk, Inter, JetBrains Mono)
- Light and dark theme toggle
- Responsive design (mobile, tablet, desktop)

## API Integration

The frontend connects to these backend endpoints:

```
GET  /api/celebrities         - List all celebrities
GET  /api/celebrities/:id     - Single celebrity detail
GET  /api/metrics/:id         - Celebrity metrics
GET  /api/mentions/:id        - Celebrity mentions
GET  /api/card/trending       - Top 5 trending
GET  /api/admin/stats         - System statistics
POST /api/admin/scrape        - Trigger scraping job
```

See `frontend.md` Section 5 for complete endpoint documentation.

## Status

This is a **blank skeleton** ready for development. The AI agent assigned to this directory will:

1. Implement the 5 card components
2. Build admin dashboard
3. Build public pages
4. Integrate with backend API
5. Apply theming and styling
6. Deploy and test

**Expected completion**: 14 days

## Documentation

- `frontend.md` - **MAIN DOCUMENTATION** (read this first!)
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variable template
- `README.md` - This file

---

For detailed development instructions, **see `frontend.md`**.
