# Farm to Plate — UML & Architecture Diagrams

All diagrams use Mermaid syntax. Render at https://mermaid.live

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        FE["React Frontend\n(Vite + Tailwind)\nVercel"]
    end

    subgraph API["API Layer"]
        BE["Express Backend\n(Node.js)\nRender"]
        ML["FastAPI ML\n(Python)\nRender"]
    end

    subgraph Data["Data Layer"]
        DB[(MongoDB Atlas)]
        CL[Cloudinary\nFile Storage]
        BC[Simulated\nBlockchain\nMongoDB]
    end

    subgraph Contracts["Optional — Ethereum"]
        SC[Hardhat\nSolidity\nSepolia]
    end

    FE -->|REST + Socket.IO| BE
    BE -->|HTTP| ML
    BE --> DB
    BE --> CL
    BE --> BC
    BE -.->|optional| SC

    style Client fill:#052e16,color:#86efac
    style API fill:#0c2d5e,color:#93c5fd
    style Data fill:#3b1a00,color:#fdba74
    style Contracts fill:#2d0a4e,color:#d8b4fe
```

---

## 2. User Role Flow

```mermaid
flowchart LR
    F([👨‍🌾 Farmer]) -->|Register / Login| Auth
    P([🛒 Purchaser]) -->|Register / Login| Auth
    A([🛠 Admin]) -->|Login| Auth
    C([👤 Consumer]) -->|No login| QR

    Auth --> JWT[JWT Token]

    JWT --> FarmerActions["Add Batch\nUpload Proofs\nView QR\nCheck Trust Score"]
    JWT --> PurchaserActions["Browse Batches\nPurchase\nSubmit Feedback"]
    JWT --> AdminActions["Verify Batches\nManage Users\nView Blockchain\nHandle Complaints"]
    QR --> TraceView["Scan QR\nView Full Trace\nFarm Map\nOrganic Score"]
```

---

## 3. Crop Batch Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending : Farmer submits batch
    Pending --> Verified : Admin verifies + adds to blockchain
    Pending --> Rejected : Admin rejects with reason
    Verified --> Purchased : Purchaser buys batch
    Purchased --> Feedback : Purchaser submits feedback
    Feedback --> FlaggedForReview : 3+ complaints
    Verified --> [*] : Consumer scans QR
```

---

## 4. Blockchain Block Structure

```mermaid
classDiagram
    class Block {
        +int index
        +string timestamp
        +object data
        +string previousHash
        +string hash
        +int nonce
        +string type
        +calculateHash() string
        +mineBlock(difficulty) Block
    }

    class Blockchain {
        +Block[] chain
        +int difficulty
        +addBlock(data, type) Block
        +isValid() bool
        +getChain() Block[]
        +getStats() object
    }

    class BlockRecord {
        +int index
        +Date timestamp
        +Mixed data
        +string previousHash
        +string hash
        +int nonce
        +string type
    }

    Blockchain "1" --> "*" Block : contains
    Block --> BlockRecord : persisted as
```

---

## 5. Organic Score Algorithm

```mermaid
flowchart TD
    Start([Batch Fields]) --> F{Fertilizer Type}
    F -->|Organic| A1["+40 pts"]
    F -->|Mixed| A2["+20 pts"]
    F -->|Inorganic| A3["+0 pts"]

    A1 & A2 & A3 --> S{Soil Quality}
    S -->|Excellent| B1["+30 pts"]
    S -->|Good| B2["+22 pts"]
    S -->|Average| B3["+12 pts"]
    S -->|Poor| B4["+4 pts"]

    B1 & B2 & B3 & B4 --> M{Season Match?}
    M -->|Yes| C1["+20 pts"]
    M -->|No| C2["+10 pts"]

    C1 & C2 --> I{Irrigation}
    I -->|Drip / Rainfed| D1["+10 pts"]
    I -->|Sprinkler| D2["+8 pts"]
    I -->|Canal / Tank| D3["+5 pts"]
    I -->|Borewell| D4["+3 pts"]

    D1 & D2 & D3 & D4 --> Total[Sum = Organic Score / 100]
    Total --> Label{Score}
    Label -->|≥70| Green["🟢 High Organic"]
    Label -->|40-69| Yellow["🟡 Moderate"]
    Label -->|<40| Red["🔴 Low Organic"]
```

---

## 6. Trust Score System

```mermaid
flowchart TD
    Base["Base Score = 5.0"] --> Penalty
    Complaint["Unresolved Complaints\n× 0.25 pts each\n(max −3)"] --> Penalty[Penalty]
    Verified["Verified Batches\n× 0.1 pts each\n(max +1)"] --> Bonus[Bonus]
    Penalty --> Formula["Trust = max(0, Base − Penalty + Bonus)"]
    Bonus --> Formula
    Formula --> Score["Trust Score 0.0–5.0"]
    Score --> Display["⭐ Displayed on\nconsumer trace page"]
```

---

## 7. Sequence Diagram — Batch Creation to Consumer Scan

```mermaid
sequenceDiagram
    actor Farmer
    actor Admin
    actor Consumer
    participant Frontend
    participant Backend
    participant Blockchain
    participant Cloudinary
    participant ML

    Farmer->>Frontend: Fill crop batch form + upload proofs
    Frontend->>Backend: POST /api/batches (multipart)
    Backend->>Cloudinary: Upload proof images
    Cloudinary-->>Backend: Secure URLs
    Backend->>ML: POST /predict/organic (features)
    ML-->>Backend: organic_probability
    Backend->>Backend: calcOrganicScore (rule-based fallback)
    Backend-->>Frontend: { batch, status:"pending" }

    Admin->>Frontend: Open verify queue
    Frontend->>Backend: GET /api/batches?status=pending
    Admin->>Frontend: Click "Verify"
    Frontend->>Backend: POST /api/batches/:id/verify
    Backend->>Blockchain: addBlock(batchData)
    Blockchain-->>Backend: { hash, index }
    Backend->>Backend: Update batch with blockchainHash
    Backend-->>Frontend: Verified batch + QR URL

    Consumer->>Frontend: Scan QR code at /trace/BATCH-ID
    Frontend->>Backend: GET /api/batches/trace/BATCH-ID
    Backend-->>Frontend: { batch, purchases, farmer }
    Frontend->>Consumer: Show full supply chain timeline + map + scores
```

---

## 8. ER Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id
        string name
        string email
        string role
        float trustScore
        int verifiedBatches
    }
    CROPBATCH {
        ObjectId _id
        string batchId
        string cropName
        string status
        int organicScore
        string blockchainHash
    }
    PURCHASE {
        ObjectId _id
        int quantityPurchased
        string marketDestination
        string blockchainHash
    }
    FEEDBACK {
        ObjectId _id
        string type
        int rating
        bool resolved
    }
    BLOCKRECORD {
        int index
        string hash
        string previousHash
        string type
    }

    USER ||--o{ CROPBATCH      : "creates (farmer)"
    CROPBATCH ||--o{ PURCHASE  : "has"
    USER ||--o{ PURCHASE       : "makes (purchaser)"
    PURCHASE ||--o| FEEDBACK   : "generates"
    USER ||--o{ FEEDBACK       : "submits (purchaser)"
    CROPBATCH ||--|| BLOCKRECORD : "recorded as"
    PURCHASE  ||--|| BLOCKRECORD : "recorded as"
```
