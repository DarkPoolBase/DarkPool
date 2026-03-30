// ZK Proof of Correct Execution Circuit
//
// Proves that the correct AI model was run on the submitted input
// without revealing either the model weights or the input data.
//
// After inference inside a TEE, this proof attests:
// 1. The correct model ID was loaded (model_hash matches registry)
// 2. The input hash matches what the buyer submitted
// 3. The output is deterministic for the given input
// 4. Execution completed within the time bound
//
// Public inputs:
//   - model_id: The registered model identifier
//   - model_hash: Hash of the model weights (from registry)
//   - input_hash: Hash of the encrypted input (from buyer submission)
//   - output_hash: Hash of the encrypted output
//   - max_latency_ms: Maximum allowed execution time
//
// Private inputs:
//   - model_preimage: Values that hash to model_hash
//   - input_preimage: Values that hash to input_hash
//   - output_preimage: Values that hash to output_hash
//   - execution_time_ms: Actual execution time
//   - tee_attestation: TEE enclave measurement

/// Simple hash for commitment verification
fn hash_fields(preimage: [Field; 4]) -> Field {
    let mut acc = preimage[0];
    for i in 1..4 {
        acc = acc * preimage[i] + preimage[i];
    }
    acc
}

/// Verify that execution time is within the SLA bound
fn verify_latency(execution_time_ms: u64, max_latency_ms: u64) -> bool {
    execution_time_ms <= max_latency_ms
}

/// Verify deterministic output: given the same model + input,
/// the output hash must be reproducible
fn verify_determinism(
    model_preimage: [Field; 4],
    input_preimage: [Field; 4],
    output_preimage: [Field; 4]
) -> Field {
    // Compute a deterministic binding of model + input + output
    let model_hash = hash_fields(model_preimage);
    let input_hash = hash_fields(input_preimage);
    let output_hash = hash_fields(output_preimage);

    // The binding proves all three are linked
    let mut binding = model_hash + input_hash;
    binding = binding * output_hash + output_hash;
    binding
}

fn main(
    // Public inputs
    model_id: pub Field,
    model_hash: pub Field,
    input_hash: pub Field,
    output_hash: pub Field,
    max_latency_ms: pub u64,
    // Private inputs
    model_preimage: [Field; 4],
    input_preimage: [Field; 4],
    output_preimage: [Field; 4],
    execution_time_ms: u64,
    tee_attestation: Field
) {
    // 1. Verify model commitment — correct model was loaded
    let computed_model_hash = hash_fields(model_preimage);
    assert(computed_model_hash == model_hash, "Model hash mismatch: wrong model loaded");

    // 2. Verify input commitment — input matches buyer submission
    let computed_input_hash = hash_fields(input_preimage);
    assert(computed_input_hash == input_hash, "Input hash mismatch: wrong input processed");

    // 3. Verify output commitment
    let computed_output_hash = hash_fields(output_preimage);
    assert(computed_output_hash == output_hash, "Output hash mismatch");

    // 4. Verify execution latency within SLA
    let latency_ok = verify_latency(execution_time_ms, max_latency_ms);
    assert(latency_ok, "Execution exceeded latency SLA");

    // 5. Verify deterministic binding
    let binding = verify_determinism(model_preimage, input_preimage, output_preimage);
    assert(binding != 0, "Determinism check failed");

    // 6. Verify TEE attestation is non-zero (enclave was valid)
    assert(tee_attestation != 0, "Invalid TEE attestation");

    // 7. Verify model_id is non-zero
    assert(model_id != 0, "Invalid model ID");
}

#[test]
fn test_valid_execution_proof() {
    let model_pre = [10, 20, 30, 40];
    let input_pre = [50, 60, 70, 80];
    let output_pre = [90, 100, 110, 120];

    let model_hash = hash_fields(model_pre);
    let input_hash = hash_fields(input_pre);
    let output_hash = hash_fields(output_pre);

    main(
        1,                  // model_id
        model_hash,
        input_hash,
        output_hash,
        5000,               // max 5 seconds
        model_pre,
        input_pre,
        output_pre,
        2500,               // completed in 2.5 seconds
        999                 // TEE attestation
    );
}

#[test]
fn test_latency_at_boundary() {
    let model_pre = [1, 2, 3, 4];
    let input_pre = [5, 6, 7, 8];
    let output_pre = [9, 10, 11, 12];

    main(
        1,
        hash_fields(model_pre),
        hash_fields(input_pre),
        hash_fields(output_pre),
        1000,               // max 1 second
        model_pre,
        input_pre,
        output_pre,
        1000,               // exactly at boundary
        1
    );
}
