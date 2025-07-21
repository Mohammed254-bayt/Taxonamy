# Development stage
FROM node:18-alpine

WORKDIR /app

# Copy package files only
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Start the application in development mode
CMD ["npm", "run", "dev"] 