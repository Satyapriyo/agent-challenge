#!/bin/sh
# Start Redis in the background
redis-server &

# Start Ollama in the background and pull the model
ollama serve &
sleep 5
ollama pull ${MODEL_NAME_AT_ENDPOINT}

# Start your app
npm run dev