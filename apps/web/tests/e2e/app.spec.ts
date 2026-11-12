import { test, expect } from '@playwright/test';

test('end-to-end citizen and analytics journey with language switching', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your schemes\. Found\./i })).toBeVisible();

  // Switch language to Hindi and Gujarati
  await page.getByRole('button', { name: 'hi', exact: true }).click();
  await expect(page.getByText(/आपकी योजनाएं/)).toBeVisible();
  await page.getByRole('button', { name: 'en', exact: true }).click();

  // Wizard flow
  await page.goto('/wizard');
  await page.getByRole('button', { name: 'farmer', exact: true }).click();
  await page.getByRole('button', { name: /Save & Next/i }).click();

  // Scheme Board & Detail
  await page.goto('/schemes');
  await expect(page.getByRole('heading', { name: /Scheme Explorer Board/i })).toBeVisible();
  await page.getByRole('link', { name: /PM-KISAN Farmer Income Support/i }).first().click();
  await expect(page.getByText(/Rule-by-Rule Breakdown/i)).toBeVisible();

  // What-If Simulator
  await page.goto('/what-if');
  await expect(page.getByRole('heading', { name: /What-If Eligibility Simulator/i })).toBeVisible();

  // Document Wallet
  await page.goto('/documents');
  await expect(page.getByRole('heading', { name: /Document Wallet/i })).toBeVisible();

  // Analytics Workbench
  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: /Policy & Coverage Analytics Workbench/i })).toBeVisible();
  await expect(page.getByText(/Synthetic data/i).first()).toBeVisible();
});

