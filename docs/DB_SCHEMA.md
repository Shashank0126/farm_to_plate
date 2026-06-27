# Farm to Plate — Database Schema

Database: `farm-to-plate` (MongoDB Atlas)

---

## Collections

### users
| Field           | Type    | Required | Notes                              |
|-----------------|---------|----------|------------------------------------|
| _id             | ObjectId| ✅       | Auto                               |
| name            | String  | ✅       | Trimmed                            |
| email           | String  | ✅       | Unique, lowercase                  |
| password        | String  | ✅       | bcrypt hashed, select:false        |
| phone           | String  | ❌       |                                    |
| role            | Enum    | ✅       | farmer \| purchaser \| admin       |
| trustScore      | Number  | —        | 0–5, farmers only, default 5.0     |
| reviewCount     | Number  | —        | Farmers                            |
| totalBatches    | Number  | —        | Farmers                            |
| verifiedBatches | Number  | —        | Farmers                            |
| purchaseCount   | Number  | —        | Purchasers                         |
| suspended       | Boolean | —        | Default false                      |
| avatar          | String  | ❌       | Cloudinary URL                     |
| createdAt       | Date    | —        | Auto (timestamps)                  |
| updatedAt       | Date    | —        | Auto (timestamps)                  |

**Indexes:** `email` (unique)

---

### cropbatches
| Field           | Type     | Required | Notes                                    |
|-----------------|----------|----------|------------------------------------------|
| _id             | ObjectId | ✅       | Auto                                     |
| batchId         | String   | ✅       | Unique, format: CRP-YYYYMMDD-XXXXX       |
| farmer          | Ref:User | ✅       |                                          |
| farmerName      | String   | ✅       |                                          |
| farmLocation    | String   | ❌       |                                          |
| latitude        | Number   | ❌       |                                          |
| longitude       | Number   | ❌       |                                          |
| soilType        | String   | ❌       |                                          |
| soilQuality     | Enum     | ❌       | Excellent\|Good\|Average\|Poor           |
| cropName        | String   | ✅       |                                          |
| variety         | String   | ❌       |                                          |
| season          | Enum     | ❌       | Kharif\|Rabi\|Zaid\|Annual              |
| harvestDate     | Date     | ✅       |                                          |
| areaHectares    | Number   | ❌       |                                          |
| fertilizerType  | Enum     | ❌       | Organic\|Inorganic\|Mixed                |
| fertilizerName  | String   | ❌       |                                          |
| fertilizerQty   | Number   | ❌       | kg                                       |
| irrigationType  | String   | ❌       |                                          |
| proofImages     | [String] | —        | Cloudinary URLs                          |
| organicScore    | Number   | —        | 0–100, calculated server-side            |
| mlPrediction    | Number   | ❌       | FastAPI prediction, nullable             |
| status          | Enum     | —        | pending\|verified\|rejected, default pending |
| adminNote       | String   | ❌       |                                          |
| verifiedAt      | Date     | ❌       |                                          |
| verifiedBy      | Ref:User | ❌       |                                          |
| blockchainHash  | String   | ❌       | SHA-256 block hash                       |
| blockIndex      | Number   | ❌       |                                          |
| previousHash    | String   | ❌       |                                          |
| flagged         | Boolean  | —        | Auto-flagged on 3+ complaints            |
| notes           | String   | ❌       |                                          |
| createdAt       | Date     | —        | Auto                                     |

**Indexes:** `(farmer,status)`, `(status,createdAt)`, `batchId`, text: `(cropName,farmerName,farmLocation)`

---

### purchases
| Field              | Type      | Required | Notes                        |
|--------------------|-----------|----------|------------------------------|
| _id                | ObjectId  | ✅       |                              |
| batch              | Ref:CropBatch | ✅  |                              |
| purchaser          | Ref:User  | ✅       |                              |
| purchaserName      | String    | ✅       |                              |
| purchaseDate       | Date      | ✅       |                              |
| quantityPurchased  | Number    | ✅       | kg                           |
| marketDestination  | String    | ✅       |                              |
| storageConditions  | String    | ❌       |                              |
| transportMode      | String    | ❌       |                              |
| notes              | String    | ❌       |                              |
| blockchainHash     | String    | ❌       |                              |
| blockIndex         | Number    | ❌       |                              |
| feedbackSubmitted  | Boolean   | —        | Default false                |
| createdAt          | Date      | —        |                              |

---

### feedbacks
| Field        | Type          | Required | Notes                                         |
|--------------|---------------|----------|-----------------------------------------------|
| _id          | ObjectId      | ✅       |                                               |
| batch        | Ref:CropBatch | ✅       |                                               |
| purchaser    | Ref:User      | ✅       |                                               |
| farmer       | Ref:User      | ✅       |                                               |
| purchase     | Ref:Purchase  | ❌       |                                               |
| type         | Enum          | ✅       | quality_mismatch\|organic_inaccurate\|damaged_produce\|fake_info\|other |
| description  | String        | ❌       |                                               |
| rating       | Number        | ✅       | 1–5                                           |
| resolved     | Boolean       | —        | Default false                                 |
| resolvedAt   | Date          | ❌       |                                               |
| resolvedBy   | Ref:User      | ❌       |                                               |
| purchaserName| String        | ❌       | Denormalised for display                      |
| createdAt    | Date          | —        |                                               |

---

### blockrecords
| Field        | Type    | Required | Notes                               |
|--------------|---------|----------|-------------------------------------|
| index        | Number  | ✅       | Unique, sequential                  |
| timestamp    | Date    | ✅       |                                     |
| data         | Mixed   | ✅       | Batch/purchase payload              |
| previousHash | String  | ✅       |                                     |
| hash         | String  | ✅       | Unique, SHA-256                     |
| nonce        | Number  | —        | Proof-of-work nonce                 |
| transactions | Number  | —        | Default 1                           |
| type         | Enum    | —        | genesis\|batch\|purchase\|verification |

---

## Relationships

```
User (farmer) ──< CropBatch ──< Purchase <── User (purchaser)
                     │
                     └──< Feedback <── User (purchaser)
                     │
                     └── BlockRecord (hash link)
```
