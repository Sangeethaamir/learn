/**
 * ============================================================
 * playwright.config.ts — Master Configuration File
 * ============================================================
 * This file controls EVERYTHING about how Playwright runs:
 * browsers, timeouts, retries, parallelism, reporters, etc.
 *
 * PHASE 1 — Topic 3: Understanding playwright.config.ts
 * ============================================================
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
// PHASE 4 — Topic 20: Environment variables management
dotenv.config({ path: '.env' });

export default defineConfig({
  // ─────────────────────────────────────────────
  // TEST DISCOVERY
  // ─────────────────────────────────────────────

  // Root directory where Playwright looks for test files
  testDir: './tests',

  // File pattern to match test files
  testMatch: '**/*.spec.ts',

  // ─────────────────────────────────────────────
  // PARALLELISM — PHASE 6 — Topic 30
  // ─────────────────────────────────────────────

  // Run all tests in parallel across workers
  fullyParallel: true,

  // Number of parallel workers — uses CPU count by default
  // Set to 4 for CI (lower to avoid resource contention)
  workers: process.env.CI ? 4 : undefined,

  // Shard support — split tests across machines: --shard=1/4
  // Configured via CLI: npx playwright test --shard=1/4

  // ─────────────────────────────────────────────
  // RELIABILITY
  // ─────────────────────────────────────────────

  // Fail the CI build if test.only() is accidentally left in
  forbidOnly: !!process.env.CI,

  // Retry failed tests — 2 retries in CI, 0 locally
  retries: process.env.CI ? 2 : 0,

  // ─────────────────────────────────────────────
  // GLOBAL TIMEOUTS
  // ─────────────────────────────────────────────
  timeout: 60_000,           // Per-test timeout: 60 seconds
  expect: {
    timeout: 10_000,         // Assertion timeout: 10 seconds (auto-wait)
  },

  // ─────────────────────────────────────────────
  // REPORTERS — PHASE 5 — Topic 21
  // ─────────────────────────────────────────────
  reporter: [
    // HTML report: open with `npx playwright show-report`
    ['html', { outputFolder: 'playwright-report', open: 'never' }],

    // JUnit: for Azure DevOps / Jenkins integration
    ['junit', { outputFile: 'reports/junit-results.xml' }],

    // JSON: machine-readable results for custom dashboards
    ['json', { outputFile: 'reports/test-results.json' }],

    // Line: lightweight output in terminal
    ['line'],

    // Allure: rich dashboard with steps, attachments, trends
    // PHASE 7 — Topic 35
    // ['allure-playwright'],
  ],

  // ─────────────────────────────────────────────
  // OUTPUT DIRECTORIES
  // ─────────────────────────────────────────────
  outputDir: 'test-results',   // Screenshots, videos, traces go here

  // ─────────────────────────────────────────────
  // SHARED SETTINGS — Applied to ALL projects
  // ─────────────────────────────────────────────
  use: {
    // Base URL — use relative paths in tests: page.goto('/login')
    baseURL: process.env.BASE_URL || 'https://demowebshop.tricentis.com',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,        // Ignore SSL errors in test environments

    // ─── AUTO-WAIT & NAVIGATION ───
    // Playwright auto-waits for elements to be actionable.
    // This is the KEY difference from Selenium's manual waits.
    actionTimeout: 15_000,         // Max wait per action (click, fill, etc.)
    navigationTimeout: 30_000,     // Max wait for page.goto() to complete

    // ─── SCREENSHOTS — PHASE 5 — Topic 23 ───
    screenshot: 'only-on-failure', // Options: 'off' | 'on' | 'only-on-failure'

    // ─── VIDEO RECORDING — PHASE 5 — Topic 23 ───
    video: 'retain-on-failure',    // Options: 'off' | 'on' | 'retain-on-failure'

    // ─── TRACE — PHASE 5 — Topic 22 ───
    // Trace captures DOM snapshots, network, console, screenshots
    trace: 'retain-on-failure',    // Options: 'off' | 'on' | 'retain-on-failure'

    // ─── LOCALE / TIMEZONE — PHASE 9 — Topic 44 ───
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  // ─────────────────────────────────────────────
  // PROJECTS — Run tests across multiple browsers
  // ─────────────────────────────────────────────
  projects: [
    // ── SETUP PROJECT: Runs authentication once before all tests ──
    // PHASE 9 — Topic 42: Storage State
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // ── CHROMIUM (Google Chrome / Edge) ──
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // ── FIREFOX ──
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    // ── WEBKIT (Safari) ──
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // ── MOBILE CHROME — PHASE 9 — Topic 43 ──
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },

    // ── API TESTS — No browser needed ──
    // PHASE 3 — Topic 14: API Testing
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        baseURL: process.env.BASE_URL || 'https://demowebshop.tricentis.com',
      },
    },
  ],

  // ─────────────────────────────────────────────
  // GLOBAL SETUP / TEARDOWN — runs once per test suite
  // ─────────────────────────────────────────────
  // globalSetup: './config/globalSetup.ts',
  // globalTeardown: './config/globalTeardown.ts',
});
