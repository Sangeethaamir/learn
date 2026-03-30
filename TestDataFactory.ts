/**
 * ============================================================
 * utils/TestDataFactory.ts — Test Data Generator
 * ============================================================
 * Centralised test data creation using Faker.js.
 * Never hardcode test data — generate it dynamically.
 * This prevents flaky tests from duplicate data.
 *
 * PHASE 4 — Topic 29: Managing test data with Faker.js
 * PHASE 6 — Topic 28: Utility / helper classes
 * ============================================================
 */

import { faker } from '@faker-js/faker';

// ─────────────────────────────────────────────
// INTERFACES — TypeScript type definitions
// PHASE 6 — Topic 27: TypeScript interfaces
// ─────────────────────────────────────────────

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: { day: string; month: string; year: string };
}

export interface AddressData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  country: string;
  city: string;
  address: string;
  zip: string;
  phone: string;
}

export interface ProductData {
  name: string;
  description: string;
  price: number;
  sku: string;
  quantity: number;
}

export interface CreditCardData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nameOnCard: string;
}

// ─────────────────────────────────────────────
// ENUM: Environment types
// PHASE 6 — Topic 27: TypeScript enums
// ─────────────────────────────────────────────
export enum Environment {
  DEV = 'development',
  QA = 'qa',
  STAGING = 'staging',
  PROD = 'production',
}

export enum UserRole {
  GUEST = 'guest',
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

// ─────────────────────────────────────────────
// FACTORY CLASS
// ─────────────────────────────────────────────
export class TestDataFactory {

