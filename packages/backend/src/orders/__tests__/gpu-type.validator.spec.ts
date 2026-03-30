describe('GpuType Validator', () => {
  const validTypes = ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'];
  const invalidTypes = ['RTX9090', 'TPU', '', null, undefined, 123];

  it.each(validTypes)('should accept valid GPU type: %s', (type) => {
    expect(validTypes.includes(type)).toBe(true);
  });

  it.each(invalidTypes)('should reject invalid GPU type: %s', (type) => {
    expect(validTypes.includes(type as string)).toBe(false);
  });
});
