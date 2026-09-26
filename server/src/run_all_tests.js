import { execSync } from 'child_process';

const testScripts = [
  { name: 'Authentication Module', file: 'src/test_auth.js' },
  { name: 'Warehouses & Locations Module', file: 'src/test_warehouses.js' },
  { name: 'Products & Categories Module', file: 'src/test_products.js' },
  { name: 'Receipts (Incoming Stock) Module', file: 'src/test_receipts.js' },
  { name: 'Deliveries (Outgoing Stock) Module', file: 'src/test_deliveries.js' },
  { name: 'Internal Transfers Module', file: 'src/test_transfers.js' },
  { name: 'Stock Adjustments Module', file: 'src/test_adjustments.js' },
  { name: 'Stock Ledger Module', file: 'src/test_ledger.js' },
  { name: 'Low Stock Alerts Module', file: 'src/test_alerts.js' },
  { name: 'Dashboard Analytics Module', file: 'src/test_dashboard.js' },
  { name: 'Reports & Export Module', file: 'src/test_reports.js' },
  { name: 'AI Inventory Assistant Module', file: 'src/test_ai_assistant.js' },
  { name: 'AI Reorder Predictions Module', file: 'src/test_reorder_predictions.js' }
];

console.log('====================================================');
console.log('   STOCKSENSE INTEGRATED SYSTEM TEST SUITE RUNNER  ');
console.log('====================================================\n');

const results = [];
let passedCount = 0;
let failedCount = 0;

for (const test of testScripts) {
  console.log(`▶ Running ${test.name} (${test.file})...`);
  try {
    const output = execSync(`node ${test.file}`, { encoding: 'utf-8', cwd: process.cwd() });
    console.log(`✅ PASSED: ${test.name}`);
    results.push({ name: test.name, status: 'PASSED', error: null });
    passedCount++;
  } catch (error) {
    console.error(`❌ FAILED: ${test.name}`);
    console.error(error.stdout || error.stderr || error.message);
    results.push({ name: test.name, status: 'FAILED', error: error.message });
    failedCount++;
  }
  console.log('----------------------------------------------------');
}

console.log('\n====================================================');
console.log('               SUMMARY TEST RESULTS                 ');
console.log('====================================================');
console.log(`Total Test Modules: ${testScripts.length}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);
console.log('====================================================\n');

results.forEach((r, idx) => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`${idx + 1}. ${icon} ${r.name}: ${r.status}`);
});

if (failedCount > 0) {
  process.exit(1);
}
