FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt and other native modules
RUN apk add --no-cache python3 make g++ build-base

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Rebuild bcrypt specifically to ensure it works in Alpine
RUN npm rebuild bcrypt --build-from-source

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]