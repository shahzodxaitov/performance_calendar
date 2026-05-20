
const { performance } = require('perf_hooks');

// Mock data generation
function generateLeads(count) {
  const leads = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000); // random date in last 10 days
    leads.push({
      id: `id-${i}`,
      created_at: date.toISOString(),
      company_id: Math.random() > 0.5 ? 'c1' : 'c2'
    });
  }
  return leads;
}

const COUNT = 10000;
const leads = generateLeads(COUNT);
const startTimestamp = new Date(new Date().setHours(0,0,0,0)).getTime();
const startISO = new Date(new Date().setHours(0,0,0,0)).toISOString();

console.log(`Benchmarking with ${COUNT} leads...\n`);

// 1. ORIGINAL APPROACH
const startOriginal = performance.now();
const filteredOriginal = leads.filter(l => new Date(l.created_at).getTime() >= startTimestamp);
filteredOriginal.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
const endOriginal = performance.now();
console.log(`Original approach: ${(endOriginal - startOriginal).toFixed(4)}ms`);

// 2. OPTIMIZED APPROACH
const startOptimized = performance.now();
const filteredOptimized = leads.filter(l => l.created_at >= startISO);
filteredOptimized.sort((a, b) => {
    if (a.created_at < b.created_at) return 1;
    if (a.created_at > b.created_at) return -1;
    return 0;
});
const endOptimized = performance.now();
console.log(`Optimized approach: ${(endOptimized - startOptimized).toFixed(4)}ms`);

const improvement = ((endOriginal - startOriginal) / (endOptimized - startOptimized)).toFixed(2);
console.log(`\nOptimization is ~${improvement}x faster`);
