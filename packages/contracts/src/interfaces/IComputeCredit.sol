// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IComputeCredit is IERC20 {
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event CreditsMinted(address indexed to, uint256 amount, uint256 usdcCost);
    event CreditsBurned(address indexed from, uint256 amount);

    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function exchangeRate() external view returns (uint256);
    function setExchangeRate(uint256 newRate) external;
}
