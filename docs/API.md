# Farm to Plate — API Reference

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth

| Method | Endpoint         | Auth | Body                                      | Description          |
|--------|-----------------|------|-------------------------------------------|----------------------|
| POST   | /auth/register  | ❌   | name, email, password, role, phone        | Create account       |
| POST   | /auth/login     | ❌   | email, password                           | Login, get JWT       |
| GET    | /auth/me        | ✅   | —                                         | Get current user     |

### POST /auth/register
```json
{
  "name":     "Ravi Kumar",
  "email":    "ravi@example.com",
  "password": "mypassword",
  "role":     "farmer",
  "phone":    "+91 98765 43210"
}
```
**Response 201:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "_id": "...", "name": "Ravi Kumar", "role": "farmer", ... }
}
```

---

## Batches

| Method | Endpoint                   | Role              | Description                    |
|--------|---------------------------|-------------------|-------------------------------|
| POST   | /batches                  | farmer            | Create batch (multipart/form) |
| GET    | /batches/my               | farmer            | My batches                    |
| GET    | /batches/verified         | purchaser, admin  | All verified batches          |
| GET    | /batches/trace/:batchId   | public            | Consumer trace page           |
| GET    | /batches/:id              | farmer, admin     | Get single batch              |
| DELETE | /batches/:id              | farmer            | Delete pending batch          |
| POST   | /batches/:id/verify       | admin             | Verify & add to blockchain    |
| POST   | /batches/:id/reject       | admin             | Reject batch                  |
| POST   | /batches/:id/purchase     | purchaser         | Purchase batch                |
| POST   | /batches/:id/feedback     | purchaser         | Submit complaint/feedback     |
| GET    | /batches                  | admin             | All batches (paginated)       |

### POST /batches (multipart/form-data)
Fields: `farmerName`, `farmLocation`, `latitude`, `longitude`, `soilType`, `soilQuality`,
`cropName`, `variety`, `season`, `harvestDate`, `areaHectares`, `fertilizerType`,
`fertilizerName`, `fertilizerQty`, `irrigationType`, `notes`

Files: `cropImages[]`, `fertilizerBill[]`, `soilReport[]`, `farmPhotos[]`

**Response 201:**
```json
{
  "success": true,
  "batch": {
    "_id": "...",
    "batchId": "WHT-20240301-A1B2C",
    "status": "pending",
    "organicScore": 82,
    "proofImages": ["https://res.cloudinary.com/..."],
    ...
  }
}
```

### POST /batches/:id/verify (admin)
```json
{ "note": "All documents verified" }
```
**Response:** Batch object with `blockchainHash`, `blockIndex`, `status: "verified"`

### POST /batches/:id/purchase (purchaser)
```json
{
  "purchaserName":     "Agro Traders Ltd",
  "purchaseDate":      "2024-04-01",
  "quantityPurchased": 500,
  "marketDestination": "Mumbai APMC",
  "storageConditions": "Refrigerated",
  "transportMode":     "Truck"
}
```

### POST /batches/:id/feedback (purchaser)
```json
{
  "type":        "organic_inaccurate",
  "description": "Fertilizer residue detected in lab test",
  "rating":      2
}
```

---

## Purchases

| Method | Endpoint        | Role      | Description           |
|--------|-----------------|-----------|-----------------------|
| GET    | /purchases/my   | purchaser | My purchase history   |
| GET    | /purchasers/stats | purchaser | Dashboard stats      |

---

## Complaints

| Method | Endpoint               | Role  | Description        |
|--------|------------------------|-------|--------------------|
| GET    | /complaints            | admin | All complaints     |
| POST   | /complaints/:id/resolve| admin | Mark as resolved   |

---

## Blockchain

| Method | Endpoint              | Role  | Description                   |
|--------|-----------------------|-------|-------------------------------|
| GET    | /blockchain/chain     | admin | Full blockchain array         |
| GET    | /blockchain/validate  | admin | `{ valid: true/false }`       |
| GET    | /blockchain/stats     | admin | chainLength, transactions     |
| GET    | /blockchain/logs      | admin | Summarised log entries        |

---

## Admin

| Method | Endpoint                    | Role  | Description           |
|--------|-----------------------------|-------|-----------------------|
| GET    | /admin/stats                | admin | Full dashboard stats  |
| GET    | /admin/users?role=farmer    | admin | List users by role    |
| PUT    | /admin/users/:id/suspend    | admin | `{ suspended: bool }` |
| PUT    | /admin/users/:id/trust      | admin | `{ delta: 0.5 }`      |

---

## Farmer

| Method | Endpoint       | Role   | Description              |
|--------|----------------|--------|--------------------------|
| GET    | /farmers/stats | farmer | Farmer dashboard metrics |

---

## ML Service (port 8000)

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| POST   | /predict/organic  | Returns organic_probability     |
| POST   | /predict/fraud    | Returns fraud_risk              |
| GET    | /health           | Service health                  |
| GET    | /model/info       | Feature columns, model version  |

### POST /predict/organic
```json
{
  "fertilizerType": "Organic",
  "soilQuality":    "Good",
  "season":         "Rabi",
  "irrigationType": "Canal",
  "cropName":       "Wheat",
  "areaHectares":   3.5,
  "fertilizerQty":  120
}
```
**Response:**
```json
{
  "organic_probability": 0.82,
  "organic_percent": 82,
  "label": "High Organic",
  "model_used": "random_forest"
}
```

---

## Error Responses
All errors follow:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

| Status | Meaning                  |
|--------|--------------------------|
| 400    | Bad request / validation |
| 401    | Unauthenticated          |
| 403    | Forbidden (role check)   |
| 404    | Resource not found       |
| 429    | Rate limit exceeded      |
| 500    | Internal server error    |
