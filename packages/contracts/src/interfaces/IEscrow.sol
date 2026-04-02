// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEscrow {
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event FundsLocked(address indexed user, bytes32 indexed orderId, uint256 amount);
    event FundsUnlocked(address indexed user, bytes32 indexed orderId, uint256 amount);
    event FundsReleased(address indexed from, address indexed to, uint256 amount, uint256 fee);

    function deposit(uint256 amount) external;
    function depositFor(address user, uint256 amount) external;
    function withdraw(uint256 amount) external;
    function lockFunds(address user, uint256 amount, bytes32 orderId) external;
    function unlockFunds(address user, uint256 amount, bytes32 orderId) external;
    function releaseFunds(address from, address to, uint256 amount, uint256 fee) external;
    function getBalance(address user) external view returns (uint256 available, uint256 locked);
}

