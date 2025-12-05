# J-shanStandalone MLM System - Operations Manual

This document provides complete instructions for configuring, running, and managing the J-shanStandalone MLM system.

## 1. Configuration

The core system logic and administrative credentials are controlled by the configuration file located at:
`backend/src/config/plan_config.json`

### Admin Credentials & Access
To manage the default admin account and the secret login route, modify the `admin` section:

```json
"admin": {
    "mobile": "9999999999",       // Default Admin Login ID
    "password": "admin123",       // Default Admin Password
    "secret_route": "/portal-secure" // The URL path to access the Admin Login page
}
```

### Financial & Matrix Settings
*   **project_name**: The display name of the application.
*   **currency_symbol**: Symbol used for all monetary values (e.g., ₹, $).
*   **referral_prefix**: The prefix for generated referral codes (e.g., "JSE-").
*   **matrix**: Defines the width and depth of the MLM structure.
*   **fast_track**: Configuration for time-sensitive bonuses.

---

## 2. System Management

### First Time Setup
After installing dependencies (`npm install` in both `backend` and `frontend`), run these scripts to initialize the system:

1.  **Create System Root Node:**
    Required for the first user to purchase a node.
    ```bash
    cd backend
    npx tsx src/scripts/ensure_root_node.ts
    ```

2.  **Create Default Admin:**
    Creates the admin user based on `plan_config.json` settings.
    ```bash
    cd backend
    npx tsx src/scripts/ensure_default_admin.ts
    ```

### Changing Admin Credentials
If you need to change the default admin credentials:

1.  **Update Config:** Modify `mobile` or `password` in `backend/src/config/plan_config.json`.
2.  **Restart Backend:** Stop and restart the backend server (`npm run dev`) to load the new config.
3.  **Update Database:**
    *   *Note:* The `ensure_default_admin.ts` script only creates an admin if **no admin exists**.
    *   **Option A (Fresh Start):** If you are in development, you can delete the existing admin from the `Users` table in the database, then run `npx tsx src/scripts/ensure_default_admin.ts`.
    *   **Option B (Manual):** Manually update the `mobile` and `password_hash` in the database for the existing admin user.

### Changing the Secret Route
1.  **Update Config:** Change `secret_route` in `plan_config.json` (e.g., to `/super-admin`).
2.  **Restart Backend:** Restart `npm run dev`.
3.  **Access:** The new route will be immediately active on the frontend (e.g., `http://localhost:5173/super-admin`).

---

## 3. Running the Application

### Backend Server
Runs on Port 3000.
```bash
cd backend
npm run dev
```

### Frontend Application
Runs on Port 5173 (default).
```bash
cd frontend
npm run dev
```

---

## 4. Troubleshooting

### "403 Forbidden" Errors
*   **Cause:** Usually indicates an invalid or expired JWT token, or a mismatch between the secret key used to sign the token and the one used to verify it.
*   **Solution:**
    1.  Ensure `.env` file exists in `backend/` and contains `JWT_SECRET`.
    2.  Restart the backend server to ensure `.env` is loaded.
    3.  Logout and Login again on the frontend to generate a new token.

### "Invalid Sponsor Code"
*   **Cause:** The system cannot find the node associated with the entered sponsor code.
*   **Solution:**
    *   For the **very first user**, use the System Root Code: `JSE-ROOT`.
    *   Ensure the sponsor code is typed exactly as it appears (case-sensitive).

---

## 5. Docker Deployment (Recommended)

The entire system (Frontend, Backend, Database, Redis) is containerized for easy deployment.

### Prerequisites
*   Docker Desktop (Windows/Mac) or Docker Engine (Linux)
*   Docker Compose

### Running the System
1.  **Build and Start:**
    ```bash
    docker-compose up --build -d
    ```
    *   `-d` runs it in the background (detached mode).

2.  **Access:**
    *   **Frontend:** `http://localhost` (Port 80)
    *   **Backend API:** `http://localhost:3000`
    *   **Database:** Port 5432
    *   **Redis:** Port 6379

3.  **Stop:**
    ```bash
    docker-compose down
    ```

### First Time Docker Setup
When running with Docker for the first time, the database volume (`pgdata`) will be empty. You need to run the seed scripts *inside* the backend container.

1.  **Enter Backend Container:**
    ```bash
    docker exec -it mlm_backend sh
    ```

2.  **Run Seed Scripts:**
    ```bash
    # Create Root Node
    node dist/scripts/ensure_root_node.js

    # Create Default Admin
    node dist/scripts/ensure_default_admin.js
    ```

3.  **Exit:**
    ```bash
    exit
    ```

---

## 6. Development Workflow (Hybrid)

For active development (coding), it is best to run the **Database & Redis** in Docker, but run the **Backend & Frontend** locally on your machine. This gives you "Hot Reloading" (instant updates) and better performance.

### Step 1: Start Infrastructure
Start only the database and redis containers:
```bash
docker-compose up -d postgres redis
```

### Step 2: Start Backend (Local)
Open a terminal in `backend/`:
```bash
npm run dev
```

### Step 3: Start Frontend (Local)
Open a terminal in `frontend/`:
```bash
npm run dev
```

### Step 4: Code!
*   Edit files in VS Code.
*   The browser will auto-update.
*   The backend will auto-restart.

### Step 5: Stop
When finished:
```bash
# Stop local terminals (Ctrl+C)
# Stop Docker containers
docker-compose down
```

---

## 7. Pure Docker Development (Alternative)

If you prefer to run **everything** in Docker while developing (no local Node.js required):

1.  **Start in Dev Mode:**
    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    ```
    *   This mounts your local folders into the containers.
    *   Changes you make in VS Code will trigger hot-reloading inside the container.

2.  **Access:**
    *   Frontend: `http://localhost:5173` (Note: Port changes to Vite default)
    *   Backend: `http://localhost:3000`

3.  **Note:** This might be slower on Windows due to file system sharing. If it feels laggy, switch to the **Hybrid Workflow** (Section 6).
