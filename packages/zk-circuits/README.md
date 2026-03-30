# ZK Circuits

Noir zero-knowledge proof circuits for the Agentic Dark Pool protocol.

## Circuits

### differential_privacy
Proves a dataset meets epsilon-delta differential privacy standards without revealing the underlying data. Critical for healthcare and finance datasets where regulatory compliance is mandatory.

### order_commitment
Proves knowledge of order parameters (GPU type, quantity, price, duration) committed to a hash, without revealing the parameters.

### settlement_proof
Proves the batch auction clearing was computed correctly: the clearing price is valid and all matched orders are legitimate.

## Prerequisites

- [Noir](https://noir-lang.org/) (latest)
- [Nargo](https://noir-lang.org/docs/getting_started/installation/) CLI

## Usage

```bash
cd differential_privacy
nargo compile
nargo test
```
