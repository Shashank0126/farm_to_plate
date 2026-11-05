const axios = require('axios')
const CropBatch = require('../models/CropBatch.model')
const Purchase = require('../models/Purchase.model')
const Feedback = require('../models/Feedback.model')
const BlockRecord = require('../models/BlockRecord.model')
const blockchain = require('../blockchain/Blockchain')

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Ordered by tool-calling reliability. openai/gpt-oss-120b and qwen/qwen3-32b
// handle function calling well; groq/compound* have their own built-in tool
// orchestration and are kept as a no-tools fallback at the end.
// Verify current IDs periodically at GET https://api.groq.com/openai/v1/models
// Verified active model IDs from GET https://api.groq.com/openai/v1/models
const CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'groq/compound-mini'
]

// Models known to support the `tools` parameter reliably for local tool calling.
const TOOL_CAPABLE_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b'
])

const MAX_TOOL_ROUNDS = 3

/**
 * Generate role-specific instructions
 */
function getRoleSystemInstruction(role, user) {
  const userName = user?.name ? ` The user's name is ${user.name}.` : ''
  const trustScore = user?.trustScore !== undefined ? ` Their current trust score is ${user.trustScore} / 5.0.` : ''

  switch (role) {
    case 'farmer':
      return `You are speaking with a registered Farmer.${userName}${trustScore}
Your role is to act as an expert agronomist and supply chain assistant:
- Display and explain their recorded batches whenever they ask about "my batches".
- Explain how their Trust Score is calculated (base 5.0, -0.2 penalty per unresolved buyer complaint, +0.1 bonus per verified batch).
- Help them inspect any buyer feedback or complaints using the get_complaints_and_feedback tool.
- Help them optimize their organic score (recommend practical organic inputs like vermicompost, neem cake, biofertilizers).
- Advise on dosage rates per acre/hectare, irrigation techniques, and proper batch documentation.`

    case 'purchaser':
      return `You are speaking with a registered Purchaser / Food Retailer.${userName}
Your role is to assist in sourcing transparent, verified agricultural produce:
- Help them discover verified organic batches ready to buy using the search_batches tool with status='verified'.
- Review their order history and purchased crops using the get_my_purchases tool.
- Help them evaluate batch quality, organic certification scores (80+ = high pure organic), and fraud risk.
- Explain blockchain verification hashes and proof-of-authenticity.
- Provide advice on transport conditions, optimal storage, shelf-life, and how to submit feedback for damaged goods.`

    case 'admin':
      return `You are speaking with a Platform Administrator.${userName}
Your role is to assist in platform oversight, quality verification, and dispute resolution:
- Review pending batches using search_batches with status='pending' to help make approve/reject decisions.
- Inspect the blockchain ledger and verify hash links using the get_blockchain_status tool.
- Review buyer disputes and complaints using the get_complaints_and_feedback tool.
- Assess ML organic probability vs. fraud risk metrics and flag data inconsistencies.`

    case 'consumer':
    default:
      return `You are speaking with a Consumer tracing food products.${userName}
Your role is to provide crystal-clear transparency and food education:
- Trace where and how food was grown using the blockchain supply chain record (search_batches or active batch).
- Verify blockchain hashes and explain that once recorded, agricultural provenance cannot be altered.
- Demystify organic scores and pesticide-free claims in friendly, everyday terms.
- Provide practical kitchen advice: optimal food storage, shelf-life, and nutritional highlights.`
  }
}

/**
 * Fetch batch context if batchId or _id is present in context
 */
async function fetchBatchContext(batchId) {
  if (!batchId) return null

  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(batchId)
    const query = isObjectId ? { $or: [{ _id: batchId }, { batchId }] } : { batchId }

    const batch = await CropBatch.findOne(query).lean()
    if (!batch) return null

    return formatBatchSummary(batch)
  } catch (err) {
    console.warn('Could not fetch batch context:', err.message)
    return null
  }
}

/**
 * Helper to safely format percentages and avoid 100x over-multiplication.
 */
function formatPercent(val) {
  if (val == null || val === '') return 'N/A'
  const num = Number(val)
  if (isNaN(num)) return 'N/A'
  const pct = num <= 1 && num > 0 ? num * 100 : num
  return Math.round(pct) + '%'
}

