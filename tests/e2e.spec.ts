import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Smoke - buttons', () => {
  test('Glossary generate and actions', async ({ page }) => {
    await page.goto(`${BASE}/#glossaire`);
    // wait for glossary input
    const input = page.getByPlaceholder('Terme (ex: Promises, Hooks, Middleware)…');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('Promises');
    // click generate
    const gen = page.getByRole('button', { name: 'Générer' });
    await expect(gen).toBeEnabled();
    await gen.click();
    // wait for generated item
    const item = page.getByText(/Promises/i).first();
    await expect(item).toBeVisible({ timeout: 8000 });
    // click copy on first item
    const copyBtn = page.locator('button', { hasText: 'Copier' }).first();
    await copyBtn.click();
    // click Charger
    const loadBtn = page.locator('button', { hasText: 'Charger' }).first();
    await loadBtn.click();
  });

  test('Mentor ask and response', async ({ page }) => {
    await page.goto(BASE + '/');
    // navigate to Mentor section
    await page.getByText('Besoin d\'aide ?').scrollIntoViewIfNeeded();
    const textarea = page.locator('textarea').filter({ hasText: "Ta question" }).first();
    if (await textarea.count() === 0) {
      // fallback: find textarea in Mentor component
      const t = page.locator('textarea').nth(0);
      await t.fill('Hello, explain console.log');
    } else {
      await textarea.fill('Hello, explain console.log');
    }
    const askBtn = page.getByRole('button', { name: /Demander|Analyse…/i }).first();
    await expect(askBtn).toBeEnabled();
    await askBtn.click();
    // wait for assistant reply (local analysis)
    await page.waitForTimeout(1000);
    const mentorReply = page.getByText(/Résumé:/).first();
    await expect(mentorReply).toBeVisible({ timeout: 5000 });
  });

  test('Sandbox run/stop/share', async ({ page }) => {
    await page.goto(BASE + '/practice');
    // wait for sandbox execute button
    const runBtn = page.getByRole('button', { name: /Exécuter|Exécution…/i }).first();
    await expect(runBtn).toBeVisible({ timeout: 5000 });
    // click run
    await runBtn.click();
    // allow a moment
    await page.waitForTimeout(500);
    // stop
    const stopBtn = page.getByRole('button', { name: /Stop/i }).first();
    if (await stopBtn.count()) await stopBtn.click();
    // share
    const shareBtn = page.getByRole('button', { name: /Partager/i }).first();
    if (await shareBtn.count()) await shareBtn.click();
  });

  test('Admin create custom exercise and appears in practice', async ({ page }) => {
    await page.goto(BASE + '/admin');
    await page.getByLabel('Titre').fill('Test Exo E2E');
    await page.getByLabel('Prompt').fill('Affiche 1');
    await page.getByRole('button', { name: 'Créer' }).click();
    // go to practice and check appears
    await page.goto(BASE + '/practice');
    await page.waitForTimeout(500);
    const found = page.getByText('Test Exo E2E').first();
    await expect(found).toBeVisible({ timeout: 5000 });
  });
});
