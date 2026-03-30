// ZK Private Dataset Proof Circuit
//
// Proves that a dataset meets specified quality and format requirements
// without revealing its actual contents or detailed metadata.
//
// Use case: Data providers in the dark pool prove their datasets
// meet buyer requirements (size, quality, format) before any data
// is exchanged or payment is committed.
//
// Public inputs:
//   - dataset_hash: Hash commitment of the dataset metadata
//   - min_size_gb: Minimum required dataset size in GB
//   - min_quality_score: Minimum quality score (0-100)
//   - required_format: Required data format identifier
//
// Private inputs:
//   - actual_size_gb: Actual dataset size in GB
//   - quality_score: Actual quality score
//   - format_id: Actual format identifier
//   - record_count: Number of records in the dataset
//   - dataset_preimage: Values that hash to dataset_hash

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
    dataset_hash: pub Field,
    min_size_gb: pub u64,
    min_quality_score: pub u64,
    required_format: pub u64,
    // Private inputs
    actual_size_gb: u64,
    quality_score: u64,
    format_id: u64,
    record_count: u64,
    dataset_preimage: [Field; 4]
) {
    // 1. Verify dataset commitment — hash of preimage matches public hash
    let computed_hash = hash_fields(dataset_preimage);
    assert(computed_hash == dataset_hash, "Dataset hash mismatch: commitment invalid");

    // 2. Verify dataset size meets minimum
    assert(actual_size_gb >= min_size_gb, "Dataset size below minimum required");

    // 3. Verify quality score meets minimum
    assert(quality_score >= min_quality_score, "Quality score below minimum required");

    // 4. Verify format matches required format
    assert(format_id == required_format, "Dataset format does not match required format");

    // 5. Verify record count is positive
    assert(record_count > 0, "Dataset must contain at least one record");
}

#[test]
fn test_valid_dataset_proof() {
    let preimage = [1000, 2000, 3000, 4000];
    let dataset_hash = hash_fields(preimage);

    main(
        dataset_hash,
        100,            // min_size_gb
        80,             // min_quality_score
        1,              // required_format (e.g., Parquet)
        500,            // actual_size_gb (exceeds min)
        95,             // quality_score (exceeds min)
        1,              // format_id matches
        1000000,        // record_count
        preimage
    );
}

#[test]
fn test_dataset_at_exact_minimums() {
    let preimage = [7, 14, 21, 28];
    let dataset_hash = hash_fields(preimage);

    main(
        dataset_hash,
        50,             // min_size_gb
        70,             // min_quality_score
        2,              // required_format (e.g., CSV)
        50,             // actual_size_gb exactly at min
        70,             // quality_score exactly at min
        2,              // format_id matches
        1,              // record_count (minimum valid)
        preimage
    );
}
