# VPS Deployment Guide

## Prerequisites (What to install on the VPS)
Since we are using Docker, you **DO NOT** need to install Node.js, PostgreSQL, or Redis on the VPS. Everything runs inside containers.

You only need two things:
1.  **Git**: To clone your code.
2.  **Docker & Docker Compose**: To run the application.

### How to install (Ubuntu/Debian example):
```bash
# 1. Update system
sudo apt update

# 2. Install Git
sudo apt install git -y

# 3. Install Docker
sudo apt install docker.io -y

# 4. Install Docker Compose
sudo apt install docker-compose -y
# OR if using newer docker versions, 'docker compose' is built in.

# 5. Start and Enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

## Step 1: Push to GitHub
Push your local code to your GitHub repository.
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

## Step 2: Clone on VPS
SSH into your VPS and clone the repo.
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

## Step 3: Configure for Your Domain/IP (**Critical**)
The Frontend needs to know where the Backend lives.
Open `docker-compose.prod.yml` on the VPS (using `nano` or `vim`) and find `VITE_API_URL`.

**Change this:**
```yaml
args:
  VITE_API_URL: http://localhost:3000
```
**To your VPS IP or Domain:**
```yaml
args:
  VITE_API_URL: http://123.45.67.89:3000  # Replace with your actual VPS IP
```
*If you don't do this, users will try to connect to their OWN computers (localhost) instead of your server.*

## Step 4: Run Production Build
## Step 4: Run Production Build

We have included a helper script `restart.sh` to make this easy and clean up any old containers (preventing errors).

1.  **Give permission** (run once):
    ```bash
    chmod +x restart.sh
    ```

2.  **Run Deployment**:
    ```bash
    ./restart.sh
    ```
    *This script automatically pulls the latest code, stops old containers (fixing common errors), and rebuilds everything.*

Alternatively, the manual command is:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Step 5: Verify
Visit `http://123.45.67.89` (your IP).
- The Frontend serves on Port 80.
- It connects to the Backend on Port 3000.

## Step 6: Domain Setup (Connecting your Domain)

To use a domain like `www.example.com` instead of an IP address:

1.  **DNS Settings**: Go to where you bought your domain (GoDaddy, Namecheap, etc.) and add an **A Record**:
    *   **Host/Name**: `@` (or `www`)
    *   **Value/IP**: `Your VPS IP Address`

2.  **Update Config**:
    On your VPS, edit `docker-compose.prod.yml` and update the `VITE_API_URL` to use your domain:
    ```yaml
    args:
      VITE_API_URL: http://www.example.com:3000
    ```

3.  **Rebuild**:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

## Step 7: Setting up SSL (HTTPS) with Nginx Proxy Manager

To get the green lock (HTTPS) on your domain, we will add **Nginx Proxy Manager** (NPM) to your Docker setup. This tool handles certificates automatically.

### 1. Update `docker-compose.prod.yml`
You need to make two changes:
1.  **Free up Port 80**: Change the Frontend port so NPM can take over Port 80/443.
2.  **Add NPM Service**: Add the proxy container.

Update your `docker-compose.prod.yml` to look like this (focus on the **ports** and **npm** service):

```yaml
services:
  # ... postgres and redis remain the same ...

  backend:
    # ... build/env/depends_on remain the same ...
    ports:
      - "3000:3000" # Keep this open so NPM can talk to it (or backend can talk to frontend)
    # ...

  frontend:
    # ... build/depends_on remain the same ...
    ports:
      # CHANGE THIS: Move frontend away from Port 80 so SSL Proxy can have it
      - "8080:80" 
    container_name: mlm_frontend_prod

  # ADD THIS NEW SERVICE
  npm:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'   # Public HTTP
      - '81:81'   # Admin Panel
      - '443:443' # Public HTTPS
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
```

### 2. Apply Changes
1.  Stop the running containers: `docker-compose -f docker-compose.prod.yml down`
2.  Start the new setup: `docker-compose -f docker-compose.prod.yml up -d --build`

### 3. Log in to Nginx Proxy Manager
1.  Open your browser and go to: `http://YOUR_VPS_IP:81`
2.  **Default Login**:
    *   Email: `admin@example.com`
    *   Password: `changeme`
3.  Update your credentials when prompted.

### 4. Configure Proxy Hosts (The Connections)
Now tell NPM how to route traffic.

#### A. Frontend (www.example.com)
1.  Click **"Proxy Hosts"** -> **"Add Proxy Host"**.
2.  **Details Tab**:
    *   **Domain Names**: `example.com` (and `www.example.com` -> hit Add)
    *   **Scheme**: `http`
    *   **Forward Hostname / IP**: `mlm_frontend_prod` (This is the container name!)
    *   **Forward Port**: `80` (Internal container port)
    *   **Cache Assets**: Enable 
    *   **Block Common Exploits**: Enable
    *   **Websockets Support**: Enable
3.  **SSL Tab**:
    *   **SSL Certificate**: "Request a new SSL Certificate"
    *   **Force SSL**: Enable
    *   **HTTP/2 Support**: Enable
    *   **Email**: Enter your email.
    *   **Agree to Terms**: Check.
4.  Click **Save**.

#### B. Backend API (api.example.com) - *Optional but Recommended*
If you want your API to be secure too (e.g., `https://api.example.com`):
1.  Add another **Proxy Host**.
2.  **Domain Names**: `api.example.com` (Ensure you added this DNS record!)
3.  **Forward Hostname / IP**: `mlm_backend_prod`
4.  **Forward Port**: `3000`
5.  **SSL Tab**: Same settings (Request new cert, Force SSL).

### 5. Final Check
Update your `VITE_API_URL` in `docker-compose.prod.yml` to point to the **HTTPS** version now:
`VITE_API_URL: https://api.example.com` (or `https://example.com:3000` if you didn't proxy the API separately, but proxying is better).
Then rebuild: `docker-compose -f docker-compose.prod.yml up -d --build frontend`

