FROM node:20-alpine

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy source
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