function getOrganicRating(score) {
  if (score == null || score === 'N/A') return 'Pending'
  const s = Number(score)
  if (s >= 80) return '⭐ High / Pure Organic'
  if (s >= 60) return '🌿 Moderate Organic'
  return '⚠️ Mixed / Low Organic'
}

function getFraudRating(risk) {
  if (risk == null || risk === 'N/A') return 'Safe'
  const r = typeof risk === 'string' ? parseFloat(risk) : Number(risk)
  if (isNaN(r)) return 'Safe'
  if (r <= 10) return '🟢 Low Risk (Safe)'
  if (r <= 30) return '🟡 Moderate Risk'
  return '🔴 High Risk (Flagged)'
}

/**
 * Shape a raw Mongo batch document into the plain-language fields the model
 * and the frontend expect. Shared by fetchBatchContext and the search tool.
 */
function formatBatchSummary(batch) {
  const area = Number(batch.areaHectares || 0)
  const qty = Number(batch.fertilizerQty || 0)
  const dosagePerHa = area > 0 && qty > 0 ? `${(qty / area).toFixed(1)} kg/ha` : 'N/A'
  const organicScore = batch.organicScore ?? 'N/A'
  const mlPred = formatPercent(batch.mlPrediction)
  const fraudRisk = formatPercent(batch.fraudRisk)

  return {
    batchId: batch.batchId,
    cropName: batch.cropName,
    variety: batch.variety || 'Standard',
    farmerName: batch.farmerName,
    farmLocation: batch.farmLocation || 'Not specified',
    harvestDate: batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A',
    areaHectares: area,
    fertilizerType: batch.fertilizerType,
    fertilizerName: batch.fertilizerName || 'N/A',
    fertilizerQtyKg: qty,
    dosagePerHaKg: dosagePerHa,
    soilQuality: batch.soilQuality || 'Good',
    status: batch.status,
    statusText: batch.status === 'verified' ? 'Verified on Blockchain ✅' : batch.status === 'rejected' ? 'Rejected ❌' : 'Pending Verification ⏳',
    organicScore,
    organicRating: getOrganicRating(organicScore),
    mlPrediction: mlPred,
    fraudRisk,
    fraudRating: getFraudRating(fraudRisk),
    groqScore: batch.groqScore ?? 'N/A',
    blockchainHash: batch.blockchainHash || 'Pending on-chain verification',
    isVerifiedOnChain: !!batch.blockchainHash
  }
}

/**
 * Tool definition given to the model so it can decide, on its own, when a
 * user's natural-language question requires looking beyond the single
 * pre-loaded batch (e.g. "show me my batches above 80", "find verified
 * tomato batches near Warangal").
 */
