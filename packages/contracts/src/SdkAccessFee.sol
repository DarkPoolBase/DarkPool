// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISdkAccessFee.sol";

/// @title SdkAccessFee - Tiered subscription management for SDK access
/// @notice Manages monthly subscriptions to SDK access tiers, collecting
/// fees in the payment token and tracking subscriber expiry.
contract SdkAccessFee is ISdkAccessFee, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    address public feeRecipient;

    uint256 public constant SUBSCRIPTION_PERIOD = 30 days;

    uint256 public tierCount;
    mapping(uint256 => AccessTier) private _tiers;
    uint256[] private _tierIds;

    mapping(address => uint256) private _subscriberTier;
    mapping(address => uint256) private _subscriberExpiry;

    constructor(address _paymentToken, address _feeRecipient) {
        require(_paymentToken != address(0), "SdkAccessFee: zero token");
        require(_feeRecipient != address(0), "SdkAccessFee: zero fee recipient");
        paymentToken = IERC20(_paymentToken);
        feeRecipient = _feeRecipient;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ========== Admin ==========

    /// @notice Create a new access tier (admin only)
    function createTier(
        string calldata name,
        uint256 monthlyFee,
        uint256 maxRequestsPerDay
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "SdkAccessFee: empty name");
        require(monthlyFee > 0, "SdkAccessFee: zero fee");
        require(maxRequestsPerDay > 0, "SdkAccessFee: zero requests");

        uint256 tierId = ++tierCount;

        _tiers[tierId] = AccessTier({
            name: name,
            monthlyFee: monthlyFee,
            maxRequestsPerDay: maxRequestsPerDay,
            active: true
        });

        _tierIds.push(tierId);

        emit TierCreated(tierId, name, monthlyFee);
        return tierId;
    }

    // ========== Subscribe ==========

    /// @notice Subscribe to an access tier
    function subscribe(uint256 tierId) external nonReentrant {
        AccessTier storage tier = _tiers[tierId];
        require(tier.active, "SdkAccessFee: tier not active");

        paymentToken.safeTransferFrom(msg.sender, feeRecipient, tier.monthlyFee);

        _subscriberTier[msg.sender] = tierId;
        _subscriberExpiry[msg.sender] = block.timestamp + SUBSCRIPTION_PERIOD;

        emit FeeCollected(msg.sender, tier.monthlyFee);
        emit SubscriptionCreated(msg.sender, tierId, _subscriberExpiry[msg.sender]);
    }

    /// @notice Renew the current subscription
    function renewSubscription() external nonReentrant {
        uint256 tierId = _subscriberTier[msg.sender];
        require(tierId != 0, "SdkAccessFee: no subscription");

        AccessTier storage tier = _tiers[tierId];
        require(tier.active, "SdkAccessFee: tier not active");

        paymentToken.safeTransferFrom(msg.sender, feeRecipient, tier.monthlyFee);

        // Extend from max(now, currentExpiry) so early renewals don't lose time
        uint256 base = block.timestamp > _subscriberExpiry[msg.sender]
            ? block.timestamp
            : _subscriberExpiry[msg.sender];
        _subscriberExpiry[msg.sender] = base + SUBSCRIPTION_PERIOD;

        emit FeeCollected(msg.sender, tier.monthlyFee);
        emit SubscriptionRenewed(msg.sender, tierId, _subscriberExpiry[msg.sender]);
    }

    // ========== Views ==========

    /// @notice Get subscription details for a subscriber
    function getSubscription(address subscriber)
        external
        view
        returns (uint256 tierId, uint256 expiresAt, bool active)
    {
        tierId = _subscriberTier[subscriber];
        expiresAt = _subscriberExpiry[subscriber];
        active = expiresAt > block.timestamp;
    }

    /// @notice Get a tier by ID
    function getTier(uint256 tierId) external view returns (AccessTier memory) {
        require(_tiers[tierId].active || bytes(_tiers[tierId].name).length > 0, "SdkAccessFee: tier not found");
        return _tiers[tierId];
    }

    /// @notice List all tiers
    function listTiers() external view returns (AccessTier[] memory) {
        uint256 total = _tierIds.length;
        AccessTier[] memory result = new AccessTier[](total);
        for (uint256 i = 0; i < total; i++) {
            result[i] = _tiers[_tierIds[i]];
        }
        return result;
    }

    /// @notice Check if an address has an active subscription
    function isActiveSubscriber(address subscriber) external view returns (bool) {
        return _subscriberExpiry[subscriber] > block.timestamp;
    }
}
