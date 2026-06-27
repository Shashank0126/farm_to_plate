require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const User      = require('../models/User.model')
const CropBatch = require('../models/CropBatch.model')
const blockchain = require('../blockchain/Blockchain')

const MONGO_URI = process.env.MONGO_URI

const USERS = [
  { name: 'Ravi Kumar',       email: 'farmer@demo.com',    password: 'demo1234', role: 'farmer',    phone: '+91 98765 43210', trustScore: 4.7 },
  { name: 'Priya Singh',      email: 'farmer2@demo.com',   password: 'demo1234', role: 'farmer',    phone: '+91 87654 32109', trustScore: 4.2 },
  { name: 'Agro Traders Ltd', email: 'purchaser@demo.com', password: 'demo1234', role: 'purchaser', phone: '+91 76543 21098' },
  { name: 'Admin User',       email: 'admin@demo.com',     password: 'demo1234', role: 'admin',     phone: '+91 65432 10987' },
]

const BATCHES = (farmerId) => [
  {
    batchId: 'WHT-20240301-A1B2C',
    farmer: farmerId, farmerName: 'Ravi Kumar',
    farmLocation: 'Amritsar, Punjab', latitude: 31.6340, longitude: 74.8723,
    soilType: 'Loamy', soilQuality: 'Excellent',
    cropName: 'Wheat', variety: 'HD-2967', season: 'Rabi',
    harvestDate: new Date('2024-03-15'),
    areaHectares: 3.5,
    fertilizerType: 'Organic', fertilizerName: 'Compost', fertilizerQty: 120,
    irrigationType: 'Canal',
    organicScore: 82,
    status: 'verified',
    blockchainHash: '00' + 'a'.repeat(62),
    blockIndex: 1,
    verifiedAt: new Date('2024-03-18'),
    proofImages: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'],
    notes: 'Premium quality winter wheat',
  },
  {
    batchId: 'RIC-20240601-D3E4F',
    farmer: farmerId, farmerName: 'Ravi Kumar',
    farmLocation: 'Amritsar, Punjab', latitude: 31.6340, longitude: 74.8723,
    soilType: 'Clay', soilQuality: 'Good',
    cropName: 'Rice', variety: 'Basmati 1121', season: 'Kharif',
    harvestDate: new Date('2024-10-20'),
    areaHectares: 2.0,
    fertilizerType: 'Mixed', fertilizerName: 'NPK + Compost', fertilizerQty: 80,
    irrigationType: 'Drip',
    organicScore: 65,
    status: 'pending',
    proofImages: [],
  },
  {
    batchId: 'COT-20240501-G5H6I',
    farmer: farmerId, farmerName: 'Ravi Kumar',
    farmLocation: 'Amritsar, Punjab', latitude: 31.6340, longitude: 74.8723,
    soilType: 'Black Cotton', soilQuality: 'Good',
    cropName: 'Cotton', season: 'Kharif',
    harvestDate: new Date('2024-11-10'),
    areaHectares: 4.0,
    fertilizerType: 'Inorganic', fertilizerName: 'Urea', fertilizerQty: 200,
    irrigationType: 'Sprinkler',
    organicScore: 28,
    status: 'rejected',
    adminNote: 'Fertilizer bill not clearly legible. Please resubmit.',
    proofImages: [],
  },
]

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: 'farm-to-plate' })
  console.log('Connected to MongoDB')

  // Clear existing
  await Promise.all([User.deleteMany(), CropBatch.deleteMany()])
  console.log('Cleared existing data')

  // Create users
  const created = []
  for (const u of USERS) {
    const user = new User(u)
    await user.save()
    created.push(user)
    console.log(`  ✓ User: ${u.email} (${u.role})`)
  }

  const farmer = created.find(u => u.role === 'farmer')

  // Create batches
  const batches = BATCHES(farmer._id)
  for (const b of batches) {
    await CropBatch.create(b)
    console.log(`  ✓ Batch: ${b.batchId} [${b.status}]`)
  }

  // Init blockchain
  await blockchain.load()
  console.log('  ✓ Blockchain initialized')

  console.log('\n✅ Seed complete!')
  console.log('   farmer@demo.com   / demo1234')
  console.log('   purchaser@demo.com/ demo1234')
  console.log('   admin@demo.com    / demo1234')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
