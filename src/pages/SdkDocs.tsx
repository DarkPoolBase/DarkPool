import { useState } from 'react';

const SDK_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tee-compute', label: 'TEE Compute' },
  { id: 'zk-circuits', label: 'ZK Circuits' },
  { id: 'compliance', label: 'Privacy Compliance' },
  { id: 'guides', label: 'Integration Guides' },
] as const;

// Overview section content
const OverviewSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">ADP Privacy-as-a-Service SDK</h2>
      <p className="text-gray-400">Build privacy-preserving applications on Base with the Agentic Dark Pool SDK suite.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { name: '@adp/tee-compute', desc: 'Submit and manage confidential compute jobs in TEE enclaves', install: 'npm install @adp/tee-compute' },
        { name: '@adp/zk-circuits', desc: 'Pre-built ZK proof templates for balance, order, identity, and dataset privacy', install: 'npm install @adp/zk-circuits' },
        { name: 'Privacy Compliance API', desc: 'ZK-based regulatory compliance for AML, KYC, and tax reporting', install: 'REST API — no installation needed' },
      ].map(pkg => (
        <div key={pkg.name} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-1">{pkg.name}</h3>
          <p className="text-sm text-gray-400 mb-3">{pkg.desc}</p>
          <code className="text-xs text-green-400 bg-gray-900 px-2 py-1 rounded">{pkg.install}</code>
        </div>
      ))}
    </div>
  </div>
);

// TEE Compute section with code examples
const TeeComputeSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">@adp/tee-compute</h2>
    <p className="text-gray-400">Submit confidential compute jobs to Trusted Execution Environment nodes.</p>

    <div>
      <h3 className="text-lg font-semibold text-white mb-2">Quick Start</h3>
      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-300">{`import { TeeClient } from '@adp/tee-compute';

const tee = new TeeClient({
  baseUrl: 'https://api.darkpool.base.org',
  apiKey: 'adp_your_key_here',
});

// Submit a confidential compute job
const job = await tee.submit({
  container: 'my-private-ml-model:latest',
  encryptedInput: inputBuffer,
  gpuType: 'H100',
  maxDuration: 3600,
});

// Poll until complete
const result = await tee.pollUntilComplete(job.id);
console.log('Encrypted result:', result.encryptedResult);
console.log('Proof hash:', result.proofHash);`}</code>
      </pre>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-2">API Reference</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr><th className="py-2 pr-4">Method</th><th className="py-2 pr-4">Description</th><th className="py-2">Returns</th></tr>
          </thead>
          <tbody className="text-gray-300">
            {[
              ['submit(params)', 'Submit a new compute job', 'Promise<TeeJob>'],
              ['getStatus(jobId)', 'Get job status', 'Promise<TeeJob>'],
              ['getResult(jobId)', 'Get encrypted result', 'Promise<TeeJobResult>'],
              ['cancel(jobId)', 'Cancel a pending job', 'Promise<TeeJob>'],
              ['listJobs(page, limit)', 'List your jobs', 'Promise<PaginatedResponse<TeeJob>>'],
              ['listNodes()', 'List active TEE nodes', 'Promise<TeeNode[]>'],
              ['pollUntilComplete(jobId, interval, timeout)', 'Poll until job completes', 'Promise<TeeJobResult>'],
            ].map(([method, desc, returns]) => (
              <tr key={method} className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-green-400">{method}</td>
                <td className="py-2 pr-4">{desc}</td>
                <td className="py-2 font-mono text-blue-400">{returns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ZK Circuits section
const ZkCircuitsSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">@adp/zk-circuits</h2>
    <p className="text-gray-400">Pre-built zero-knowledge proof templates for common privacy use cases.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { name: 'Private Balance Proof', desc: 'Prove balance >= threshold without revealing exact amount', circuit: 'private_balance' },
        { name: 'Private Order Commitment', desc: 'Commit to order parameters without revealing side/price/quantity', circuit: 'private_order' },
        { name: 'Private Identity Verification', desc: 'Prove KYC status without revealing personal information', circuit: 'private_identity' },
        { name: 'Private Dataset Proof', desc: 'Prove dataset properties without revealing contents', circuit: 'private_dataset' },
      ].map(c => (
        <div key={c.circuit} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-1">{c.name}</h3>
          <p className="text-sm text-gray-400 mb-2">{c.desc}</p>
          <code className="text-xs text-purple-400 bg-gray-900 px-2 py-1 rounded">Circuit: {c.circuit}</code>
        </div>
      ))}
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-2">Usage Example</h3>
      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-300">{`import { ZKTemplates, ProofType } from '@adp/zk-circuits';

