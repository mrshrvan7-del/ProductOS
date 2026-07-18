FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start command
CMD ["npm", "run", "dev"]
