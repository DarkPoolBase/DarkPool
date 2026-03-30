# Security Considerations

## Access Control
- `DEFAULT_ADMIN_ROLE`: Contract deployer. Can pause, update fees, grant roles.
- `DARKPOOL_ROLE`: Only DarkPool contract can lock/unlock/release escrow funds.
- `RELAYER_ROLE`: Only authorized relayer can submit batch settlements.

## Protections
- ReentrancyGuard on all fund-moving functions
- Pausable for emergency stops
- SafeERC20 for token transfers
- ECDSA signature verification for settlement proofs

## Known Limitations (V1)
- Trusted relayer model (not fully trustless)
- No ZK proof verification yet (V2)
- Single clearing price per batch (no partial fills)
