# 🌿 Farm to Plate — Blockchain Agriculture Supply Chain

> A production-ready full-stack platform ensuring crop traceability, organic verification, and supply chain transparency using **Blockchain**, **QR codes**, and **AI/ML**.

![Tech Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20FastAPI-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🏗 Architecture

```
farm-to-plate/
├── frontend/          React + Vite + Tailwind CSS
├── backend/           Node.js + Express + MongoDB
├── ml_service/        Python + FastAPI + Scikit-learn
├── smart_contracts/   Solidity + Hardhat (optional Ethereum)
├── blockchain/        Simulated Node.js blockchain (default)
└── docs/              API docs, DB schema, UML, deployment guide
```

---

## 👥 User Roles

| Role       | Login Required | Key Features                                              |
|------------|---------------|-----------------------------------------------------------|
| 👨‍🌾 Farmer   | ✅            | Add batches, upload proofs, view QR, track trust score    |
| 🛒 Purchaser| ✅            | Browse verified batches, purchase, submit feedback        |
| 🛠 Admin    | ✅            | Verify batches, manage users, view blockchain, complaints |
| 👤 Consumer | ❌            | Scan QR, view full supply chain trace, farm map           |

### Demo Credentials
| Role      | Email                | Password  |
|-----------|---------------------|-----------|
| Farmer    | farmer@demo.com     | demo1234  |
| Purchaser | purchaser@demo.com  | demo1234  |
| Admin     | admin@demo.com      | demo1234  |

> Run `cd backend && node utils/seed.js` to create demo accounts.

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js ≥ 20
- Python ≥ 3.11
- MongoDB (local or Atlas)
- Cloudinary account

### 1. Clone
```bash
git clone https://github.com/yourname/farm-to-plate.git
cd farm-to-plate
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and Cloudinary credentials
npm install
node utils/seed.js   # optional demo data
npm run dev          # http://localhost:5000
```

### 3. ML Service
```bash
cd ml_service
pip install -r requirements.txt
python training/train_model.py   # trains & saves .pkl files
uvicorn main:app --reload        # http://localhost:8000
```

### 4. Frontend
```bash
cd frontend
echo "VITE_API_URL=http://localhost:5000" > .env
npm install
npm run dev   # http://localhost:3000
```

### 5. Smart Contracts (optional)
```bash
cd smart_contracts
npm install
npx hardhat node               # local blockchain
npx hardhat run scripts/deploy.js --network localhost
npx hardhat test               # run test suite
```

### Or — Docker Compose (all-in-one)
```bash
cp backend/.env.example backend/.env  # fill in values
docker-compose up --build
```

---

## 🔗 Key Pages

| URL                       | Description                         |
|---------------------------|-------------------------------------|
| `/`                       | Public landing page                 |
| `/login`                  | Multi-role login                    |
| `/register`               | Farmer / Purchaser registration     |
| `/farmer`                 | Farmer dashboard                    |
| `/farmer/batches/add`     | Multi-step crop batch creation      |
| `/purchaser`              | Purchaser dashboard                 |
| `/purchaser/browse`       | Browse verified batches             |
| `/admin`                  | Admin analytics dashboard           |
| `/admin/verify`           | Verify/reject batch queue           |
| `/admin/blockchain`       | Full blockchain explorer            |
| `/scan`                   | QR scanner (no login needed)        |
| `/trace/:batchId`         | Public product traceability page    |

---

## 🔐 Security Features

- **JWT authentication** with 7-day expiry
- **bcrypt** password hashing (12 rounds)
- **Role-based access control** on every route
- **Rate limiting** — 20 req/15min on auth, 200 req/min on API
- **Helmet.js** security headers
- **Cloudinary** signed uploads (server-side)
- **Blockchain immutability** — verified batches cannot be altered

---

## 🧠 Organic Score Algorithm

```
Score = Fertilizer (0–40) + Soil Quality (0–30) + Seasonal Match (0–20) + Irrigation (0–10)

≥ 70% → 🟢 High Organic
40–69% → 🟡 Moderate
< 40%  → 🔴 Low Organic
```

ML service (Random Forest) provides a second probability estimate when available.

---

## ⛓ Blockchain Implementation

Default: **Simulated Node.js blockchain** stored in MongoDB.

Each block contains:
- `index`, `timestamp`, `data`, `previousHash`, `hash` (SHA-256), `nonce`
- Proof-of-work with difficulty=2 (fast, suitable for demo)

Optional: Switch to **Ethereum (Sepolia)** using the Hardhat contracts in `smart_contracts/`.

---

## 📦 Tech Stack

| Layer        | Technology                               |
|-------------|------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS, Recharts, React Leaflet, QRCode |
| Backend      | Node.js, Express.js, Socket.IO           |
| Database     | MongoDB Atlas (Mongoose)                 |
| Storage      | Cloudinary                               |
| Blockchain   | Simulated (Node.js SHA-256)              |
| Smart Contracts | Solidity 0.8.20, Hardhat             |
| ML Service   | Python, FastAPI, Scikit-learn (Random Forest) |
| Auth         | JWT, bcryptjs                            |
| DevOps       | Docker, Docker Compose                   |
| Deploy       | Vercel (frontend), Render (backend + ML) |

---

## 📚 Documentation

| File                           | Contents                        |
|--------------------------------|---------------------------------|
| `docs/API.md`                  | Full REST API reference         |
| `docs/DB_SCHEMA.md`            | MongoDB collection schemas      |
| `docs/DEPLOYMENT.md`           | Vercel + Render deployment guide|
| `docs/UML_diagrams/`           | Mermaid UML & architecture diagrams |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © Farm to Plate Project
