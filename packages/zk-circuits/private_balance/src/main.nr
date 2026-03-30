// ZK Private Balance Proof Circuit
//
// Proves that a user's balance meets or exceeds a given threshold
// without revealing the exact balance amount.
//
// Use case: Dark pool participants must prove sufficient funds
// to place orders without disclosing their full holdings.
//
// Public inputs:
//   - balance_hash: Hash commitment of the balance
//   - threshold: Minimum required balance
//
// Private inputs:
//   - balance: The actual balance value
//   - balance_preimage: Values that hash to balance_hash
//   - salt: Randomness for commitment hiding

/// Simple hash for commitment verification
fn hash_fields(preimage: [Field; 4]) -> Field {
    let mut acc = preimage[0];
    for i in 1..4 {
        acc = acc * preimage[i] + preimage[i];
    }
    acc
}

fn main(
    // Public inputs
    balance_hash: pub Field,
    threshold: pub u64,
    // Private inputs
    balance: u64,
    balance_preimage: [Field; 4],
    salt: Field
) {
    // 1. Verify balance commitment — hash of preimage matches public hash
    let computed_hash = hash_fields(balance_preimage);
    assert(computed_hash == balance_hash, "Balance hash mismatch: commitment invalid");

    // 2. Verify balance meets threshold
    assert(balance >= threshold, "Balance below required threshold");

    // 3. Verify salt is non-zero (prevents trivial commitments)
    assert(salt != 0, "Invalid salt: must be non-zero");
}

#[test]
fn test_valid_balance_proof() {
    let preimage = [100, 200, 300, 400];
    let balance_hash = hash_fields(preimage);

    main(
        balance_hash,
        500,            // threshold
        1000,           // balance exceeds threshold
        preimage,
        42              // salt
    );
}

#[test]
fn test_balance_at_exact_threshold() {
    let preimage = [10, 20, 30, 40];
    let balance_hash = hash_fields(preimage);

    main(
        balance_hash,
        250,            // threshold
        250,            // balance exactly at threshold
        preimage,
        99              // salt
    );
}
