# server/Dockerfile
FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY . .

# Ensure database file exists and is writable
RUN touch database.sqlite && chmod 666 database.sqlite

EXPOSE 3001

CMD ["node", "index.js"]
