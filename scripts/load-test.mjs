const TARGET = process.env.LOAD_TEST_URL ?? "http://localhost:3000";
const CONCURRENCY = parseInt(process.env.LOAD_TEST_CONCURRENCY ?? "10", 10);
const REQUESTS = parseInt(process.env.LOAD_TEST_REQUESTS ?? "50", 10);

const ENDPOINTS = [
  { path: "/", name: "Landing page", method: "GET" },
  { path: "/pricing", name: "Pricing page", method: "GET" },
  { path: "/features", name: "Features page", method: "GET" },
  { path: "/api/billing/plans", name: "Plans API", method: "GET" },
];

const results = [];

async function bench(endpoint) {
  const url = `${TARGET}${endpoint.path}`;
  const start = performance.now();
  let status = 0;
  try {
    const res = await fetch(url, { method: endpoint.method, signal: AbortSignal.timeout(10000) });
    status = res.status;
  } catch {
    status = 0;
  }
  const duration = performance.now() - start;
  results.push({ ...endpoint, duration, status, url });
}

async function run() {
  console.log(`\nLoad Test: ${TARGET}`);
  console.log(`Concurrency: ${CONCURRENCY}, Requests per endpoint: ${REQUESTS}\n`);

  for (const endpoint of ENDPOINTS) {
    const start = performance.now();
    const batch = [];
    for (let i = 0; i < REQUESTS; i += CONCURRENCY) {
      const chunk = Array.from({ length: Math.min(CONCURRENCY, REQUESTS - i) }, () => bench(endpoint));
      batch.push(...chunk);
    }
    await Promise.all(batch);

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    const endpointResults = results.filter((r) => r.path === endpoint.path);
    const durations = endpointResults.map((r) => r.duration);
    const successes = endpointResults.filter((r) => r.status >= 200 && r.status < 400).length;
    const failures = endpointResults.filter((r) => r.status === 0 || r.status >= 400).length;
    const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0);
    const min = Math.min(...durations).toFixed(0);
    const max = Math.max(...durations).toFixed(0);
    const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)].toFixed(0);

    console.log(`${endpoint.name}`);
    console.log(`  ${successes}/${REQUESTS} successful in ${elapsed}s`);
    console.log(`  avg: ${avg}ms | min: ${min}ms | max: ${max}ms | p95: ${p95}ms`);
    if (failures > 0) {
      console.log(`  FAILURES: ${failures}`);
    }
    console.log();
  }

  const totalSuccess = results.filter((r) => r.status >= 200 && r.status < 400).length;
  const totalFailures = results.filter((r) => r.status === 0 || r.status >= 400).length;
  console.log(`=== Summary ===`);
  console.log(`Total: ${totalSuccess + totalFailures} requests`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Failed: ${totalFailures}`);
  console.log(`Success rate: ${((totalSuccess / (totalSuccess + totalFailures)) * 100).toFixed(1)}%`);
}

run().catch(console.error);
