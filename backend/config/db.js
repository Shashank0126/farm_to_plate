const mongoose = require('mongoose')

let isConnected = false

async function connectDB() {
  if (isConnected) return
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'farm-to-plate',
    })
    isConnected = true
    console.log(`   MongoDB     : ${conn.connection.host}`)
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