/**
 * Tool definitions given to the model for all roles:
 * - search_batches (Farmer, Purchaser, Admin, Consumer)
 * - get_my_purchases (Purchaser, Admin)
 * - get_complaints_and_feedback (Farmer, Admin)
 * - get_blockchain_status (Admin, Consumer)
 */
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_batches',
      description:
        'Search crop batches by crop name, farmer, farm location, verification status, or minimum organic score. ' +
        'Set myBatchesOnly: true whenever the user asks about "my batches", "my recorded batches", "batches I created", etc.',
      parameters: {
        type: 'object',
        properties: {
          myBatchesOnly: {
            type: 'boolean',
            description: 'Set to true if searching for the currently logged-in farmer\'s own batches.'
          },
          cropName: { type: 'string', description: 'Crop name to filter by, partial match ok (e.g. "wheat", "tomato")' },
          farmerName: { type: 'string', description: 'Farmer name to filter by, partial match ok' },
          farmLocation: { type: 'string', description: 'Location/region to filter by, partial match ok' },
          status: {
            type: 'string',
            enum: ['pending', 'verified', 'rejected'],
            description: 'Verification status filter'
          },
          minOrganicScore: { type: 'number', description: 'Only return batches with organicScore >= this value' },
          limit: { type: 'number', description: 'Max results to return, default 10, hard cap 20' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_purchases',
      description:
        'Retrieve purchase orders and bought crops for the logged-in purchaser (or recent platform purchases for an admin). ' +
        'Use this whenever a purchaser asks about "my purchases", "what did I buy?", "my orders", "purchased crops", etc.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum purchase records to return (default 5, max 20)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_complaints_and_feedback',
      description:
        'Retrieve buyer complaints, disputes, and quality feedback reports. ' +
        'For Farmers: retrieves complaints filed by buyers against their crops. ' +
        'For Admins: retrieves platform-wide unresolved complaints or disputes needing review.',
      parameters: {
        type: 'object',
        properties: {
          resolved: { type: 'boolean', description: 'Filter by resolution status (false for open/unresolved only)' },
          limit: { type: 'number', description: 'Maximum feedback items to return (default 5)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_blockchain_status',
      description:
        'Inspect the platform\'s cryptographic blockchain ledger: returns current chain height, latest block hash, ' +
        'cryptographic continuity validity (isValid), and recent block records. Use when asked about blockchain status, ' +
        'chain validity, latest mined blocks, or immutability checks.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
]

/**
 * Executes the search_batches tool call against MongoDB.
 */
async function runSearchBatchesTool(args = {}, user = null) {
  try {
    const query = {}

    const isMyBatches = args.myBatchesOnly ||
      (args.farmerName && ['my', 'me', 'mine', 'self'].includes(String(args.farmerName).toLowerCase().trim()))

    if (isMyBatches && user?._id) {
      query.$or = [
        { farmer: user._id },
        ...(user.name ? [{ farmerName: new RegExp(escapeRegex(user.name), 'i') }] : [])
      ]
    } else if (args.farmerName && !['my', 'me', 'mine'].includes(String(args.farmerName).toLowerCase().trim())) {
      query.farmerName = new RegExp(escapeRegex(args.farmerName), 'i')
    } else if (user?.role === 'farmer' && !args.cropName && !args.status && !args.farmLocation) {
      // If a logged-in farmer asks generally without filters, default to their own batches
      query.$or = [
        { farmer: user._id },
        ...(user.name ? [{ farmerName: new RegExp(escapeRegex(user.name), 'i') }] : [])
      ]
    }

    if (args.cropName) query.cropName = new RegExp(escapeRegex(args.cropName), 'i')
    if (args.farmLocation) query.farmLocation = new RegExp(escapeRegex(args.farmLocation), 'i')
    if (args.status) query.status = args.status
    if (args.minOrganicScore !== undefined) query.organicScore = { $gte: Number(args.minOrganicScore) }

    const limit = Math.min(Number(args.limit) || 10, 20)

    const batches = await CropBatch.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    if (!batches.length) {
      if (isMyBatches || (user?.role === 'farmer' && !args.cropName)) {
        return { count: 0, results: [], note: 'You do not have any recorded batches yet in your farmer account. You can create your first batch by clicking "Add Batch" in your dashboard.' }
      }
      return { count: 0, results: [], note: 'No batches matched those filters.' }
    }

    return {
      count: batches.length,
      results: batches.map(b => {
        const summary = formatBatchSummary(b)
        return {
          batchId: summary.batchId,
          cropName: summary.cropName,
          farmerName: summary.farmerName,
          farmLocation: summary.farmLocation,
          status: summary.statusText,
          organicScore: `${summary.organicScore}/100 (${summary.organicRating})`,
          fraudRisk: `${summary.fraudRisk} (${summary.fraudRating})`,
          harvestDate: summary.harvestDate
        }
      })
    }
  } catch (err) {
    console.warn('search_batches tool failed:', err.message)
    return { count: 0, results: [], error: 'Search failed due to a server error.' }
  }
}

/**
 * Executes get_my_purchases tool call against MongoDB.
 */
async function runGetPurchasesTool(args = {}, user = null) {
  try {
    const query = {}
    if (user?.role === 'purchaser' && user?._id) {
      query.purchaser = user._id
    }
    const limit = Math.min(Number(args.limit) || 5, 20)

    const purchases = await Purchase.find(query)
      .populate('batch')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    if (!purchases.length) {
      return { count: 0, results: [], note: 'No purchase records found in your account. You can browse verified crops on the Marketplace and buy directly.' }
    }

    return {
      count: purchases.length,
      results: purchases.map(p => ({
        purchaseId: String(p._id),
        batchId: p.batch?.batchId || 'N/A',
        cropName: p.batch?.cropName || 'Crop',
        farmerName: p.batch?.farmerName || 'Farmer',
        quantityPurchased: `${p.quantityPurchased} kg`,
        destination: p.marketDestination,
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : 'N/A',
        transportMode: p.transportMode || 'Standard',
        storageConditions: p.storageConditions || 'Standard',
        blockchainHash: p.blockchainHash ? `${p.blockchainHash.slice(0, 16)}...` : 'Verified on Blockchain'
      }))
    }
  } catch (err) {
    console.warn('get_my_purchases tool failed:', err.message)
    return { count: 0, results: [], error: 'Failed to load purchase records.' }
  }
}

/**
 * Executes get_complaints_and_feedback tool call against MongoDB.
 */
async function runGetFeedbackTool(args = {}, user = null) {
  try {
    const query = {}
    if (user?.role === 'farmer' && user?._id) {
      query.farmer = user._id
    }
    if (args.resolved !== undefined) {
      query.resolved = Boolean(args.resolved)
    }

    const limit = Math.min(Number(args.limit) || 5, 20)

    const feedbacks = await Feedback.find(query)
      .populate('batch')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    if (!feedbacks.length) {
      if (user?.role === 'farmer') {
        return { count: 0, results: [], note: 'Zero complaints reported! Your crops have a clean quality record with buyers.' }
      }
      return { count: 0, results: [], note: 'No complaints or feedback found.' }
    }

    return {
      count: feedbacks.length,
      results: feedbacks.map(f => ({
        feedbackId: String(f._id),
        batchId: f.batch?.batchId || 'N/A',
        cropName: f.batch?.cropName || 'Crop',
        type: f.type,
        rating: `${f.rating} / 5 ⭐`,
        description: f.description || 'No description provided.',
        purchaserName: f.purchaserName || 'Anonymous Purchaser',
        status: f.resolved ? 'Resolved ✅' : 'Open Dispute ⚠️',
        createdAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'N/A'
      }))
    }
  } catch (err) {
    console.warn('get_complaints_and_feedback tool failed:', err.message)
    return { count: 0, results: [], error: 'Failed to retrieve feedback reports.' }
  }
}

/**
 * Executes get_blockchain_status tool call.
 */
async function runGetBlockchainStatusTool(args = {}, user = null) {
  try {
    await blockchain.load()
    const stats = await blockchain.getStats()
    const isValid = await blockchain.isValid()
    const latest = blockchain.getLatestBlock()

    const recentRecords = await BlockRecord.find()
      .sort({ index: -1 })
      .limit(3)
      .lean()

    return {
      chainLength: stats.chainLength || recentRecords.length,
      chainStatus: isValid ? 'Cryptographically Verified & Tamper-Proof ✅' : 'Warning: Hash discrepancy detected ⚠️',
      latestBlock: latest ? {
        blockNumber: latest.index,
        blockType: latest.type,
        hash: latest.hash,
        timestamp: latest.timestamp ? new Date(latest.timestamp).toLocaleString() : 'N/A'
      } : null,
      recentBlocks: recentRecords.map(b => ({
        index: b.index,
        type: b.type,
        hash: `${b.hash.slice(0, 18)}...`,
        timestamp: b.timestamp ? new Date(b.timestamp).toLocaleString() : 'N/A'
      }))
    }
  } catch (err) {
    console.warn('get_blockchain_status tool failed:', err.message)
    return { error: 'Failed to inspect blockchain ledger.' }
  }
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const TOOL_IMPLEMENTATIONS = {
  search_batches: runSearchBatchesTool,
  get_my_purchases: runGetPurchasesTool,
  get_complaints_and_feedback: runGetFeedbackTool,
  get_blockchain_status: runGetBlockchainStatusTool
}

/**
 * Generate contextual prompt suggestions based on role and active batch
 */
function generateSuggestions(role, hasBatch) {
  if (hasBatch) {
    return [
      'Is this batch 100% organic?',
      'Verify the blockchain hash',
      'Explain the fertilizer dosage used',
      'What are the storage recommendations?'
    ]
  }

  switch (role) {
    case 'farmer':
      return [
        'Show my recorded batches',
        'What is my trust score and how is it calculated?',
        'Do I have any buyer complaints?',
        'How can I boost my organic score to 90+?'
      ]
    case 'purchaser':
      return [
        'What verified batches are available to buy?',
        'Show my purchase history',
        'What does the fraud risk metric mean?',
        'How do I verify batch provenance on blockchain?'
      ]
    case 'admin':
      return [
        'Show all pending batches to verify',
        'Is the blockchain ledger valid?',
        'Are there any unresolved complaints?',
        'Which batches have high fraud risk?'
      ]
    case 'consumer':
    default:
      return [
        'How do I trace food from farm to plate?',
        'What does an Organic Score of 80+ mean?',
        'How does blockchain stop food fraud?',
        'Tips for storing fresh organic produce'
      ]
  }
}

/**
 * Handle user conversation with Groq AI, with local tool calling so the
 * model can query the CropBatch collection for open-ended natural-language
 * questions rather than only discussing a single pre-loaded batch.
 */
async function chatWithGroq({ messages, context = {}, user = null }) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in environment variables.')
  }

  const role = context.role || user?.role || 'consumer'
  const batchData = await fetchBatchContext(context.batchId)

  let systemPrompt = `You are "FarmBot", the friendly, super-helpful AI Assistant for the "Farm to Plate" agricultural supply chain.
Your primary mission: Make complex agricultural, blockchain, and quality data crystal-clear, simple, and effortless for everyday users (farmers, shoppers, retailers, admins) to understand.

${getRoleSystemInstruction(role, user)}

GOLDEN RULES FOR EASY-TO-UNDERSTAND RESPONSES:
1. Simple, Everyday Language:
   - NO dense academic, mathematical, or scientific jargon (never use terms like "15 t ha⁻¹", "Isolation Forest", "cation exchange", or chemical formulas).
   - Use practical, real-world measurements (e.g. "about 3 to 4 bags (or ~150 kg) of compost per acre", "natural cow manure / neem cake", "safe and verified").
2. Direct Takeaway First:
   - Always start with a direct, 1-to-2 sentence summary right at the top so the user gets the core answer immediately.
3. Easy-To-Read Visual Cards for Batches:
   - When listing batches, DO NOT use wide markdown pipe tables (| col | col |). Instead, format each batch as an easy-to-read visual bullet card with emojis:
     🌱 **[Crop Name]** (\`[BATCH-ID]\`)
     • 📍 **Location:** [Farmer Name] in [Location]
     • 🌿 **Organic Score:** [Score]/100 ([High Quality / Moderate])
     • 🛡️ **Status:** [Verified on Blockchain ✅ / Pending Review ⏳]
     • 📅 **Harvested:** [Date]
     • 🔍 **Safety & Risk:** [Safe / Low Risk]
4. Explain Numbers in Plain Words:
   - Whenever mentioning scores, always translate what they mean:
     • Score 80-100: "High Organic — strict chemical-free standards met ⭐"
     • Score 60-79: "Moderate Organic — partially organic or mixed inputs 🌿"
     • Score < 60: "Low Organic — conventional or high synthetic inputs ⚠️"
     • Fraud Risk <= 10%: "Safe & Authentic (Passed all checks 🟢)"
5. Action-Oriented & Scannable:
   - Use short bullet points (•) and numbered steps (1., 2., 3.) for advice.
   - Keep answers concise and readable without overwhelming walls of text.
6. If the user's question is genuinely ambiguous, ask ONE short clarifying question instead of guessing.`

  if (batchData) {
    systemPrompt += `\n\n--- ACTIVE BATCH DATA IN CONTEXT ---
The user is currently inquiring about or viewing Batch \`${batchData.batchId}\`:
- Crop: ${batchData.cropName} (Variety: ${batchData.variety})
- Farmer: ${batchData.farmerName} (Location: ${batchData.farmLocation})
- Harvest Date: ${batchData.harvestDate}
- Farm Size: ${batchData.areaHectares} Hectares
- Fertilizer: ${batchData.fertilizerType} - ${batchData.fertilizerName} (${batchData.fertilizerQtyKg} kg total, ~${batchData.dosagePerHaKg})
- Soil Quality: ${batchData.soilQuality}
- Verification Status: ${batchData.statusText}
- Platform Organic Score: ${batchData.organicScore}/100 (${batchData.organicRating})
- ML Quality / Fraud Risk: ${batchData.mlPrediction} organic confidence | ${batchData.fraudRisk} fraud risk (${batchData.fraudRating})
- Blockchain Hash: ${batchData.blockchainHash} (Verified on-chain: ${batchData.isVerifiedOnChain ? 'YES ✅' : 'NO ⏳'})
Use these exact details whenever answering questions about THIS batch. For anything else (other batches, lists, comparisons), use the search_batches tool.`
  }

  // Pre-load role-specific data to ensure instant, accurate responses across all features
  if (role === 'farmer' && user) {
    try {
      const [myBatches, complaintsCount] = await Promise.all([
        CropBatch.find({
          $or: [
            { farmer: user._id },
            ...(user.name ? [{ farmerName: new RegExp(escapeRegex(user.name), 'i') }] : [])
          ]
        }).sort({ createdAt: -1 }).limit(10).lean(),
        Feedback.countDocuments({ farmer: user._id, resolved: false })
      ])

      systemPrompt += `\n\n--- FARMER PROFILE METRICS ---
• Farmer Name: ${user.name || 'Farmer'}
• Trust Score: ${user.trustScore ?? 5.0} / 5.0 (Calculated as: base 5.0 - (unresolved complaints × 0.2) + (verified batches × 0.1, max +1.0))
• Verified Batches Count: ${user.verifiedBatches || 0}
• Active Buyer Complaints / Disputes: ${complaintsCount} (${complaintsCount === 0 ? 'Zero complaints - clean reputation ✅' : 'Needs attention ⚠️'})`

      if (myBatches.length > 0) {
        systemPrompt += `\n\n--- THIS FARMER'S RECORDED BATCHES (${myBatches.length} batch(es) in account) ---
The logged-in farmer (${user.name || user.email}) has recorded the following batches:
${myBatches.map((b, idx) => {
          const s = formatBatchSummary(b)
          return `${idx + 1}. 🌱 **${s.cropName}** (\`${s.batchId}\`)
   • 📍 Location: ${s.farmLocation}
   • 🌿 Organic Score: ${s.organicScore}/100 (${s.organicRating})
   • 🛡️ Status: ${s.statusText}
   • 📅 Harvest Date: ${s.harvestDate}
   • 🧪 Fertilizer: ${s.fertilizerType} (${s.fertilizerName}, ${s.dosagePerHaKg})`
        }).join('\n')}
CRITICAL: When this farmer asks about "my batches", "my recorded batches", "what batches did I create?", or asks why they can't see their batches, ALWAYS present these exact batches from their profile clearly using visual emoji cards!`
      } else {
        systemPrompt += `\n\n--- THIS FARMER'S RECORDED BATCHES (0 batches found) ---
The logged-in farmer (${user.name || user.email}) currently has 0 recorded batches in their account. If they ask about their batches, politely explain that they haven't submitted any batches yet, and guide them to click "Add Batch" in their Farmer Dashboard.`
      }
    } catch (err) {
      console.warn('Could not preload farmer batches:', err.message)
    }
  }

  // Pre-load purchaser context if user is a logged-in purchaser
  if (role === 'purchaser' && user) {
    try {
      const [myPurchases, verifiedCount] = await Promise.all([
        Purchase.find({ purchaser: user._id }).populate('batch').sort({ createdAt: -1 }).limit(5).lean(),
        CropBatch.countDocuments({ status: 'verified' })
      ])

      systemPrompt += `\n\n--- PURCHASER ACCOUNT CONTEXT ---
• Purchaser Name: ${user.name || user.email}
• Verified Batches Available to Buy on Marketplace: ${verifiedCount}
• Orders / Purchases Made: ${myPurchases.length}`

      if (myPurchases.length > 0) {
        systemPrompt += `\nRecent Orders in Account:\n` + myPurchases.map((p, idx) =>
          `${idx + 1}. 📦 **${p.batch?.cropName || 'Crop'}** (\`${p.batch?.batchId || 'N/A'}\`) — ${p.quantityPurchased} kg to ${p.marketDestination} on ${p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : 'N/A'} (Blockchain Verified: ${p.blockchainHash ? 'YES ✅' : 'Pending'})`
        ).join('\n')
      }
    } catch (err) {
      console.warn('Could not preload purchaser data:', err.message)
    }
  }

  // Pre-load platform administration audit stats if user is an admin
  if (role === 'admin') {
    try {
      const [pendingCount, verifiedCount, rejectedCount, complaintsCount, blockCount] = await Promise.all([
        CropBatch.countDocuments({ status: 'pending' }),
        CropBatch.countDocuments({ status: 'verified' }),
        CropBatch.countDocuments({ status: 'rejected' }),
        Feedback.countDocuments({ resolved: false }),
        BlockRecord.countDocuments()
      ])

      systemPrompt += `\n\n--- PLATFORM AUDIT OVERVIEW (ADMIN COPILOT) ---
• Pending Batches Needing Verification: ${pendingCount}
• Verified Batches on Blockchain: ${verifiedCount}
• Rejected Batches: ${rejectedCount}
• Unresolved Buyer Complaints / Disputes: ${complaintsCount}
• Total Blockchain Blocks Recorded: ${blockCount}
CRITICAL: Use this live data when the administrator asks about pending approvals, platform metrics, disputes, or blockchain integrity!`
    } catch (err) {
      console.warn('Could not preload admin overview:', err.message)
    }
  }

  const conversation = (messages || []).slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '').trim()
  }))

  const baseMessages = [
    {
      role: 'system',
      content: systemPrompt + '\nImportant: Do NOT output <think> tags. Provide the final response directly.'
    },
    ...conversation
  ]

  let lastError = null

  for (const model of CHAT_MODELS) {
    try {
      const useTools = TOOL_CAPABLE_MODELS.has(model)
      const result = await runChatWithOptionalTools({
        apiKey,
        model,
        baseMessages,
        useTools,
        user
      })

      if (result?.reply) {
        return {
          reply: result.reply,
          model,
          batchContext: batchData ? { batchId: batchData.batchId, cropName: batchData.cropName } : null,
          suggestions: generateSuggestions(role, !!batchData)
        }
      }
    } catch (err) {
      lastError = err.response?.data?.error?.message || err.message
      console.warn(`Groq chat attempt failed with ${model}: ${lastError}`)
    }
  }

  throw new Error(`All Groq chat models failed. Last error: ${lastError}`)
}

