# Taiwan Celebrity Tracker - Quick Start Guide

**Status**: 🟢 Production Ready | **Last Updated**: 2025-11-12

---

## 30 Second Start

```bash
# 1. Start the backend (if not already running)
cd /Users/howard/Desktop/VS\ code\ file/V2/backend && npm start

# 2. In another terminal, test the API
curl http://localhost:5000/health

# 3. Access the system
- API: http://localhost:5000
- Database: localhost:3306 (celeb_user / 0000)
- Frontend: http://localhost:3000 (coming soon)
```

---

## Current System Status

✅ **MySQL**: Running on localhost:3306
✅ **Backend API**: Running on localhost:5000
✅ **Data**: 100 celebrities + 989 mentions loaded
✅ **Endpoints**: 14 REST APIs operational
✅ **Security**: Configured (Helmet, CORS, rate limiting)

---

## Common Commands

### Check Health
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/admin/stats
```

### List Data
```bash
# All celebrities
curl http://localhost:5000/api/celebrities

# Specific celebrity
curl http://localhost:5000/api/celebrities/1

# By category
curl "http://localhost:5000/api/celebrities?category=Singer"

# Get categories
curl http://localhost:5000/api/celebrities/categories
```

### Database Access
```bash
# Connect to MySQL
mysql -h 127.0.0.1 -u celeb_user -p'0000' taiwan_celebrities

# Quick checks
mysql -h 127.0.0.1 -u celeb_user -p'0000' taiwan_celebrities << EOF
SELECT COUNT(*) as celebrities FROM celebrities;
SELECT COUNT(*) as mentions FROM celebrity_mentions;
SELECT category, COUNT(*) FROM celebrities GROUP BY category;
EXIT;
EOF
```

### Backend Development
```bash
cd /Users/howard/Desktop/VS\ code\ file/V2/backend

# Start with hot reload
npm run dev

# Or production
npm start

# Seed data
npm run seed
```

### Database Maintenance
```bash
# Backup
bash /Users/howard/Desktop/VS\ code\ file/V2/database/scripts/backup-db.sh

# Analyze performance
bash /Users/howard/Desktop/VS\ code\ file/V2/database/scripts/check-slow-queries.sh

# Check growth
bash /Users/howard/Desktop/VS\ code\ file/V2/database/scripts/check-table-growth.sh

# Optimize
bash /Users/howard/Desktop/VS\ code\ file/V2/database/scripts/optimize-tables.sh
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/api/celebrities` | List celebrities |
| GET | `/api/celebrities/:id` | Get celebrity |
| GET | `/api/celebrities/categories` | Get categories |
| GET | `/api/metrics/:id` | Get metrics |
| GET | `/api/mentions/:id` | Get mentions |
| GET | `/api/admin/stats` | Database stats |
| GET | `/api/admin/health` | Admin health |

---

## Database Credentials

```
Host: 127.0.0.1
Port: 3306
User: celeb_user
Password: 0000
Database: taiwan_celebrities
Charset: utf8mb4
```

---

## File Locations

```
Backend:     /Users/howard/Desktop/VS code file/V2/backend
Database:    /Users/howard/Desktop/VS code file/V2/database
Scraper:     /Users/howard/Desktop/VS code file/V2/scraper
Frontend:    /Users/howard/Desktop/VS code file/V2/frontend
Config:      /Users/howard/Desktop/VS code file/V2/.env
```

---

## Troubleshooting

### Backend won't start?
```bash
# Check if port is in use
lsof -i :5000

# Check MySQL is running
brew services list | grep mysql

# Verify .env
cat /Users/howard/Desktop/VS\ code\ file/V2/.env | grep DB_
```

### Database connection error?
```bash
# Test connection
mysql -h 127.0.0.1 -u celeb_user -p'0000' -e "SELECT 1;"

# Start MySQL if needed
brew services start mysql
```

### Slow responses?
```bash
# Check indexes
mysql -h 127.0.0.1 -u celeb_user -p'0000' taiwan_celebrities \
  -e "SHOW INDEX FROM celebrities;"

# Optimize tables
bash /Users/howard/Desktop/VS\ code\ file/V2/database/scripts/optimize-tables.sh
```

---

## Next Steps

1. **Frontend**: Develop React UI (port 3000)
2. **Google API**: Add API keys to .env
3. **Metrics**: Calculate metrics from 989 mentions
4. **Production**: Deploy to production server

---

## Documentation

- **Full README**: See `README.md`
- **Backend Guide**: See `backend/ai.md`
- **Database Guide**: See `database/IMPROVEMENTS.md`
- **Deployment**: See `database/DEPLOYMENT_CHECKLIST.md`
- **Scraper**: See `scraper/README.md`
- **Frontend**: See `frontend/ai.md`

---

**Version**: 1.0.0 | **Status**: 🟢 Operational | **Last Updated**: 2025-11-12

