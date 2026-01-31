import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

const members = [
    { address: '0x1111111111111111111111111111111111111111', secret: 'secret1' },
    { address: '0x2222222222222222222222222222222222222222', secret: 'secret2' },
    { address: '0x3333333333333333333333333333333333333333', secret: 'secret3' },
    { address: '0x4444444444444444444444444444444444444444', secret: 'secret4' },
    { address: '0x5555555555555555555555555555555555555555', secret: 'secret5' }
];

async function post(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function get(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function runTests() {
    console.log('🚀 Starting Integration Tests...');

    // 1. Health Check
    try {
        console.log('\nTesting /health...');
        const health = await get(`${BASE_URL}/health`);
        assert.strictEqual(health.status, 'ok');
        console.log('✅ Health check passed');
    } catch (e) {
        console.error('❌ Health check failed:', e.message);
        process.exit(1);
    }

    // 2. Setup Council
    try {
        console.log('\nTesting /council/setup...');
        const setup = await post(`${BASE_URL}/council/setup`, { members });
        assert.strictEqual(setup.success, true);
        assert.strictEqual(setup.memberCount, 5);
        console.log('✅ Council setup passed');
    } catch (e) {
        console.error('❌ Council setup failed:', e.message);
        process.exit(1);
    }

    // 3. Submit Votes
    console.log('\nTesting /vote (Voting for Quorum)...');
    const bundleId = 123;
    const proposalId = 456;

    // Vote 1
    try {
        const res1 = await post(`${BASE_URL}/vote`, {
            bundleId, proposalId,
            voterAddress: members[0].address,
            vote: 1,
            signature: '0xmocksignature',
            nullifier: '0xnullifier1'
        });
        assert.strictEqual(res1.success, true);
        assert.strictEqual(res1.quorumReached, false);
        console.log('✅ Vote 1 passed');
    } catch (e) {
        console.error('❌ Vote 1 failed:', e.message);
        process.exit(1);
    }

    // Vote 2
    try {
        const res2 = await post(`${BASE_URL}/vote`, {
            bundleId, proposalId,
            voterAddress: members[1].address,
            vote: 1,
            signature: '0xmocksignature',
            nullifier: '0xnullifier2'
        });
        assert.strictEqual(res2.success, true);
        assert.strictEqual(res2.quorumReached, false);
        console.log('✅ Vote 2 passed');
    } catch (e) {
        console.error('❌ Vote 2 failed:', e.message);
        process.exit(1);
    }

    // Vote 3 (Quorum Trigger)
    try {
        console.log('Submitting 3rd vote (should trigger proof generation)...');
        const res3 = await post(`${BASE_URL}/vote`, {
            bundleId, proposalId,
            voterAddress: members[2].address,
            vote: 1,
            signature: '0xmocksignature',
            nullifier: '0xnullifier3'
        });
        assert.strictEqual(res3.success, true);
        assert.strictEqual(res3.quorumReached, true);
        assert.ok(res3.proof, 'Proof should be present in response');
        console.log('✅ Vote 3 passed & Proof Generated!');
        // console.log('Proof Public Signals:', res3.proof); // Avoid spamming output
    } catch (e) {
        console.error('❌ Vote 3 failed:', e.message);
        process.exit(1);
    }

    // 4. Verify Vote Status
    try {
        console.log('\nTesting /votes/:id/:id...');
        const status = await get(`${BASE_URL}/votes/${bundleId}/${proposalId}`);
        assert.strictEqual(status.approvals, 3);
        assert.strictEqual(status.quorumReached, true);
        console.log('✅ Vote status check passed');
    } catch (e) {
        console.error('❌ Vote status check failed:', e.message);
    }

    console.log('\n🎉 All tests passed successfully!');
}

runTests();
