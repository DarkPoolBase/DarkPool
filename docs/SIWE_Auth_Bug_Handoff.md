# SIWE Authentication Bug — Handoff to Powerz

**From:** Sorrowz
**Date:** 2026-03-31
**Priority:** High — blocks order submission on production

---

## The Problem

When a user clicks "Submit Encrypted Order" on the ProductDetail page, the frontend attempts to authenticate via SIWE (Sign-In With Ethereum) before calling `POST /api/orders`. **Phantom wallet rejects the signature request** with:

```
The app's signature request cannot be shown as the address does not match
the provided address for verification.
```

This error comes from Phantom's EVM provider when `personal_sign` is called. The order submission flow is completely blocked because authentication fails before the API call is made.

---

## Where The Bug Is

### Frontend Side (Sorrowz's code — working correctly)

**File:** `src/hooks/useAutoAuth.ts`

The `authenticate()` function:
1. Gets a nonce from `GET /api/auth/nonce?address=0x...` ✅
2. Builds a SIWE message string ✅
3. Calls `personal_sign` via the wallet provider ❌ **Phantom rejects here**
4. Sends signature to `POST /api/auth/verify` (never reaches this step)

**File:** `src/hooks/useAuth.ts` (line 43-54)

The SIWE message is formatted as:
```
www.darkpoolbase.org wants you to sign in with your Ethereum account:
0x705e36efb7f699388cbdcafa95...

Sign in to Agentic Dark Pool

URI: https://www.darkpoolbase.org
Version: 1
Chain ID: 8453
Nonce: <from backend>
Issued At: 2026-03-31T05:00:00.000Z
```

### Backend Side (Powerz's code — needs investigation)

**File:** `src/auth/auth.service.ts`

The `verify(message, signature)` method needs to:
1. Parse the SIWE message
2. Extract the nonce and wallet address
3. Verify the signature matches
4. Return JWT tokens

**File:** `src/auth/auth.controller.ts`

- `GET /api/auth/nonce?address=0x...` — generates and stores a nonce
- `POST /api/auth/verify` — receives `{ message, signature }`, returns `{ accessToken, refreshToken }`

---

## What We've Tried (All Failed)

| Attempt | Result |
|---------|--------|
| `personal_sign` with params `[message, address]` | Phantom rejects: "address does not match" |
| `personal_sign` with params `[address, message]` | Same error |
| `personal_sign` with hex-encoded message `[0x..., address]` | Same error |
| EIP-4361 formatted SIWE message | Same error |

---

## Root Cause Analysis

The error `"the address does not match the provided address for verification"` is **Phantom-specific**. It occurs when Phantom's EVM provider receives a `personal_sign` request but cannot verify that the signing address matches the currently connected account.

Possible causes:
1. **Address case mismatch** — Phantom may store the address in a different case (checksummed vs lowercase) than what we pass in params
2. **Provider mismatch** — We might be calling `personal_sign` on `window.phantom.ethereum` but the connected account is on a different provider instance
3. **Phantom EVM mode quirk** — Phantom's Ethereum support may require `eth_signTypedData_v4` instead of `personal_sign` for SIWE
4. **The address in the SIWE message doesn't match the connected wallet** — The `fullWalletAddress` from WalletContext might be stale or different from what Phantom reports as the active account

---

## How To Fix

### Option A: Use `eth_signTypedData_v4` (Recommended)

Phantom's EVM mode works better with EIP-712 typed data signing. Instead of `personal_sign`, use the `siwe` npm package (already installed in the backend) to generate a proper EIP-712 typed message.

```typescript
// Frontend — useAutoAuth.ts
const signMessage = async (message: string): Promise<string> => {
  const provider = getProvider();
  if (!provider) throw new Error('No wallet provider');

  // Get the current account directly from provider to avoid stale address
  const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
  const currentAddress = accounts[0];

  // Use personal_sign with the ACTUAL current address from provider
  const hexMessage = '0x' + Buffer.from(message).toString('hex');
  return (await provider.request({
    method: 'personal_sign',
    params: [hexMessage, currentAddress],  // Use address from provider, not from state
  })) as string;
};
```

### Option B: Verify Address Match Before Signing