  /**
   * Generate a complete user registration object
   * Every call produces UNIQUE data — no duplicate email conflicts
   */
  static createUser(overrides: Partial<UserData> = {}): UserData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Use timestamp in email to guarantee uniqueness
    const uniqueEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@testmail.com`;

    return {
      firstName,
      lastName,
      email: uniqueEmail,
      // Password that meets common requirements: uppercase, lowercase, number, special char
      password: `Test@${faker.number.int({ min: 1000, max: 9999 })}Abc`,
      phone: faker.phone.number('##########'), // 10 digit number
      dateOfBirth: {
        day: String(faker.number.int({ min: 1, max: 28 })),
        month: String(faker.number.int({ min: 1, max: 12 })),
        year: String(faker.number.int({ min: 1960, max: 2000 })),
      },
      ...overrides, // Allow partial overrides for specific test scenarios
    };
  }

  /**
   * Generate a valid US billing/shipping address
   */
  static createAddress(overrides: Partial<AddressData> = {}): AddressData {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: `addr.${Date.now()}@testmail.com`,
      company: faker.company.name(),
      country: 'United States',
      city: faker.location.city(),
      address: faker.location.streetAddress(),
      zip: faker.location.zipCode('#####'),
      phone: faker.phone.number('##########'),
      ...overrides,
    };
  }

  /**
   * Generate a test credit card (NOT a real card — test values only)
   */
  static createCreditCard(): CreditCardData {
    return {
      // Stripe test card numbers — safe to use in test environments
      cardNumber: '4111111111111111', // Always use this Visa test number
      expiryMonth: '12',
      expiryYear: String(new Date().getFullYear() + 2),
      cvv: '123',
      nameOnCard: faker.person.fullName(),
    };
  }

  /**
   * Generate a random search term from a predefined list
   */
  static getRandomSearchTerm(): string {
    const terms = ['book', 'computer', 'camera', 'jewelry', 'digital', 'fiction'];
    return faker.helpers.arrayElement(terms);
  }

  /**
   * Generate test email with a specific domain (for filtering)
   */
  static createTestEmail(prefix?: string): string {
    const uniquePart = prefix ?? faker.internet.username();
    return `${uniquePart}.${Date.now()}@playwright-test.com`;
  }

  /**
   * Create bulk users for data-driven tests
   * @param count - number of users to generate
   */
  static createUsers(count: number): UserData[] {
    return Array.from({ length: count }, () => this.createUser());
  }

  /**
   * Generate a random product name for reviews/forms
   */
  static createReviewData() {
    return {
      title: faker.lorem.sentence(5),
      body: faker.lorem.paragraph(2),
      rating: faker.number.int({ min: 1, max: 5 }),
    };
  }
}


/**
 * ============================================================
 * utils/WaitHelper.ts — Custom Wait Utilities
 * ============================================================
 * PHASE 2 — Topic 10: Handling waits — explicit waits
 * ============================================================
 */
import { Page, Locator } from '@playwright/test';

export class WaitHelper {

  /**
   * Wait for an element to contain specific text
   * Uses polling — checks repeatedly until text matches or timeout
   */
  static async waitForText(
    locator: Locator,
    text: string,
    timeout: number = 10_000
  ): Promise<void> {
    // Playwright's expect with custom timeout handles this natively
    const { expect } = await import('@playwright/test');
    await expect(locator).toContainText(text, { timeout });
  }

  /**
   * Wait for URL to match a pattern
   */
  static async waitForUrl(page: Page, urlPattern: string | RegExp, timeout: number = 15_000): Promise<void> {
    await page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Wait for page to stop loading (network becomes idle)
   * Use sparingly — networkidle can be slow/unreliable for SPAs
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 10_000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Custom retry logic — retry an action N times before failing
   */
  static async retryAction<T>(
    action: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await action();
      } catch (error) {
        if (attempt === retries) throw error;
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('All retries exhausted');
  }

  /**
   * Wait for element count to match expected
   */
  static async waitForElementCount(locator: Locator, expectedCount: number, timeout: number = 10_000): Promise<void> {
    const { expect } = await import('@playwright/test');
    await expect(locator).toHaveCount(expectedCount, { timeout });
  }
}


/**
 * ============================================================
 * utils/DateHelper.ts — Date Formatting Utilities
 * ============================================================
 * Reusable date utilities for test data and assertions
 * PHASE 6 — Topic 28: Utility / helper classes
 * ============================================================
 */
export class DateHelper {

  /**
   * Format a Date as MM/DD/YYYY
   */
  static formatUS(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  /**
   * Get today's date as a formatted string
   */
  static today(format: 'US' | 'ISO' = 'ISO'): string {
    const now = new Date();
    return format === 'US' ? this.formatUS(now) : now.toISOString().split('T')[0];
  }

  /**
   * Get a future date N days from today
   */
  static futureDateISO(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get a valid future credit card expiry (2 years from now)
   */
  static creditCardExpiry(): { month: string; year: string } {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    return {
      month: String(future.getMonth() + 1).padStart(2, '0'),
      year: String(future.getFullYear()),
    };
  }
}


/**
 * ============================================================
 * utils/ConfigLoader.ts — Environment Configuration Loader
 * ============================================================
 * Centralized config management with TypeScript typing.
 * PHASE 4 — Topic 20: Environment variables management
 * PHASE 6 — Topic 28: Config loaders
 * ============================================================
 */
import * as dotenv from 'dotenv';
dotenv.config();

// Interface for full config shape
interface AppConfig {
  baseUrl: string;
  apiBaseUrl: string;
  testUser: { email: string; password: string };
  adminUser: { email: string; password: string };
  timeouts: { default: number; navigation: number; action: number };
  environment: Environment;
}

export class ConfigLoader {
  private static config: AppConfig | null = null;

  /**
   * Load and return the full application config.
   * Singleton pattern — parsed only once.
   */
  static get(): AppConfig {
    if (!this.config) {
      this.config = {
        baseUrl: process.env.BASE_URL ?? 'https://demowebshop.tricentis.com',
        apiBaseUrl: process.env.API_BASE_URL ?? 'https://demowebshop.tricentis.com',
        testUser: {
          email: process.env.TEST_USER_EMAIL ?? 'testuser@example.com',
          password: process.env.TEST_USER_PASSWORD ?? 'Test@12345',
        },
        adminUser: {
          email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
          password: process.env.ADMIN_PASSWORD ?? 'AdminPass123',
        },
        timeouts: {
          default: 60_000,
          navigation: 30_000,
          action: 15_000,
        },
        environment: (process.env.NODE_ENV as Environment) ?? Environment.QA,
      };
    }
    return this.config;
  }

  /**
   * Check if we're running in CI
   */
  static isCI(): boolean {
    return !!process.env.CI;
  }

  /**
   * Get a safe (non-secret) description of current environment
   */
  static describe(): string {
    const cfg = this.get();
    return `Environment: ${cfg.environment} | BaseURL: ${cfg.baseUrl} | CI: ${this.isCI()}`;
  }
}
