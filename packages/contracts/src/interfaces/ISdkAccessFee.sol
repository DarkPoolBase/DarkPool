// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISdkAccessFee {
    struct AccessTier {
        string name;
        uint256 monthlyFee;
        uint256 maxRequestsPerDay;
        bool active;
    }

    event TierCreated(uint256 indexed tierId, string name, uint256 monthlyFee);
    event SubscriptionCreated(address indexed subscriber, uint256 indexed tierId, uint256 expiresAt);
    event SubscriptionRenewed(address indexed subscriber, uint256 indexed tierId, uint256 newExpiresAt);
    event FeeCollected(address indexed subscriber, uint256 amount);

    function createTier(string calldata name, uint256 monthlyFee, uint256 maxRequestsPerDay) external returns (uint256);
    function subscribe(uint256 tierId) external;
    function renewSubscription() external;
    function getSubscription(address subscriber) external view returns (uint256 tierId, uint256 expiresAt, bool active);
    function getTier(uint256 tierId) external view returns (AccessTier memory);
    function listTiers() external view returns (AccessTier[] memory);
    function isActiveSubscriber(address subscriber) external view returns (bool);
}
