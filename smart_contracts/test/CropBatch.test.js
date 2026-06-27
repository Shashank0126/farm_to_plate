const { expect }  = require("chai");
const { ethers }  = require("hardhat");

describe("CropBatch Contract", function () {
  let cropBatch;
  let owner;
  let addr1;

  const BATCH = {
    batchId       : "WHT-20240301-A1B2C",
    cropName      : "Wheat",
    farmerName    : "Ravi Kumar",
    farmLocation  : "Amritsar, Punjab",
    organicScore  : 82,
    season        : "Rabi",
    fertilizerType: "Organic",
    irrigationType: "Canal",
  };

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    const CropBatch = await ethers.getContractFactory("CropBatch");
    cropBatch = await CropBatch.deploy();
    await cropBatch.waitForDeployment();
  });

  // ── Deployment ────────────────────────────────────────────────
  describe("Deployment", () => {
    it("sets the deployer as owner", async () => {
      expect(await cropBatch.owner()).to.equal(owner.address);
    });

    it("starts with zero batches", async () => {
      expect(await cropBatch.getBatchCount()).to.equal(0);
    });
  });

  // ── Add batch ─────────────────────────────────────────────────
  describe("addBatch()", () => {
    it("allows owner to add a batch", async () => {
      await expect(
        cropBatch.addBatch(
          BATCH.batchId, BATCH.cropName, BATCH.farmerName,
          BATCH.farmLocation, BATCH.organicScore,
          BATCH.season, BATCH.fertilizerType, BATCH.irrigationType
        )
      ).to.emit(cropBatch, "BatchCreated")
        .withArgs(BATCH.batchId, BATCH.cropName, BATCH.farmerName, await _blockTs());
    });

    it("reverts when non-owner tries to add", async () => {
      await expect(
        cropBatch.connect(addr1).addBatch(
          BATCH.batchId, BATCH.cropName, BATCH.farmerName,
          BATCH.farmLocation, BATCH.organicScore,
          BATCH.season, BATCH.fertilizerType, BATCH.irrigationType
        )
      ).to.be.revertedWith("CropBatch: caller is not owner");
    });

    it("reverts on duplicate batchId", async () => {
      await _addBatch();
      await expect(_addBatch()).to.be.revertedWith("CropBatch: batchId already exists");
    });

    it("reverts on organicScore > 100", async () => {
      await expect(
        cropBatch.addBatch(
          "BAD-ID", BATCH.cropName, BATCH.farmerName,
          BATCH.farmLocation, 101,
          BATCH.season, BATCH.fertilizerType, BATCH.irrigationType
        )
      ).to.be.revertedWith("CropBatch: organicScore out of range");
    });

    it("increments batch count", async () => {
      await _addBatch();
      expect(await cropBatch.getBatchCount()).to.equal(1);
    });
  });

  // ── Verify ───────────────────────────────────────────────────
  describe("verifyBatch()", () => {
    beforeEach(_addBatch);

    it("sets status to Verified", async () => {
      await cropBatch.verifyBatch(BATCH.batchId);
      const b = await cropBatch.getBatch(BATCH.batchId);
      expect(b.status).to.equal(1); // Status.Verified
    });

    it("emits BatchVerified event", async () => {
      await expect(cropBatch.verifyBatch(BATCH.batchId))
        .to.emit(cropBatch, "BatchVerified")
        .withArgs(BATCH.batchId, owner.address, await _blockTs());
    });

    it("reverts if already verified", async () => {
      await cropBatch.verifyBatch(BATCH.batchId);
      await expect(cropBatch.verifyBatch(BATCH.batchId))
        .to.be.revertedWith("CropBatch: not pending");
    });

    it("reverts if non-owner calls", async () => {
      await expect(cropBatch.connect(addr1).verifyBatch(BATCH.batchId))
        .to.be.revertedWith("CropBatch: caller is not owner");
    });
  });

  // ── Reject ───────────────────────────────────────────────────
  describe("rejectBatch()", () => {
    beforeEach(_addBatch);

    it("sets status to Rejected", async () => {
      await cropBatch.rejectBatch(BATCH.batchId);
      const b = await cropBatch.getBatch(BATCH.batchId);
      expect(b.status).to.equal(2); // Status.Rejected
    });

    it("emits BatchRejected event", async () => {
      await expect(cropBatch.rejectBatch(BATCH.batchId))
        .to.emit(cropBatch, "BatchRejected");
    });
  });

  // ── Read ─────────────────────────────────────────────────────
  describe("getBatch()", () => {
    beforeEach(_addBatch);

    it("returns correct batch data", async () => {
      const b = await cropBatch.getBatch(BATCH.batchId);
      expect(b.cropName).to.equal(BATCH.cropName);
      expect(b.farmerName).to.equal(BATCH.farmerName);
      expect(b.organicScore).to.equal(BATCH.organicScore);
      expect(b.status).to.equal(0); // Pending
    });

    it("reverts for unknown batchId", async () => {
      await expect(cropBatch.getBatch("UNKNOWN"))
        .to.be.revertedWith("CropBatch: batch not found");
    });
  });

  // ── Ownership ────────────────────────────────────────────────
  describe("transferOwnership()", () => {
    it("transfers owner", async () => {
      await cropBatch.transferOwnership(addr1.address);
      expect(await cropBatch.owner()).to.equal(addr1.address);
    });

    it("reverts for zero address", async () => {
      await expect(cropBatch.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("CropBatch: zero address");
    });
  });

  // ── Helpers ──────────────────────────────────────────────────
  async function _addBatch() {
    return cropBatch.addBatch(
      BATCH.batchId, BATCH.cropName, BATCH.farmerName,
      BATCH.farmLocation, BATCH.organicScore,
      BATCH.season, BATCH.fertilizerType, BATCH.irrigationType
    );
  }

  async function _blockTs() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
