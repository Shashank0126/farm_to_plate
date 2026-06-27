// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  VerificationLog
 * @notice Immutable log of all admin verification actions.
 */
contract VerificationLog {
    enum Action { Verified, Rejected }

    struct LogEntry {
        string  batchId;
        Action  action;
        address admin;
        uint256 timestamp;
        string  note;
    }

    address public owner;

    LogEntry[] private logs;

    // batchId → log index[]
    mapping(string => uint256[]) private batchLogs;

    event ActionLogged(
        string indexed batchId,
        Action         action,
        address indexed admin,
        uint256        timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "VerificationLog: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function logAction(
        string  calldata batchId,
        Action           action,
        string  calldata note
    ) external onlyOwner {
        uint256 idx = logs.length;
        logs.push(LogEntry({
            batchId   : batchId,
            action    : action,
            admin     : msg.sender,
            timestamp : block.timestamp,
            note      : note
        }));
        batchLogs[batchId].push(idx);
        emit ActionLogged(batchId, action, msg.sender, block.timestamp);
    }

    function getLog(uint256 index) external view returns (LogEntry memory) {
        require(index < logs.length, "VerificationLog: index out of range");
        return logs[index];
    }

    function getLogsForBatch(string calldata batchId)
        external view returns (uint256[] memory)
    {
        return batchLogs[batchId];
    }

    function totalLogs() external view returns (uint256) {
        return logs.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }
}
