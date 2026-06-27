require('dotenv').config()
const http      = require('http')
const app       = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require('./sockets/socket.handler')

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()

  const server = http.createServer(app)
  initSocket(server)

  server.listen(PORT, () => {
    console.log(`\n🌿 Farm to Plate API running on port ${PORT}`)
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`   MongoDB     : connected`)
    console.log(`   Socket.IO   : enabled\n`)
  })
}

start().catch(err => {
  console.error('Startup error:', err)
  process.exit(1)
})
