# Farm to Plate — Deployment Guide

## Architecture Overview

```
Vercel  (Frontend — React)
   │
Render  (Backend — Node/Express)  ←→  MongoDB Atlas
   │
Render  (ML Service — FastAPI)
```

---

## 1. MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster.
2. Create a database user with read/write access.
3. Whitelist all IPs (`0.0.0.0/0`) for Render deployment.
4. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.mongodb.net/farm-to-plate?retryWrites=true&w=majority
   ```

---

## 2. Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is sufficient).
2. Copy from the dashboard:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## 3. Deploy Backend to Render

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo and select the `backend/` folder.
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Add Environment Variables:
   ```
   PORT                   = 5000
   MONGO_URI              = <Atlas connection string>
   JWT_SECRET             = <strong random string>
   JWT_EXPIRES_IN         = 7d
   CLOUDINARY_CLOUD_NAME  = <your value>
   CLOUDINARY_API_KEY     = <your value>
   CLOUDINARY_API_SECRET  = <your value>
   CLIENT_URL             = https://your-vercel-app.vercel.app
   ML_SERVICE_URL         = https://your-ml-render-url.onrender.com
   NODE_ENV               = production
   ```
6. Click **Create Web Service**. Note the URL: `https://farm-to-plate-api.onrender.com`

### Seed demo data (optional)
In the Render Shell tab:
```bash
node utils/seed.js
```

---

## 4. Deploy ML Service to Render

1. **New Web Service** → select `ml_service/` directory.
2. Settings:
   - **Build Command:** `pip install -r requirements.txt && python training/train_model.py`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
   - **Environment:** Python 3.11
3. No extra env vars needed for basic usage.
4. Note the URL: `https://farm-to-plate-ml.onrender.com`

---

## 5. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repo, set **Root Directory** to `frontend/`.
3. Framework Preset: **Vite**
4. Add Environment Variables:
   ```
   VITE_API_URL = https://farm-to-plate-api.onrender.com
   ```
5. Click **Deploy**. Your app will be at `https://farm-to-plate.vercel.app`.

---

## 6. Deploy Smart Contracts (Optional)

### Local Hardhat node
```bash
cd smart_contracts
npm install
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia testnet
```bash
# Set in smart_contracts/.env:
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<your-key>
PRIVATE_KEY=<your-wallet-private-key>
ETHERSCAN_API_KEY=<your-key>

npx hardhat run scripts/deploy.js --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## 7. Post-Deployment Checklist

- [ ] Health check: `GET https://your-api.onrender.com/api/health`
- [ ] ML health:   `GET https://your-ml.onrender.com/health`
- [ ] Login with `admin@demo.com / demo1234`
- [ ] Create a test farmer batch
- [ ] Verify it as admin
- [ ] Scan the QR from `/scan`
- [ ] Test feedback submission

---

## 8. Local Development (Docker Compose)

```bash
# Clone repo
git clone https://github.com/yourname/farm-to-plate.git
cd farm-to-plate

# Set env vars
cp backend/.env.example backend/.env
# Edit backend/.env with your Cloudinary + MongoDB credentials

# Start all services
docker-compose up --build

# Services:
# Frontend  → http://localhost:3000
# Backend   → http://localhost:5000
# ML        → http://localhost:8000
```

### Without Docker
```bash
# Terminal 1 — MongoDB (or use Atlas)
mongod

# Terminal 2 — Backend
cd backend && npm install && npm run dev

# Terminal 3 — ML Service
cd ml_service
pip install -r requirements.txt
python training/train_model.py   # train models once
uvicorn main:app --reload

# Terminal 4 — Frontend
cd frontend && npm install && npm run dev
```

---

## Environment Variables Summary

### backend/.env
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLIENT_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### frontend/.env
```env
VITE_API_URL=http://localhost:5000
```

### smart_contracts/.env
```env
SEPOLIA_RPC_URL=
PRIVATE_KEY=
ETHERSCAN_API_KEY=
```
