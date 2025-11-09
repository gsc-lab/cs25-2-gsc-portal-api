# --- Build stage ---
FROM node:lts AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# --- Production stage ---
FROM node:lts-alpine AS production
WORKDIR /app
COPY --from=build /app ./
RUN npm install --only=production
EXPOSE 3000
CMD ["npm", "run", "start"]

# -v $(pwd):/app
