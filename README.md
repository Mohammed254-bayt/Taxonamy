# Taxonomy Management System

A full-stack web application for managing taxonomies, occupations, and synonyms with a modern React frontend and Node.js backend.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL database (external or cloud-hosted)

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Application configuration
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

**Database URL Examples:**
- PostgreSQL: `postgresql://username:password@localhost:5432/database_name`
- MySQL: `mysql://username:password@localhost:3306/database_name`
- SQLite: `file:./dev.db`

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd taxonomy-management
   ```

2. **Set up environment variables:**
   Create a `.env` file with your database configuration (see Environment Setup above).

3. **Run with Docker Compose:**
   ```bash
   docker-compose up
   ```

   The application will be available at `http://localhost:4000`

4. **Local development (without Docker):**
   ```bash
   npm install
   npm run dev
   ```

### Features

- **Taxonomy Management**: Create and manage hierarchical taxonomies
- **Occupation Management**: Add, edit, and organize occupations
- **Synonym Management**: Manage synonyms and their relationships
- **Data Import/Export**: CSV import and export functionality
- **User Authentication**: Secure login system
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- React Hook Form for form handling

**Backend:**
- Node.js with Express
- TypeScript
- Drizzle ORM
- PostgreSQL (configurable)

**DevOps:**
- Docker & Docker Compose
- Volume mounting for development
- Environment-based configuration

### Development Notes

- The application uses volume mounting for development, so changes to your local files will be reflected immediately in the container
- Database migrations are handled automatically by Drizzle ORM
- The uploads directory is persisted between container restarts
- All PostgreSQL dependencies have been removed from Docker Compose - you'll need to provide your own database via `DATABASE_URL`

### Deployment

For production deployment, you'll need to:
1. Set up a PostgreSQL database (cloud or self-hosted)
2. Configure the `DATABASE_URL` environment variable
3. Set `NODE_ENV=production`
4. Use a secure `SESSION_SECRET`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
