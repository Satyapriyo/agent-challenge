FROM node:20-alpine

# Install Redis, curl, unzip, bash, and libc6-compat
RUN apk add --no-cache \
    curl \
    unzip \
    redis \
    bash \
    libc6-compat

# Install Ollama from official GitHub release
RUN curl -L https://github.com/ollama/ollama/releases/download/v0.1.34/ollama-linux-amd64 \
    -o /usr/local/bin/ollama && \
    chmod +x /usr/local/bin/ollama

# Environment variables
ENV API_BASE_URL=http://127.0.0.1:11434/api
ENV MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies and install
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy app source
COPY . .

# Make start script executable
COPY start-all.sh /start-all.sh
RUN chmod +x /start-all.sh

# Start script
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["/start-all.sh"]