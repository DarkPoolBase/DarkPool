// Contract ABIs for on-chain interaction via viem

export const DARKPOOL_ABI = [
  {
    type: 'function',
    name: 'submitOrder',
    inputs: [
      { name: 'commitment', type: 'bytes32' },
      { name: 'escrowAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'orderId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelOrder',
    inputs: [{ name: 'orderId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getOrder',
    inputs: [{ name: 'orderId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'trader', type: 'address' },
          { name: 'side', type: 'uint8' },
          { name: 'escrowAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'batchId', type: 'uint256' },
          { name: 'clearingPrice', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCurrentBatchId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'protocolFeeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'OrderSubmitted',
    inputs: [
      { name: 'orderId', type: 'bytes32', indexed: true },
      { name: 'trader', type: 'address', indexed: true },
      { name: 'escrowAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'OrderCancelled',
    inputs: [
      { name: 'orderId', type: 'bytes32', indexed: true },
      { name: 'trader', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'OrderFilled',
    inputs: [
      { name: 'orderId', type: 'bytes32', indexed: true },
      { name: 'clearingPrice', type: 'uint256', indexed: false },
      { name: 'batchId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BatchSettled',
    inputs: [
      { name: 'batchId', type: 'uint256', indexed: true },
      { name: 'clearingPrice', type: 'uint256', indexed: false },
      { name: 'matchedVolume', type: 'uint256', indexed: false },
      { name: 'protocolFee', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ESCROW_ABI = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getBalance',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'available', type: 'uint256' },
      { name: 'locked', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;
