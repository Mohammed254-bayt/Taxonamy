# TaxonomyTracker Deployment Guide

## 🚀 Quick Start Options

### Option 1: Docker Deployment (Recommended for Development)

#### Prerequisites
- Docker and Docker Compose installed
- Git

#### Steps
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd TaxonomyTracker

# 2. Start the application
docker-compose up -d

# 3. Initialize the database
docker-compose exec app npm run db:push

# 4. Access the application
# Frontend: http://localhost:4000
# API: http://localhost:4000/api
```

### Option 2: Cloud Deployment (Render.com)

#### Prerequisites
- GitHub account
- Render.com account

#### Steps

1. **Setup Database**
   - Create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   - Copy the connection string

2. **Deploy to Render**
   - Push your code to GitHub
   - Connect Render to your repository
   - Set environment variables:
     ```env
     NODE_ENV=production
     DATABASE_URL=postgresql://user:pass@host:port/database
     SESSION_SECRET=your-long-random-secret-key
     ```
   - Deploy!

### Option 3: Manual VPS Deployment

#### Prerequisites
- Ubuntu/Debian VPS
- Domain name (optional)
- SSL certificate (Let's Encrypt recommended)

#### Steps

```bash
# 1. Server Setup
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm postgresql postgresql-contrib nginx -y

# 2. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Setup PostgreSQL
sudo -u postgres createuser --interactive
sudo -u postgres createdb taxonomy_tracker

# 4. Clone and build
git clone <your-repo>
cd TaxonomyTracker
npm install
npm run build

# 5. Environment Setup
cp .env.example .env
# Edit .env with your database credentials

# 6. Initialize database
npm run db:push

# 7. Start with PM2
npm install -g pm2
pm2 start dist/index.js --name "taxonomy-tracker"
pm2 startup
pm2 save
```

## 🔧 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application
NODE_ENV=production
PORT=4000
SESSION_SECRET=your-super-secret-session-key-min-32-characters

# Optional
UPLOAD_DIR=./uploads
```

## 🔄 Database Migration

After deployment, initialize the database:

```bash
# For Docker
docker-compose exec app npm run db:push

# For manual deployment
npm run db:push
```

## 📂 File Uploads

The application uses local file storage. For production:

1. **Docker**: Uploads are stored in a persistent volume
2. **Cloud**: Consider using cloud storage (AWS S3, Cloudinary)
3. **VPS**: Ensure uploads directory has proper permissions

```bash
mkdir -p uploads
chmod 755 uploads
```

## 🔒 Security Considerations

### For Production Deployment:

1. **Environment Variables**
   - Use strong, unique SESSION_SECRET
   - Don't expose database credentials
   - Use environment-specific configs

2. **Database Security**
   - Enable SSL for database connections
   - Use connection pooling
   - Regular backups

3. **Application Security**
   - Enable HTTPS
   - Set up rate limiting
   - Configure CORS properly
   - Regular security updates

4. **Nginx Configuration** (for VPS)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   ```bash
   # Check database URL format
   echo $DATABASE_URL
   
   # Test connection
   psql $DATABASE_URL
   ```

2. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist dist-client
   npm install
   npm run build
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port 4000
   lsof -i :4000
   
   # Kill the process
   kill -9 <PID>
   ```

4. **Permission Issues**
   ```bash
   # Fix uploads directory permissions
   sudo chown -R www-data:www-data uploads/
   sudo chmod -R 755 uploads/
   ```

## 📊 Monitoring

### Health Check Endpoint
The application exposes health endpoints:
- `GET /api/dashboard/stats` - Application health
- Database connectivity is checked on startup

### Logging
- Application logs are written to stdout
- Use PM2 or Docker logs for log management
- Consider centralized logging for production

## 🔄 Updates and Maintenance

### Docker Update Process:
```bash
docker-compose down
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Manual Update Process:
```bash
git pull origin main
npm install
npm run build
pm2 restart taxonomy-tracker
```

## 💾 Backup Strategy

### Database Backup:
```bash
# Automated daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

### File Uploads Backup:
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🎯 Performance Optimization

### For Production:
1. Enable gzip compression
2. Set up CDN for static assets
3. Configure database connection pooling
4. Enable application caching
5. Monitor resource usage

### Resource Requirements:
- **Minimum**: 1 CPU, 1GB RAM, 10GB storage
- **Recommended**: 2 CPU, 2GB RAM, 20GB storage
- **Database**: Separate instance recommended for production 