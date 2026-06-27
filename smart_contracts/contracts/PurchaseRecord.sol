// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  PurchaseRecord
 * @notice Appends purchase transactions to existing crop batches.
 */
contract PurchaseRecord {
    struct Purchase {
        string  purchaseId;
        string  batchId;
        string  purchaserName;
        uint256 quantityKg;       // quantity × 1000 to avoid decimals
        string  marketDestination;
        string  storageConditions;
        uint256 purchasedAt;
        address purchaser;
    }

    address public owner;

    // purchaseId → Purchase
    mapping(string => Purchase) private purchases;

    // batchId → purchaseId[]  (all purchases for a batch)
    mapping(string => string[]) private batchPurchases;

    string[] private allPurchaseIds;

    event PurchaseRecorded(
        string indexed purchaseId,
        string indexed batchId,
        string purchaserName,
        uint256 quantityKg,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "PurchaseRecord: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordPurchase(
        string  calldata purchaseId,
        string  calldata batchId,
        string  calldata purchaserName,
        uint256          quantityKg,
        string  calldata marketDestination,
        string  calldata storageConditions
    ) external onlyOwner {
        require(bytes(purchases[purchaseId].purchaseId).length == 0, "PurchaseRecord: already exists");

        purchases[purchaseId] = Purchase({
            purchaseId        : purchaseId,
            batchId           : batchId,
            purchaserName     : purchaserName,
            quantityKg        : quantityKg,
            marketDestination : marketDestination,
            storageConditions : storageConditions,
            purchasedAt       : block.timestamp,
            purchaser         : msg.sender
        });

        batchPurchases[batchId].push(purchaseId);
        allPurchaseIds.push(purchaseId);

        emit PurchaseRecorded(purchaseId, batchId, purchaserName, quantityKg, block.timestamp);
    }

    function getPurchase(string calldata purchaseId)
        external view returns (Purchase memory)
    {
        require(bytes(purchases[purchaseId].purchaseId).length > 0, "PurchaseRecord: not found");
        return purchases[purchaseId];
    }

    function getPurchasesForBatch(string calldata batchId)
        external view returns (string[] memory)
    {
        return batchPurchases[batchId];
    }

    function getTotalPurchases() external view returns (uint256) {
        return allPurchaseIds.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }
}