// Get circuit metadata
const balanceCircuit = ZKTemplates.balanceProof();
console.log(balanceCircuit.name);         // "Private Balance Proof"
console.log(balanceCircuit.publicInputs); // ["balance_hash", "threshold"]

// List all available templates
const all = ZKTemplates.all();
console.log(all.map(t => t.name));

// Look up by type
const orderCircuit = ZKTemplates.byType(ProofType.Order);`}</code>
      </pre>
    </div>
  </div>
);

// Compliance section
const ComplianceSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">Privacy Compliance API</h2>
    <p className="text-gray-400">ZK-based regulatory compliance without revealing underlying data.</p>

    <div>
      <h3 className="text-lg font-semibold text-white mb-2">Supported Jurisdictions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr><th className="py-2 pr-4">Jurisdiction</th><th className="py-2 pr-4">Framework</th><th className="py-2 pr-4">AML</th><th className="py-2 pr-4">KYC</th><th className="py-2">Tax</th></tr>
          </thead>
          <tbody className="text-gray-300">
            {[
              ['EU', 'MiCA', 'Required', 'Required', 'Optional'],
              ['US', 'SEC/CFTC', 'Required', 'Required', 'Required'],
              ['SG', 'MAS', 'Required', 'Required', 'Optional'],
            ].map(([j, f, a, k, t]) => (
              <tr key={j} className="border-b border-gray-800">
                <td className="py-2 pr-4 font-semibold">{j}</td>
                <td className="py-2 pr-4">{f}</td>
                <td className="py-2 pr-4">{a}</td>
                <td className="py-2 pr-4">{k}</td>
                <td className="py-2">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-2">API Endpoints</h3>
      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-300">{`POST /api/compliance/proofs          Submit a compliance proof
GET  /api/compliance/proofs          List your proofs
GET  /api/compliance/proofs/:id      Get proof details
GET  /api/compliance/check/:userId   Check compliance status
GET  /api/compliance/jurisdictions   List jurisdiction configs`}</code>
      </pre>
    </div>
  </div>
);

// Integration Guides section
const GuidesSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">Integration Guides</h2>

    <div className="space-y-4">
      {[
        {
          title: 'Base Paymaster — Gas-Abstracted Privacy Transactions',
          content: `Use the Base Paymaster integration to sponsor gas for your users' privacy transactions.

POST /api/sdk-integrations/sponsor
{
  "userAddress": "0x...",
  "txData": { "to": "0x...", "data": "0x...", "value": "0" }
}

The paymaster will cover gas fees, allowing users to submit ZK proofs and TEE jobs without holding ETH.`,
        },
        {
          title: 'Coinbase Verifications — Provider Identity Attestations',
          content: `Integrate Coinbase Verifications for trusted provider KYC/KYB attestations.

1. Provider completes verification through Coinbase
2. Attestation is recorded on-chain via Base
3. Submit the attestation as an identity proof:

POST /api/compliance/proofs
{
  "proofType": "KYC",
  "jurisdiction": "US",
  "proofHash": "0x...",
  "publicInputsHash": "0x..."
}`,
        },
        {
          title: 'Ecosystem Grants — Build with ADP SDK',
          content: `Apply for Coinbase Ventures / Base Ecosystem grants to build privacy-preserving applications.

POST /api/sdk-integrations/grants
{
  "projectName": "My Privacy DApp",
  "projectDescription": "A privacy-preserving DEX aggregator using ADP ZK circuits",
  "grantAmount": "50000"
}`,
        },
      ].map(guide => (
        <div key={guide.title} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">{guide.title}</h3>
          <pre className="bg-gray-900 rounded p-3 overflow-x-auto">
            <code className="text-sm text-gray-300 whitespace-pre-wrap">{guide.content}</code>
          </pre>
        </div>
      ))}
    </div>
  </div>
);

const SECTIONS: Record<string, () => JSX.Element> = {
  'overview': OverviewSection,
  'tee-compute': TeeComputeSection,
  'zk-circuits': ZkCircuitsSection,
  'compliance': ComplianceSection,
  'guides': GuidesSection,
};

export default function SdkDocs() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const ActiveSection = SECTIONS[activeTab] || OverviewSection;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">SDK Documentation</h1>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SDK_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ActiveSection />
      </div>
    </div>
  );
}
