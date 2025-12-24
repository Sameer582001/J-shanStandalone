#!/bin/bash

# Production Restart Script
# Usage: ./restart.sh

echo "---------------------------------------------"
echo "🔄 Updating Codebase..."
echo "---------------------------------------------"
git pull

echo "---------------------------------------------"
echo "🛑 Stopping & Removing Old Containers..."
echo "---------------------------------------------"
# We use 'down' to remove containers/networks to prevent state conflicts (KeyError fix)
docker-compose -f docker-compose.prod.yml down --remove-orphans

echo "---------------------------------------------"
echo "🚀 Rebuilding & Starting Services..."
echo "---------------------------------------------"
docker-compose -f docker-compose.prod.yml up -d --build

echo "---------------------------------------------"
echo "✅ Deployment Complete!"
echo "---------------------------------------------"
docker-compose -f docker-compose.prod.yml ps
