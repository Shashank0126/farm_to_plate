// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  CropBatch
 * @notice Stores immutable crop batch records on-chain.
 *         Only the contract owner (platform admin) can add batches.
 */
contract CropBatch {
    // ── Types ─────────────────────────────────────────────────────
    enum Status { Pending, Verified, Rejected }

    struct Batch {
        string  batchId;
        string  cropName;
        string  farmerName;
        string  farmLocation;
        uint8   organicScore;   // 0-100
        Status  status;
        uint256 createdAt;
        uint256 verifiedAt;
        address verifiedBy;
        string  season;
        string  fertilizerType;
        string  irrigationType;
    }

    // ── State ─────────────────────────────────────────────────────
    address public owner;

    // batchId string → Batch
    mapping(string => Batch) private batches;
    string[] private batchIds;

    // ── Events ────────────────────────────────────────────────────
    event BatchCreated(
        string indexed batchId,
        string cropName,
        string farmerName,
        uint256 timestamp
    );
    event BatchVerified(
        string indexed batchId,
        address verifiedBy,
        uint256 timestamp
    );
    event BatchRejected(
        string indexed batchId,
        uint256 timestamp
    );

    // ── Modifiers ─────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "CropBatch: caller is not owner");
        _;
    }

    modifier batchExists(string calldata batchId) {
        require(bytes(batches[batchId].batchId).length > 0, "CropBatch: batch not found");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Write functions ───────────────────────────────────────────

    /**
     * @notice Add a new crop batch (pending state).
     */
    function addBatch(
        string  calldata batchId,
        string  calldata cropName,
        string  calldata farmerName,
        string  calldata farmLocation,
        uint8            organicScore,
        string  calldata season,
        string  calldata fertilizerType,
        string  calldata irrigationType
    ) external onlyOwner {
        require(bytes(batches[batchId].batchId).length == 0, "CropBatch: batchId already exists");
        require(organicScore <= 100, "CropBatch: organicScore out of range");

        batches[batchId] = Batch({
            batchId       : batchId,
            cropName      : cropName,
            farmerName    : farmerName,
            farmLocation  : farmLocation,
            organicScore  : organicScore,
            status        : Status.Pending,
            createdAt     : block.timestamp,
            verifiedAt    : 0,
            verifiedBy    : address(0),
            season        : season,
            fertilizerType: fertilizerType,
            irrigationType: irrigationType
        });

        batchIds.push(batchId);
        emit BatchCreated(batchId, cropName, farmerName, block.timestamp);
    }

    /**
     * @notice Admin verifies a pending batch.
     */
    function verifyBatch(string calldata batchId)
        external
        onlyOwner
        batchExists(batchId)
    {
        require(batches[batchId].status == Status.Pending, "CropBatch: not pending");
        batches[batchId].status     = Status.Verified;
        batches[batchId].verifiedAt = block.timestamp;
        batches[batchId].verifiedBy = msg.sender;
        emit BatchVerified(batchId, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin rejects a pending batch.
     */
    function rejectBatch(string calldata batchId)
        external
        onlyOwner
        batchExists(batchId)
    {
        require(batches[batchId].status == Status.Pending, "CropBatch: not pending");
        batches[batchId].status = Status.Rejected;
        emit BatchRejected(batchId, block.timestamp);
    }

    // ── Read functions ────────────────────────────────────────────

    function getBatch(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (Batch memory)
    {
        return batches[batchId];
    }

    function getBatchCount() external view returns (uint256) {
        return batchIds.length;
    }

    function getBatchIdAt(uint256 index) external view returns (string memory) {
        require(index < batchIds.length, "CropBatch: index out of range");
        return batchIds[index];
    }

    function batchIdExists(string calldata batchId) external view returns (bool) {
        return bytes(batches[batchId].batchId).length > 0;
    }

    // ── Admin transfer ────────────────────────────────────────────
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CropBatch: zero address");
        owner = newOwner;
    }
}
