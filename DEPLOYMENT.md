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
Run the production compose file.
```bash
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

## Optional: HTTPS (SSL Security) - Standard Production
The setup above uses HTTP (Not Secure). To get the green lock (HTTPS), you should set up a **Reverse Proxy**.
The easiest way for Docker users is **Nginx Proxy Manager**:
1.  It handles SSL certificates for free (Let's Encrypt).
2.  It forwards `https://example.com` -> Frontend Container (Port 80).
3.  It forwards `https://api.example.com` -> Backend Container (Port 3000).

For now, start with the IP/Domain setup above to confirm it works, then look into "Nginx Proxy Manager" for SSL.
