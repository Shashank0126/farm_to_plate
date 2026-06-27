const crypto = require('crypto')

class Block {
  constructor(index, data, previousHash = '0'.repeat(64), type = 'batch') {
    this.index        = index
    this.timestamp    = new Date().toISOString()
    this.data         = data
    this.previousHash = previousHash
    this.nonce        = 0
    this.type         = type
    this.hash         = this.calculateHash()
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        String(this.index) +
        this.timestamp +
        JSON.stringify(this.data) +
        this.previousHash +
        String(this.nonce)
      )
      .digest('hex')
  }

  // Simple proof-of-work (difficulty=2 for speed)
  mineBlock(difficulty = 2) {
    const target = '0'.repeat(difficulty)
    while (!this.hash.startsWith(target)) {
      this.nonce++
      this.hash = this.calculateHash()
    }
    return this
  }

  toJSON() {
    return {
      index:        this.index,
      timestamp:    this.timestamp,
      data:         this.data,
      previousHash: this.previousHash,
      hash:         this.hash,
      nonce:        this.nonce,
      type:         this.type,
    }
  }
}

module.exports = Block