```typescript
// Before calling personal_sign, verify the address matches
const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
const providerAddress = accounts[0]?.toLowerCase();
const contextAddress = fullWalletAddress?.toLowerCase();

if (providerAddress !== contextAddress) {
  console.error('Address mismatch!', { providerAddress, contextAddress });
  // Re-connect wallet or use providerAddress for the SIWE message
}
```

### Option C: Backend Changes — Accept Both Formats

The backend's `auth.service.ts` `verify()` method should:
1. Try parsing as standard SIWE message first
2. If that fails, try parsing as a simple signed message
3. Use `ethers.verifyMessage()` or `viem.verifyMessage()` as fallback

---

## How To Test

### 1. Local Testing
```bash
cd packages/backend && npm run start:dev
```

### 2. Test the nonce endpoint
```bash
curl "http://localhost:3001/api/auth/nonce?address=0x705e36efb7f699388cbdcafa95..."
# Should return: { "nonce": "abc123..." }
```

### 3. Test with a manual signature (using cast)
```bash
# Sign the SIWE message with a test private key
cast wallet sign --private-key 0xTEST_KEY "message_here"
```

### 4. Test the verify endpoint
```bash
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"message": "...", "signature": "0x..."}'
# Should return: { "accessToken": "...", "refreshToken": "..." }
```

### 5. Test on production
- Go to https://www.darkpoolbase.org
- Connect Phantom wallet
- Go to /marketplace, click H100
- Click "Submit Encrypted Order"
- Phantom should show a clean signature request
- After signing, order should appear on /orders page

---

## Files To Investigate

| File | Owner | What To Check |
|------|-------|---------------|
| `src/auth/auth.service.ts` | Powerz | How `verify()` parses SIWE message and recovers address |
| `src/auth/auth.controller.ts` | Powerz | How nonce is generated and stored |
| `src/auth/entities/user.entity.ts` | Powerz | How wallet address is stored (lowercase? checksummed?) |
| `src/hooks/useAutoAuth.ts` | Sorrowz | The `authenticate()` function that calls `personal_sign` |
| `src/hooks/useAuth.ts` | Sorrowz | The `login()` function that builds the SIWE message |
| `src/contexts/WalletContext.tsx` | Sorrowz | How `fullWalletAddress` is captured from the provider |

---

## Current State of the Code

### useAutoAuth.ts (Sorrowz)
```typescript
const signMessage = async (message: string): Promise<string> => {
  const provider = getProvider();
  if (!provider) throw new Error('No wallet provider');
  const hexMessage = '0x' + Array.from(new TextEncoder().encode(message))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return (await provider.request({
    method: 'personal_sign',
    params: [hexMessage, fullWalletAddress],
  })) as string;
};
```

### useAuth.ts login() (Sorrowz)
```typescript
const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Agentic Dark Pool\n\nURI: ${origin}\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
```

### auth.service.ts verify() (Powerz — needs review)
```typescript
// This is the backend method that receives the signed message
// Need to verify:
// 1. Does it use the `siwe` package to parse the message?
// 2. Does it correctly recover the signing address?
// 3. Does it match against the stored nonce?
// 4. Does it handle both checksummed and lowercase addresses?
```

---

## Production URLs

- **Frontend:** https://www.darkpoolbase.org
- **Backend API:** https://darkpoolsolana-ljque.ondigitalocean.app
- **Nonce endpoint:** GET https://darkpoolsolana-ljque.ondigitalocean.app/api/auth/nonce?address=0x...
- **Verify endpoint:** POST https://darkpoolsolana-ljque.ondigitalocean.app/api/auth/verify

---

## What's NOT Broken

Everything else works:
- Wallet connection (MetaMask, Phantom) ✅
- Landing page wallet UI ✅
- Dashboard wallet gate (blur when not connected) ✅
- Orders API (CRUD, validation, pagination) ✅
- Matching engine (batch auction) ✅
- Settlement service ✅
- Market data endpoints ✅
- Smart contracts deployed on Base mainnet ✅
- Frontend connected to production API ✅

**Only SIWE authentication is broken**, which blocks authenticated operations (order submission, order listing for specific users).