/**
 * Runs the chat completion loop for a single model, resolving any tool calls
 * the model requests (up to MAX_TOOL_ROUNDS) before returning the final text.
 */
async function runChatWithOptionalTools({ apiKey, model, baseMessages, useTools, user = null }) {
  let messages = [...baseMessages]

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const payload = {
      model,
      messages,
      temperature: 0.4,
      max_tokens: 750
    }
    if (useTools) {
      payload.tools = TOOLS
      payload.tool_choice = 'auto'
    }

    const response = await axios.post(GROQ_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    })

    const message = response?.data?.choices?.[0]?.message
    if (!message) return null

    const toolCalls = message.tool_calls
    if (useTools && Array.isArray(toolCalls) && toolCalls.length > 0) {
      // Append the assistant's tool-call message, then one 'tool' message
      // per call, then loop back so the model can read the results.
      messages.push(message)

      for (const call of toolCalls) {
        const impl = TOOL_IMPLEMENTATIONS[call.function?.name]
        let toolResultContent

        if (!impl) {
          toolResultContent = JSON.stringify({ error: `Unknown tool: ${call.function?.name}` })
        } else {
          let args = {}
          try {
            args = JSON.parse(call.function.arguments || '{}')
          } catch {
            args = {}
          }
          const toolResult = await impl(args, user)
          toolResultContent = JSON.stringify(toolResult)
        }

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: toolResultContent
        })
      }

      continue // give the model another turn to respond using the tool results
    }

    // No tool calls: this is the final answer.
    const rawContent = message.content
    if (!rawContent) return null

    let cleanedReply = rawContent
    if (cleanedReply.includes('</think>')) {
      cleanedReply = cleanedReply.split('</think>').pop().trim()
    } else if (cleanedReply.startsWith('<think>')) {
      cleanedReply = cleanedReply.replace(/<think>/gi, '').trim()
    }

    return { reply: cleanedReply || rawContent.trim() }
  }

  // Exhausted tool rounds without a final answer.
  return null
}

module.exports = {
  chatWithGroq,
  generateSuggestions,
  fetchBatchContext
}