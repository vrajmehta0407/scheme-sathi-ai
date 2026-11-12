import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { seedSchemes } from './seed-schemes';
import { generateSyntheticPopulation } from './generate-population';
import { loadBundleDataFromDisk } from '../apps/web/lib/db/catalogue';
import { runAdminQualityCheck } from '../apps/web/lib/admin';

function ensureAuthSecret() {
  const envPath = path.resolve(process.cwd(), 'apps/web/.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('AUTH_SECRET=')) {
      console.log('AUTH_SECRET already exists in apps/web/.env.local');
      return;
    }
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.appendFileSync(envPath, `\nAUTH_SECRET=${secret}\n`, 'utf8');
  console.log('Generated local AUTH_SECRET in apps/web/.env.local (no external keys used).');
}

function main() {
  console.log('--- Scheme Sathi AI: One-Command Setup ---');
  ensureAuthSecret();

  const { schemeCount, docCount } = seedSchemes();
  console.log(`Seeded ${schemeCount} sample schemes and ${docCount} canonical documents.`);

  const popCount = generateSyntheticPopulation(20000);
  console.log(`Seeded ${popCount} synthetic households (is_synthetic=1).`);

  const { schemes } = loadBundleDataFromDisk();
  const report = runAdminQualityCheck(schemes);
  console.log(
    `Admin Quality Check: ${report.passed ? 'PASSED' : 'FAILED'} (${report.errorCount} errors, ${report.warningCount} warnings)`
  );
  if (!report.passed) {
    console.error(report.issues);
    process.exit(1);
  }
  console.log('Setup complete! Run `npm run dev` to launch Scheme Sathi AI.');
}

main();

