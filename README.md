# 🌿 Farm to Plate — Blockchain Agriculture Supply Chain

> Farm to Plate is a full-stack agricultural traceability platform that connects farmers, purchasers, admins, and consumers through batch provenance, organic verification, QR-based trace viewers, and AI/ML insights.

![Tech Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20FastAPI-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🏗 Architecture

Farm to Plate is organized into four main layers:

- `frontend/` — React + Vite + Tailwind CSS user interface
- `backend/` — Node.js + Express REST API, JWT authentication, MongoDB persistence
- `ml_service/` — Python + FastAPI ML microservice for organic and fraud prediction
- `smart_contracts/` — Solidity + Hardhat contracts for optional blockchain deployment
- `backend/blockchain/` — simulated blockchain persisted in MongoDB

### System Flow

1. Farmer registers and submits crop batch details.
2. Backend calculates organic score and stores the batch.
3. Admin verifies the batch and publishes it to the blockchain.
4. Verified batch receives a QR code and public trace URL.
5. Purchasers buy batches, consumers scan QR codes, and all parties can trace provenance.

---

## 👥 User Roles

| Role       | Login Required | Key Capabilities |
|------------|---------------|------------------|
| Farmer     | ✅            | Create crop batches, upload proofs, view trust score, track submissions |
| Purchaser  | ✅            | Browse verified batches, purchase, send feedback |
| Admin      | ✅            | Verify/reject batches, manage users, inspect blockchain, handle complaints |
| Consumer   | ❌            | Scan QR codes, view supply chain trace, inspect batch details |

### Demo Credentials

| Role      | Email               | Password  |
|-----------|---------------------|-----------|
| Farmer    | farmer@demo.com     | demo1234  |
| Purchaser | purchaser@demo.com  | demo1234  |
| Admin     | admin@demo.com      | demo1234  |

---

## 🧩 Core Features

- Crop batch creation, verification, and purchase workflows
- Organic score and batch classification
- Trust score for farmers based on complaint history and verified batches
- Blockchain-based immutable provenance storage
- QR code traceability and public batch tracking
- Realtime updates using Socket.IO
- Cloudinary file uploads for proof documents and images
- ML-backed organic/fraud prediction service
- Role-based access control and secure authentication

---

## 📦 Tech Stack

| Layer            | Technologies |
|------------------|--------------|
| Frontend         | React 18, Vite, Tailwind CSS, React Router, Recharts, React Leaflet, qrcode.react, react-qr-scanner |
| Backend          | Node.js, Express, Mongoose, JWT, bcryptjs, Socket.IO, Cloudinary, Helmet.js, express-rate-limit |
| Database         | MongoDB (Mongoose) |
| Storage          | Cloudinary |
| Blockchain       | Simulated Node.js blockchain with SHA-256 proof-of-work |
| Smart Contracts  | Solidity 0.8.x, Hardhat |
| ML Service       | Python, FastAPI, scikit-learn, numpy, pandas |
| DevOps           | Docker, Docker Compose |

---

## 🔍 Backend Implementation

### Package highlights

- `express` — REST API server
- `mongoose` — MongoDB ODM
- `jsonwebtoken` — JWT-based auth
- `bcryptjs` — password hashing
- `express-validator` — request validation
- `express-rate-limit` — API throttling
- `helmet` — HTTP security headers
- `multer` + `multer-storage-cloudinary` — file upload handling
- `socket.io` — realtime notifications
- `cloudinary` — media storage

### Data models

- `User` — role, credentials, trust score, contact information
- `CropBatch` — batch details, organic score, status, blockchain hash
- `BlockRecord` — blockchain blocks saved in MongoDB
- `Feedback` — purchaser complaints and farmer feedback
- `Purchase` — purchase records and provenance links

---

## 🧠 Algorithms and Business Logic

### Organic score calculation

The backend computes a deterministic organic score in `backend/services/organic.service.js` using:

- Fertilizer type: Organic = 40, Mixed = 20, Inorganic = 0
- Soil quality: Excellent = 30, Good = 22, Average = 12, Poor = 4
- Seasonal suitability: Match = 20, Mismatch = 10
- Irrigation method: Drip/Rainfed = 10, Sprinkler = 8, Canal/Tank = 5, Borewell = 3, default = 2

The score is capped at 100 and is used for display, verification, and classification.

### Trust score calculation

Implemented in `backend/services/trust.service.js`:

- Base trust score: 5.0
- Complaint penalty: −0.25 per unresolved complaint, capped at −3.0
- Verified batch bonus: +0.1 per verified batch, capped at +1.0
- Final score clamped to [0, 5]

### Fraud / verification support

- The ML service provides an additional organic probability and fraud risk estimate.
- Backend calls the ML endpoint when available via `backend/services/mlClient.service.js`.
- There is a rule-based fallback in `ml_service/utils/model_loader.py` when model files are missing.

---

## ⛓ Blockchain Design

### Simulated blockchain

The default blockchain implementation in `backend/blockchain/Blockchain.js` is:

- Block fields: `index`, `timestamp`, `data`, `previousHash`, `hash`, `nonce`, `type`
- Hash algorithm: SHA-256
- Mining difficulty: 2 (small proof-of-work for demo speed)
- Persistence: `BlockRecord` documents in MongoDB
- Validation: verifies previous hash links and recomputes hashes

A new block is created when an admin verifies a batch, making the verification event tamper-evident.

### Optional smart contract layer

The `smart_contracts/` folder contains:

- `contracts/` — Solidity contracts like `CropBatch.sol`, `PurchaseRecord.sol`, `VerificationLog.sol`
- `scripts/` — deployment scripts
- `test/` — contract test suite
- `hardhat.config.js`

This layer supports an Ethereum-compatible deployment path using Hardhat.

---

## 🧪 ML Service

### Purpose

The ML microservice predicts:

- `organic_probability` — likelihood that a batch is honestly organic
- `fraud_risk` — likelihood of suspicious or fraudulent claims

### Implementation

- Service: `ml_service/main.py`
- Routes:
  - `POST /predict/organic`
  - `POST /predict/fraud`
- Model loader: `ml_service/utils/model_loader.py`
- Preprocessing: `ml_service/utils/preprocess.py`
- Training script: `ml_service/training/train_model.py`

### Model details

- Algorithm: Random Forest classification
- Features: fertilizer type, soil quality, irrigation type, season, crop name, area, fertilizer quantity
- Training data: synthetic dataset generated from domain rules and noise
- Output: probability scores in `[0.0, 1.0]`

### Fallback logic

If trained `.pkl` models are missing, the service falls back to deterministic rule-based scoring that mirrors the backend organic score logic.

---

## 🧩 Frontend Implementation

### Core libraries

- React + Vite for fast UI rendering
- Tailwind CSS for styles
- React Router DOM for navigation
- Axios for API requests
- React Leaflet + Leaflet for maps and farm location visualization
- qrcode.react for QR code generation
- react-qr-scanner for scanning batch QR codes
- Recharts for analytics and charts
- react-hot-toast for notifications
- socket.io-client for realtime event updates

### Key user flows

- Farmer: batch form, proof upload, preview organic score, QR generation
- Purchaser: browse verified batches, create purchase records, send feedback
- Admin: review pending batches, verify or reject, inspect blockchain explorer
- Consumer: public batch trace view via QR scan or direct URL

---

## 🚀 Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# configure MONGO_URI, JWT_SECRET, CLOUDINARY_* values
npm run dev
```

### ML Service

```bash
cd ml_service
pip install -r requirements.txt
python training/train_model.py
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker Compose

```bash
docker-compose up --build
```

---

## 📄 Documentation

- `docs/API.md` — REST API specification
- `docs/DB_SCHEMA.md` — MongoDB schema definitions
- `docs/DEPLOYMENT.md` — deployment instructions
- `docs/UML_diagrams/` — architecture and sequence diagrams

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: ..."`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

---

## 📄 License

MIT License
