# Taiwan Celebrity Tracker - Frontend Quick Start Guide

**Last Updated**: November 14, 2025
**Version**: 1.0.0

---

## 30-Second Overview

The Taiwan Celebrity Tracker Frontend is a production-ready React application with:
- **9 pages** (5 public, 4 admin)
- **5 card components** with 3 rendering modes each
- **Complete API integration** with token auth
- **Light/dark theme** system
- **265KB JS** + **18KB CSS** (production-optimized)

---

## Installation (2 minutes)

```bash
# Install dependencies
cd frontend
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

**Done!** App running at http://localhost:3000

---

## Production Build (5 minutes)

```bash
# Build optimized bundle
npm run build

# Test locally
npm run preview

# Deploy to server
cp -r dist/* /var/www/html/frontend/
```

---

## File Map

```
📁 frontend/
  📁 src/
    📁 components/     → 12 UI components (cards, header, etc.)
    📁 pages/          → 10 pages (5 public, 4 admin, 1 login)
    📁 context/        → Auth & theme state management
    📁 services/       → API client with Axios
    📁 utils/          → Helpers & constants
    📁 styles/         → Global CSS & theme definitions
    📄 App.jsx         → Main routing component
    📄 index.jsx       → React entry point
  📁 public/           → Static assets
  📁 dist/             → Production build (after npm run build)
```

---

## Routes

### Public (No Auth Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | CelebrityList | Browse celebrities |
| `/trending` | Trending | Top 5 trending |
| `/celebrity/:id` | CelebrityDetail | Celebrity profile |
| `/celebrity/:id/mentions` | MentionsDetail | All mentions |
| `/card/:type/:id` | CardEmbed | Shareable cards |
| `/login` | Login | Authentication |

### Admin (Auth Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/dashboard` | AdminDashboard | Overview & stats |
| `/admin/scrape` | ScrapeControl | Manage scraping |
| `/admin/data` | DataManagement | Celebrity table |
| `/admin/analytics` | Analytics | System analytics |

---

## API Integration

### Base URL
```javascript
VITE_API_URL=http://localhost:5000  // Development
VITE_API_URL=https://api.your-domain.com  // Production
```

### Key Endpoints
```
GET /api/celebrities          # List all celebrities
GET /api/celebrities/:id      # Single celebrity detail
GET /api/metrics/:id          # Metrics for celebrity
GET /api/mentions/:id         # Mentions for celebrity
POST /api/auth/login          # User authentication
POST /api/admin/scrape        # Start scraping job
GET /api/admin/stats          # Admin statistics
```

---

## Environment Setup

### `.env` File
```bash
# Development
VITE_API_URL=http://localhost:5000

# Production
VITE_API_URL=https://your-api.com
```

**Note**: Vite automatically loads `.env.production` during production build

---

## Component Usage Examples

### Card Components
```jsx
// Interactive mode (React component)
<CelebrityCard
  celebrity={data}
  mode="interactive"
  theme="dark"
/>

// Static mode (HTML only)
<CelebrityCard
  celebrity={data}
  mode="static"
  theme="dark"
/>

// SVG mode (Download-friendly)
<CelebrityCard
  celebrity={data}
  mode="svg"
  theme="dark"
/>
```

### API Calls
```javascript
import { fetchCelebrities, fetchMetrics } from '@/services/api.js';

// Get list of celebrities
const { data } = await fetchCelebrities(limit, offset, filters);

// Get metrics for celebrity
const metrics = await fetchMetrics(celebrityId);
```

### State Management
```javascript
import themeStore from '@/context/themeStore.js';
import authStore from '@/context/authStore.js';

// Theme
const { isDark, toggleTheme } = themeStore();

// Auth
const { token, login, logout, isAuthenticated } = authStore();
```

---

## Key Features

### Responsive Design
- Mobile-first (320px+)
- Tablet optimized (768px+)
- Desktop enhanced (1024px+)
- Tailwind breakpoints: sm, md, lg, xl, 2xl

### Theme System
- **Light Theme**: White bg, dark text
- **Dark Theme**: Dark bg, light text
- **Neon Accents**: Cyan, Magenta, Lime
- **Auto-persist**: localStorage saved across sessions

### Authentication
- Token-based auth
- Auto logout on 401
- Protected routes
- Session persistence

### Error Handling
- User-friendly messages
- Network retry logic
- Loading spinners
- Graceful fallbacks

---

## Performance

### Bundle Size
| Asset | Size | Gzipped |
|-------|------|---------|
| HTML | 0.98 KB | 0.51 KB |
| CSS | 18.83 KB | 4.14 KB |
| JS | 264.95 KB | 76.84 KB |
| **Total** | **284.76 KB** | **81.49 KB** |

### Build Time
- Development: < 400ms
- Production: ~4 seconds

### Runtime Performance
- First Paint: < 1s
- Largest Contentful Paint: < 2s
- Time to Interactive: < 3s

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build optimized bundle
npm run preview      # Preview production build locally

# Utilities
npm audit           # Check for security vulnerabilities
npm list            # List all dependencies
npm update          # Update dependencies
```

---

## Troubleshooting

### API Not Connecting
- Check `VITE_API_URL` in `.env`
- Verify backend running on correct port
- Check browser console for CORS errors

### Theme Not Persisting
- Clear browser cache
- Check localStorage enabled
- Try incognito/private mode

### Routes Not Working (404)
- Web server must route all requests to `index.html` (SPA)
- Configure nginx/Apache for SPA routing (see deployment guide)

### CSS Not Loading
- Check `dist/` folder exists after build
- Verify web server serving assets
- Clear browser cache

### Build Fails
- Delete `node_modules` and `dist`
- Run `npm install` again
- Check Node.js version >= 16

---

## Deployment

### Nginx Configuration
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /var/www/html/frontend;
  index index.html;

  location / {
    try_files $uri /index.html;  # SPA routing
  }

  location ~* \.(js|css|png|jpg|gif|svg)$ {
    expires 1y;  # Cache assets
  }
}
```

### Docker
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Vercel/Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set env var: `VITE_API_URL`
5. Deploy

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Yes |
| Firefox | 88+ | ✅ Yes |
| Safari | 14+ | ✅ Yes |
| Edge | 90+ | ✅ Yes |
| IE 11 | Any | ❌ No |

---

## Tech Stack

- **React 18.3** - UI framework
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.3** - Styling
- **Zustand 4.4** - State management
- **Axios 1.6** - HTTP client
- **React Router 6.2** - Routing
- **date-fns 2.3** - Date utilities

---

## Git Workflow

```bash
# Clone & setup
git clone <repo>
cd frontend
npm install

# Make changes
git checkout -b feature/your-feature
# ... make changes ...

# Commit
git add .
git commit -m "feat: description of changes"
git push origin feature/your-feature

# Create PR for review
```

---

## Monitoring Checklist

Post-deployment monitoring:
- [ ] Frontend loads at correct URL
- [ ] All pages accessible (no 404s)
- [ ] API calls working
- [ ] Theme toggle works
- [ ] Authentication working
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Performance acceptable

---

## Getting Help

1. **Documentation**: Read `/frontend/README.md`
2. **Deployment**: See `FRONTEND_DEPLOYMENT_CHECKLIST.md`
3. **Errors**: Check browser console & network tab
4. **Setup**: Review `.env` configuration

---

## Summary

✅ **Installation**: `npm install && npm run dev`
✅ **Production**: `npm run build && deploy dist/`
✅ **Dev Server**: http://localhost:3000
✅ **API Endpoint**: Configure `VITE_API_URL`
✅ **Status**: Production-ready

---

**For detailed documentation, see**:
- `FRONTEND_README.md` - Complete reference
- `FRONTEND_DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `FRONTEND_BUILD_STATUS_REPORT.md` - Status report
