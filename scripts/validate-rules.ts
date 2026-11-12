import { loadBundleDataFromDisk } from '../apps/web/lib/db/catalogue';
import { runAdminQualityCheck } from '../apps/web/lib/admin';

const { schemes } = loadBundleDataFromDisk();
const report = runAdminQualityCheck(schemes);

console.log(`Checked ${report.checkedSchemes} schemes.`);
console.log(`Errors: ${report.errorCount}, Warnings: ${report.warningCount}`);
for (const g of report.goldenResults) {
  console.log(`  [${g.passed ? 'PASS' : 'FAIL'}] ${g.name}: ${g.details}`);
}
if (report.issues.length > 0) {
  for (const issue of report.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.schemeId}: ${issue.message}`);
  }
}

if (!report.passed) {
  process.exit(1);
}

