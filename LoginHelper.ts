/**
 * ============================================================
 * utils/LoginHelper.ts — Reusable Login Utility
 * ============================================================
 * Centralises login logic so it can be reused across tests
 * without duplicating code. Especially useful for test setup.
 *
 * PHASE 6 — Topic 28: Utility classes for login
 * PHASE 8 — Topic 36: Session storage and cookie management
 * ============================================================
 */

import { Page, BrowserContext } from '@playwright/test';
import { ConfigLoader } from './TestDataFactory';

export class LoginHelper {

  /**
   * Login via the UI form
   * Returns the page after successful login
   */
  static async loginViaUI(
    page: Page,
    email?: string,
    password?: string
  ): Promise<void> {
    const config = ConfigLoader.get();
    const userEmail = email ?? config.testUser.email;
    const userPassword = password ?? config.testUser.password;

    await page.goto('/login');
    await page.fill('#Email', userEmail);
    await page.fill('#Password', userPassword);

    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.click('input[value="Log in"]'),
    ]);

    // Verify login succeeded
    const isLoggedIn = await page.locator('.header-links a[href="/customer/info"]').isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      throw new Error(`Login failed for user: ${userEmail}`);
    }
  }

  /**
   * Save authentication state to file
   * Used in auth.setup.ts for storage state pattern
   */
  static async saveStorageState(context: BrowserContext, filePath: string): Promise<void> {
    await context.storageState({ path: filePath });
    console.log(`Auth state saved to: ${filePath}`);
  }

  /**
   * Inject cookies manually into a page context
   * Useful when you have a session cookie from an API login
   */
  static async injectCookies(
    context: BrowserContext,
    cookies: Array<{ name: string; value: string; domain: string; path: string }>
  ): Promise<void> {
    await context.addCookies(cookies);
  }

  /**
   * Clear all auth cookies — simulates logging out via API
   */
  static async clearAuth(context: BrowserContext): Promise<void> {
    await context.clearCookies();
  }

  /**
   * Check if the current page indicates a logged-in user
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    return await page.locator('.header-links a[href="/customer/info"]').isVisible()
      .catch(() => false);
  }
}


/**
 * ============================================================
 * utils/APIHelper.ts — Reusable API Request Utilities
 * ============================================================
 * Wraps common API interactions for reuse across tests
 *
 * PHASE 3 — Topic 14: API testing utilities
 * PHASE 6 — Topic 28: Utility / helper classes
 * ============================================================
 */

import { APIRequestContext } from '@playwright/test';

export interface APIResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T;
  ok: boolean;
  duration: number;
}

export class APIHelper {
  private context: APIRequestContext;
  private baseUrl: string;

  constructor(context: APIRequestContext, baseUrl?: string) {
    this.context = context;
    this.baseUrl = baseUrl ?? ConfigLoader.get().apiBaseUrl;
  }

  /**
   * GET request with timing and structured response
   */
  async get<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<APIResponse<T>> {
    const start = Date.now();
    const response = await this.context.get(`${this.baseUrl}${endpoint}`, { params });
    const duration = Date.now() - start;

    let body: T;
    try {
      body = await response.json() as T;
    } catch {
      body = await response.text() as unknown as T;
    }

    return {
      status: response.status(),
      headers: response.headers(),
      body,
      ok: response.ok(),
      duration,
    };
  }

  /**
   * POST with form data (NopCommerce uses form submissions)
   */
  async postForm<T = unknown>(endpoint: string, formData: Record<string, string>): Promise<APIResponse<T>> {
    const start = Date.now();
    const response = await this.context.post(`${this.baseUrl}${endpoint}`, { form: formData });
    const duration = Date.now() - start;

    let body: T;
    try {
      body = await response.json() as T;
    } catch {
      body = await response.text() as unknown as T;
    }

    return {
      status: response.status(),
      headers: response.headers(),
      body,
      ok: response.ok(),
      duration,
    };
  }

  /**
   * POST with JSON body
   */
  async postJSON<T = unknown>(endpoint: string, data: Record<string, unknown>): Promise<APIResponse<T>> {
    const start = Date.now();
    const response = await this.context.post(`${this.baseUrl}${endpoint}`, {
      data,
      headers: { 'Content-Type': 'application/json' },
    });
    const duration = Date.now() - start;

    let body: T;
    try {
      body = await response.json() as T;
    } catch {
      body = await response.text() as unknown as T;
    }

    return {
      status: response.status(),
      headers: response.headers(),
      body,
      ok: response.ok(),
      duration,
    };
  }

  /**
   * Log API response details — useful for debugging
   */
  static logResponse<T>(label: string, response: APIResponse<T>): void {
    console.log(`\n📡 API: ${label}`);
    console.log(`   Status: ${response.status} | Duration: ${response.duration}ms | OK: ${response.ok}`);
    if (typeof response.body === 'object') {
      console.log(`   Body: ${JSON.stringify(response.body).substring(0, 200)}...`);
    }
  }
}
