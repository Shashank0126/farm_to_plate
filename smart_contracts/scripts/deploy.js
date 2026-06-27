const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 Deploying Farm to Plate contracts");
  console.log("   Deployer :", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("   Balance  :", ethers.formatEther(balance), "ETH\n");

  // 1. CropBatch
  const CropBatch = await ethers.getContractFactory("CropBatch");
  const cropBatch = await CropBatch.deploy();
  await cropBatch.waitForDeployment();
  console.log("✅ CropBatch       :", await cropBatch.getAddress());

  // 2. PurchaseRecord
  const PurchaseRecord = await ethers.getContractFactory("PurchaseRecord");
  const purchaseRecord = await PurchaseRecord.deploy();
  await purchaseRecord.waitForDeployment();
  console.log("✅ PurchaseRecord  :", await purchaseRecord.getAddress());

  // 3. VerificationLog
  const VerificationLog = await ethers.getContractFactory("VerificationLog");
  const verificationLog = await VerificationLog.deploy();
  await verificationLog.waitForDeployment();
  console.log("✅ VerificationLog :", await verificationLog.getAddress());

  // Write addresses to JSON for backend
  const fs   = require("fs");
  const path = require("path");
  const addresses = {
    CropBatch      : await cropBatch.getAddress(),
    PurchaseRecord : await purchaseRecord.getAddress(),
    VerificationLog: await verificationLog.getAddress(),
    network        : hre.network.name,
    deployedAt     : new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "..", "deployed_addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\n📄 Addresses written to:", outPath);
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
