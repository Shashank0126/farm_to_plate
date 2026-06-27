const Block       = require('./Block')
const BlockRecord = require('../models/BlockRecord.model')

class Blockchain {
  constructor() {
    this.chain      = []
    this.difficulty = 2
    this.loaded     = false
  }

  async load() {
    if (this.loaded) return
    const records = await BlockRecord.find().sort({ index: 1 }).lean()
    if (records.length === 0) {
      await this.createGenesis()
    } else {
      this.chain = records
    }
    this.loaded = true
  }

  async createGenesis() {
    const genesis = new Block(0, { message: 'Farm to Plate Genesis Block', createdAt: new Date() }, '0'.repeat(64), 'genesis')
    genesis.mineBlock(this.difficulty)
    const record = new BlockRecord(genesis.toJSON())
    await record.save()
    this.chain = [record.toObject()]
    console.log('   Blockchain  : genesis block created')
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1]
  }

  async addBlock(data, type = 'batch') {
    await this.load()
    const latest   = this.getLatestBlock()
    const newBlock = new Block(latest.index + 1, data, latest.hash, type)
    newBlock.mineBlock(this.difficulty)

    const record = new BlockRecord(newBlock.toJSON())
    await record.save()
    this.chain.push(record.toObject())

    return newBlock
  }

  async isValid() {
    await this.load()
    for (let i = 1; i < this.chain.length; i++) {
      const current  = this.chain[i]
      const previous = this.chain[i - 1]

      // Recompute hash
      const recomputed = require('crypto')
        .createHash('sha256')
        .update(
          String(current.index) +
          current.timestamp +
          JSON.stringify(current.data) +
          current.previousHash +
          String(current.nonce)
        )
        .digest('hex')

      if (current.hash !== recomputed)       return false
      if (current.previousHash !== previous.hash) return false
    }
    return true
  }

  async getChain() {
    await this.load()
    return this.chain
  }

  async getStats() {
    await this.load()
    return {
      chainLength:   this.chain.length,
      transactions:  this.chain.length - 1, // exclude genesis
      lastBlockTime: this.chain.length > 1
        ? this.chain[this.chain.length - 1].timestamp
        : null,
    }
  }
}

// Singleton
const blockchain = new Blockchain()
module.exports = blockchain
