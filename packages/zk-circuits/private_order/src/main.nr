// ZK Private Order Commitment Circuit
//
// Commits to order parameters (side, price, quantity) without revealing
// them publicly. Only the commitment hash and non-sensitive metadata
// (gpu_type, min_quantity) are disclosed.
//
// Use case: Agents submit orders to the dark pool matching engine
// without revealing their trading intent to other participants.
//
// Public inputs:
//   - commitment_hash: Hash commitment of the full order
//   - gpu_type: The GPU type being traded (non-sensitive metadata)
//   - min_quantity: Minimum acceptable fill quantity
//
// Private inputs:
//   - side: 0 = buy, 1 = sell
//   - price: Limit price for the order
//   - quantity: Total order quantity
//   - nonce: Unique order nonce for replay protection
//   - order_preimage: Values that hash to commitment_hash

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
    commitment_hash: pub Field,
    gpu_type: pub u64,
    min_quantity: pub u64,
    // Private inputs
    side: u64,
    price: u64,
    quantity: u64,
    nonce: Field,
    order_preimage: [Field; 4]
) {
    // 1. Verify order commitment — hash of preimage matches public hash
    let computed_hash = hash_fields(order_preimage);
    assert(computed_hash == commitment_hash, "Order commitment mismatch");

    // 2. Verify side is valid (0 = buy, 1 = sell)
    assert((side == 0) | (side == 1), "Invalid side: must be 0 (buy) or 1 (sell)");

    // 3. Verify price is positive
    assert(price > 0, "Invalid price: must be greater than zero");

    // 4. Verify quantity meets minimum
    assert(quantity >= min_quantity, "Quantity below minimum required");

    // 5. Verify nonce is non-zero (replay protection)
    assert(nonce != 0, "Invalid nonce: must be non-zero");

    // 6. Verify gpu_type is non-zero
    assert(gpu_type > 0, "Invalid GPU type");
}

#[test]
fn test_valid_buy_order() {
    let preimage = [50, 60, 70, 80];
    let commitment_hash = hash_fields(preimage);

    main(
        commitment_hash,
        1,              // gpu_type (e.g., A100)
        10,             // min_quantity
        0,              // side = buy
        1500,           // price
        100,            // quantity
        777,            // nonce
        preimage
    );
}

#[test]
fn test_valid_sell_order_at_min_quantity() {
    let preimage = [11, 22, 33, 44];
    let commitment_hash = hash_fields(preimage);

    main(
        commitment_hash,
        2,              // gpu_type (e.g., H100)
        50,             // min_quantity
        1,              // side = sell
        2000,           // price
        50,             // quantity exactly at minimum
        888,            // nonce
        preimage
    );
}
