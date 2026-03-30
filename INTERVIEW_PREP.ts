/**
 * ============================================================
 * INTERVIEW_PREP.md — Top 30 Playwright Interview Questions
 * ============================================================
 * PHASE 10 — Topics 46–50: Interview & Certification Prep
 *
 * These answers are written at a SENIOR level (13 years QA exp).
 * Don't just memorize answers — understand the WHY behind each.
 * ============================================================
 */

/*
═══════════════════════════════════════════════════════════
 SECTION 1 — CORE CONCEPTS (Questions 1–10)
═══════════════════════════════════════════════════════════

Q1. What is Playwright and how does it differ from Selenium and Cypress?

A:  Playwright is a Microsoft-maintained test automation framework that
    controls Chromium, Firefox, and WebKit through a single unified API.

    vs Selenium:
    - Playwright auto-waits for elements; Selenium requires manual waits
    - Playwright runs tests in isolated browser contexts (not tabs)
    - Playwright supports parallel tests out of the box; Selenium needs Grid
    - Playwright has built-in API testing; Selenium doesn't
    - Playwright uses CDP (Chrome DevTools Protocol) for Chrome; faster than WebDriver

    vs Cypress:
    - Playwright supports Firefox and WebKit; Cypress was Chromium-only until recently
    - Playwright supports multiple browser contexts per test (multi-tab, multi-user)
    - Playwright supports iframes more naturally
    - Playwright can run tests in true parallelism across shards
    - Cypress runs inside the browser; Playwright controls it externally
    - Playwright supports file downloads, geolocation, permissions natively

    Interview tip: Mention real scenarios where Playwright excels —
    "When I was testing a payment flow that opens a 3D Secure popup in a new tab,
     Playwright's multi-page support made it trivial. Cypress would have struggled."

───────────────────────────────────────────────────────────

Q2. What is Auto-Waiting in Playwright? Why is it important?

A:  Playwright automatically waits for an element to be:
    1. Attached to the DOM
    2. Visible (not hidden/display:none)
    3. Stable (not animating)
    4. Enabled (not disabled)
    5. Receives events (not covered by another element)

    This happens BEFORE every action (click, fill, type, etc.).
    You DON'T need: waitForElement(), sleep(), implicit waits.

    This eliminates 80% of flaky tests that plague Selenium/Cypress suites.

    actionTimeout in playwright.config.ts controls how long it waits.

───────────────────────────────────────────────────────────

Q3. Explain the Page Object Model (POM) in Playwright with TypeScript.

A:  POM is a design pattern where each page/component of the AUT (Application
    Under Test) has a corresponding class. The class encapsulates:
    1. Locators (elements on that page) — as class properties
    2. Actions (what you can do on that page) — as methods

    Benefits:
    - Locators are defined ONCE, not scattered across test files
    - If the UI changes, you update ONE place (the page class), not 100 tests
    - Tests read like business language: loginPage.login(email, password)
    - TypeScript adds type safety — catches errors at compile time

    In this framework: BasePage → LoginPage / HomePage / ProductPage etc.

───────────────────────────────────────────────────────────

Q4. What are Playwright Fixtures? Why are they preferred over beforeEach?

A:  Fixtures are dependency injection containers in Playwright.
    They provide setup/teardown for test dependencies in a composable way.

    Why better than beforeEach:
    - Lazy — only created if a test actually uses them (efficient)
    - Scoped — can be test-scoped, worker-scoped, or project-scoped
    - Composable — fixtures can depend on other fixtures
    - Type-safe — TypeScript knows the fixture type when destructured

    Example: { loginPage } in test args is a fixture.
    The loginPage is created and destroyed for each test automatically.

    vs beforeEach: beforeEach runs for EVERY test regardless of whether
    that test needs the setup. Fixtures only run when requested.

───────────────────────────────────────────────────────────

Q5. What is Storage State and why is it used?

A:  Storage State saves the entire browser session (cookies, localStorage,
    sessionStorage) to a JSON file.

    Use case: Instead of logging in at the start of EVERY test, you:
    1. Run auth.setup.ts ONCE — it logs in and saves state to .auth/user.json
    2. All subsequent tests start with the saved state — already logged in
    3. Saves ~5-10 seconds per test, critical for large suites

    Implementation:
    - storageState: 'path/to/user.json' in playwright.config.ts
    - Or: browser.newContext({ storageState: authFile }) in fixtures

───────────────────────────────────────────────────────────

Q6. How does Playwright handle multiple browser contexts?

A:  A browser context is an isolated browser session — like an incognito
    window with its own cookies, localStorage, and history.

    Multiple contexts = multiple independent sessions in ONE test.

    Use cases:
    1. Test multi-user flows (e.g., sender sends message → receiver reads it)
    2. Test that actions in one session don't affect another
    3. Create authenticated + unauthenticated contexts in same test
    4. Run tests faster by reusing a single browser with multiple contexts

    Each context gets its own page, and pages in different contexts are
    completely isolated — they cannot access each other's data.

───────────────────────────────────────────────────────────

Q7. What is the Playwright Trace Viewer? How do you use it?

A:  Trace Viewer is Playwright's built-in visual debugger. A trace captures:
    - DOM snapshots before/after each action
    - Network requests and responses
    - Console logs
    - Screenshots and videos
    - Test timeline with action durations

    Usage:
    - Enable: trace: 'retain-on-failure' in playwright.config.ts
    - View: npx playwright show-trace test-results/trace.zip

    Interview answer: "When a test fails in CI but passes locally, I use
    Trace Viewer. I enable --trace on and download the trace zip from the
    CI artifact. The DOM snapshot shows exactly what the page looked like
    at the moment of failure — far faster than debugging with logs."

───────────────────────────────────────────────────────────

Q8. How do you handle network request interception in Playwright?

A:  page.route() intercepts requests matching a URL pattern BEFORE they
    leave the browser. You can:

    1. MOCK: Return a fake response (for testing without a real backend)
       await page.route('/api/orders', route => route.fulfill({
         body: JSON.stringify(mockData)
       }));

    2. MODIFY: Change the request/response
       await page.route('/api/**', async route => {
         const response = await route.fetch();
         const body = await response.json();
         body.modified = true;
         await route.fulfill({ json: body });
       });

    3. ABORT: Block specific requests (e.g., analytics calls)
       await page.route('**/analytics**', route => route.abort());

    Use cases: Test error states, test loading states, speed up tests
    by mocking heavy API calls.

───────────────────────────────────────────────────────────

Q9. What are soft assertions in Playwright? When do you use them?

A:  Regular assertions STOP the test at the first failure.
    Soft assertions CONTINUE executing even after a failure and report
    ALL failures together at the end.

    Syntax: expect.soft() instead of expect()

    Use case: UI element verification tests where you want to check
    MULTIPLE elements on a page in one test. If the "Login" button is
    missing AND the "Email" field is missing, you want to know BOTH,
    not just the first failure.

    Rule of thumb: Use soft assertions for "all elements present" tests.
    Use regular assertions for flow-critical checks (redirects, auth).

───────────────────────────────────────────────────────────

Q10. Explain Playwright's locator strategies and which ones to prefer.

A:  Priority order (most to least preferred):

    1. getByRole()     — ARIA role + name. Best for accessibility + resilience
                         page.getByRole('button', { name: 'Submit' })

    2. getByLabel()    — Finds input by its associated label text
                         page.getByLabel('Email address')

    3. getByText()     — Exact text match. Good for links, headings
                         page.getByText('Sign in')

    4. getByTestId()   — Custom data-testid attribute
                         page.getByTestId('login-button')
                         Requires dev team to add data-testid attributes

    5. CSS Selectors   — Flexible but fragile if class names change
                         page.locator('#email-input')
                         page.locator('.btn-primary')

    6. XPath           — Last resort. Use when CSS is impossible
                         page.locator('//button[contains(text(),"Login")]')

    Interview tip: "I prefer role-based locators because they test
    accessibility simultaneously — if getByRole() finds the button,
    it means the button has proper ARIA attributes for screen readers."

═══════════════════════════════════════════════════════════
 SECTION 2 — INTERMEDIATE (Questions 11–20)
═══════════════════════════════════════════════════════════

Q11. How do you implement parallel test execution in Playwright?

A:  Playwright parallelism works at two levels:
    1. Worker-level: Multiple worker processes run test files in parallel
       workers: 4 in playwright.config.ts (or --workers=4 CLI)

    2. Shard-level: Split tests across multiple machines/containers
       npx playwright test --shard=1/4  (machine 1 of 4)
       npx playwright test --shard=2/4  (machine 2 of 4)

    Key rule: Tests in the SAME file run serially by default.
    Set test.describe.configure({ mode: 'parallel' }) for in-file parallelism.

    Avoid test conflicts: Don't share mutable state (same database record,
    same user account) between parallel tests — use unique test data.

───────────────────────────────────────────────────────────

Q12. How do you handle file uploads in Playwright?

A:  page.setInputFiles() sets the file path on a file input element.

    // Single file upload
    await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

    // Multiple files
    await page.setInputFiles('input[type="file"]', [
      'path/to/file1.pdf',
      'path/to/file2.pdf'
    ]);

    // Upload without saving to disk (buffer)
    await page.setInputFiles('input[type="file"]', {
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

───────────────────────────────────────────────────────────

Q13. How do you handle drag and drop in Playwright?

A:  Method 1: dragAndDrop() — simplest
    await page.dragAndDrop('#source', '#target');

    Method 2: locator.dragTo() — more control
    await page.locator('#drag-item').dragTo(page.locator('#drop-zone'));

    Method 3: Mouse events — for complex/custom drag implementations
    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 10 }); // steps = smooth drag
    await page.mouse.up();

───────────────────────────────────────────────────────────

Q14. How do you test iframes in Playwright?

A:  Method 1: frameLocator() — modern, recommended
    const frame = page.frameLocator('iframe#payment-frame');
    await frame.getByLabel('Card Number').fill('4111111111111111');

    Method 2: contentFrame() — from a locator
    const iframeLocator = page.locator('iframe');
    const frame = await iframeLocator.contentFrame();
    await frame.locator('#card-input').fill('4111111111111111');

    Method 3: page.frame() — by name or URL
    const frame = page.frame({ name: 'payment-iframe' });

    Nested iframes: Chain frameLocator calls
    const nested = page.frameLocator('#outer').frameLocator('#inner');

───────────────────────────────────────────────────────────

Q15. What is the difference between page.waitForSelector and Playwright locators?

A:  Old way (Selenium-like): waitForSelector returns an ElementHandle
    const element = await page.waitForSelector('#email');
    await element.fill('test@test.com'); // ElementHandle style

    Modern way (recommended): Use locators — they auto-wait
    const emailInput = page.locator('#email');
    await emailInput.fill('test@test.com'); // Auto-waits internally

    Why locators are better:
    - They're lazy — don't query the DOM until an action is performed
    - They automatically retry if the element isn't ready
    - They work correctly with dynamic content
    - They're more composable (chain, filter, etc.)

    Avoid ElementHandle wherever possible — it's the "old" API.

───────────────────────────────────────────────────────────

Q16. How do you handle test data in a large Playwright framework?

A:  Four layers of test data management:

    1. Static JSON/CSV files (data/testdata.json)
       For: Fixed reference data, configuration, known edge cases

    2. Faker.js dynamic generation
       For: Unique user data, preventing duplicate conflicts, realistic data

    3. API-generated test data (using APIRequestContext)
       For: Complex pre-conditions that need real database records

    4. Stored state (Storage State / .auth/)
       For: Authentication state reuse across tests

    Golden rule: Tests must be INDEPENDENT — each test creates its own
    data and doesn't rely on data left by another test.

───────────────────────────────────────────────────────────

Q17. How do you run only specific tests in Playwright?

A:  Multiple ways:
    1. Tags/grep: npx playwright test --grep @smoke
    2. test.only(): Runs only that test in the file (remove before committing!)
    3. test.skip(): Skips that test
    4. test.fixme(): Marks as broken, doesn't fail the suite
    5. test.slow(): Triples the timeout for known slow tests
    6. --grep-invert: Runs everything EXCEPT matching tests
    7. Specify a file: npx playwright test tests/ui/login.spec.ts
    8. Specify a line: npx playwright test tests/ui/login.spec.ts:25

───────────────────────────────────────────────────────────

Q18. Explain the test reporting options in Playwright.

A:  Built-in reporters:
    - html: Rich interactive report with traces, screenshots, videos
    - json: Machine-readable, for custom dashboards or integrations
    - junit: XML format for Jenkins, Azure DevOps, GitLab CI
    - line: Compact terminal output, good for CI logs
    - dot: Minimal — one dot per test, fast
    - list: One line per test with status

    Third-party:
    - Allure: Rich dashboard with history, trends, flakiness tracking
    - ReportPortal: Enterprise-grade with AI-based analytics

    In playwright.config.ts, combine reporters:
    reporter: [['html'], ['junit'], ['line']]

───────────────────────────────────────────────────────────

Q19. How do you debug Playwright tests?

A:  5 debugging techniques (know all 5 for senior interviews):

    1. --debug flag: npx playwright test --debug
       Opens the Playwright Inspector GUI — step through tests visually

    2. page.pause(): Pauses execution at that line in the Inspector
       await page.pause(); // Add to the exact line you want to inspect

    3. VS Code Extension: Playwright extension for VS Code
       Set breakpoints, run tests in watch mode, record new tests

    4. Trace Viewer: For post-mortem analysis of CI failures
       trace: 'on' → opens at failure with full timeline

    5. Console.log + page.evaluate():
       const value = await page.evaluate(() => document.title);
       console.log(value);

───────────────────────────────────────────────────────────

Q20. How do you handle test retries and flaky tests?

A:  Configure retries in playwright.config.ts:
    retries: process.env.CI ? 2 : 0

    On retry, Playwright:
    - Completely restarts the test from scratch
    - Creates a fresh page/context
    - Records a separate trace per attempt

    Identifying flaky tests:
    - HTML report shows "flaky" label for tests that passed on retry
    - Use --reporter=json to get flakiness data over time

    Fixing flaky tests (root causes):
    1. Race conditions → Add proper waitFor / expect assertions
    2. Shared test data → Use unique data per test
    3. Hardcoded waits → Replace with auto-wait assertions
    4. Environment issues → Add retry logic for external API calls

═══════════════════════════════════════════════════════════
 SECTION 3 — ADVANCED / SENIOR (Questions 21–30)
═══════════════════════════════════════════════════════════

Q21. How would you design a scalable Playwright framework from scratch?

A:  Layer 1 — Foundation:
    playwright.config.ts, .env, tsconfig.json, package.json

    Layer 2 — Page Objects:
    pages/BasePage.ts (shared methods) → pages/LoginPage.ts etc.
    Each page = 1 class, locators as properties, actions as methods

    Layer 3 — Fixtures:
    fixtures/index.ts extending base test with page objects + auth

    Layer 4 — Test Utilities:
    utils/TestDataFactory.ts (Faker), utils/LoginHelper.ts,
    utils/APIHelper.ts, utils/ConfigLoader.ts

    Layer 5 — Test Data:
    data/testdata.json, .auth/user.json (gitignored)

    Layer 6 — Tests:
    tests/ui/, tests/api/, tests/visual/, tests/accessibility/

    Layer 7 — CI/CD:
    .github/workflows/, azure-pipelines.yml, Dockerfile

───────────────────────────────────────────────────────────

Q22. How do you implement API testing within your Playwright framework?

A:  Playwright's APIRequestContext provides full HTTP testing:

    1. Test API endpoints independently (no browser):
       const response = await request.get('/api/products');
       expect(response.status()).toBe(200);
       const body = await response.json();
       expect(body.products).toHaveLength(10);

    2. Combine API + UI in one test:
       // Create test data via API (fast)
       await request.post('/api/products', { data: product });
       // Then verify it appears in the UI
       await page.goto('/products');
       await expect(page.getByText(product.name)).toBeVisible();

    3. Clean up via API after UI test:
       // UI test creates an order
       // API call deletes it — faster than navigating to delete UI

───────────────────────────────────────────────────────────

Q23. How would you implement visual testing in a CI pipeline?

A:  Step 1: Generate baselines on a STABLE environment
    npx playwright test tests/visual --update-snapshots
    Commit the .png files to git (in a visual-snapshots/ folder)

    Step 2: CI runs visual tests on every PR
    npx playwright test tests/visual
    Fails if pixel diff exceeds threshold (maxDiffPixels)

    Step 3: Review failures
    The HTML report shows side-by-side diff images (expected vs actual vs diff)

    Key challenges and solutions:
    - Font rendering varies by OS → Run in Docker for consistency
    - Dynamic content (dates, banners) → Mask them before screenshotting
    - Animation → await page.evaluate(() => all CSS animations stop)
    - Anti-aliasing differences → Set threshold: 0.2 (20% tolerance)

───────────────────────────────────────────────────────────

Q24. Explain how you would handle authentication in a large test suite.

A:  3-tier authentication strategy:

    Tier 1 — Static storage state (90% of tests):
    Run auth.setup.ts once → saves .auth/user.json
    All tests use storageState in playwright.config.ts
    Zero login time per test — injected directly into browser context

    Tier 2 — API login for isolated tests (per-test auth):
    POST to /login endpoint → extract session cookie
    Inject cookie into browser context
    ~200ms vs ~3s for UI login

    Tier 3 — UI login (only for login-specific tests):
    loginPage.login(email, password) for testing login flow itself
    Use this in login.spec.ts only

    Tip: Never use the same test account for parallel tests —
    parallel tests can interfere with each other's session.
    Create one account per worker or use API to generate accounts.

───────────────────────────────────────────────────────────

Q25. How do you ensure test independence in parallel execution?

A:  Test independence means: each test CAN run in any order, on any worker,
    and the result is always the same.

    Strategies:
    1. Unique test data: Each test generates its own user, order, etc.
       const user = TestDataFactory.createUser(); // unique timestamp email

    2. State isolation: Use browser contexts — no shared cookies/localStorage

    3. Database reset: Use API calls to reset state after each test
       (or use database transactions that roll back after each test)

    4. No test-to-test dependencies: Test B must not rely on Test A
       having run first. If Test A adds a product, Test B cannot assume
       that product exists.

    5. Idempotent setup: beforeEach creates fresh data, not cumulative

───────────────────────────────────────────────────────────

Q26. How do you integrate Playwright with Allure reporting?

A:  1. Install: npm install allure-playwright --save-dev
    2. Add to config: reporter: [['allure-playwright']]
    3. Add annotations in tests:
       test.info().annotations.push({ type: 'owner', description: 'QA Team' });
    4. Generate report: allure generate allure-results --clean
    5. Open: allure open allure-report

    Allure features:
    - Test history and trends across builds
    - Failure categorization (product defect / test defect / environment)
    - Severity, priority, and owner annotations
    - Step-by-step breakdown with timestamps
    - Attachment support (screenshots, logs, JSON)

───────────────────────────────────────────────────────────

Q27. How would you handle a scenario where the test site is behind a login wall
     and tests must authenticate differently per environment?

A:  Use ConfigLoader + environment-specific .env files:

    .env.dev, .env.qa, .env.staging — each with different credentials
    Load with: dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

    For SSO/OAuth environments:
    - Use storage state from a manual login to the SSO provider
    - OR: Bypass SSO using a special test backdoor URL (built by devs)
    - OR: Mock the OAuth token endpoint using page.route()

    For environments with different auth mechanisms:
    Create a LoginStrategy interface with implementations per env:
    - UILoginStrategy (form-based)
    - TokenLoginStrategy (inject JWT directly)
    - StorageStateLoginStrategy (reuse saved state)

───────────────────────────────────────────────────────────

Q28. You have 500 Playwright tests running in 45 minutes. How do you optimize?

A:  Optimization techniques (most impactful first):

    1. Authentication: Storage state removes login from 400+ tests
       Saves 5s × 400 = 33 minutes

    2. Sharding: 4 machines = 4× faster wall-clock time

    3. API for test setup: Create data via API (200ms) vs UI (5s)

    4. Target right browsers: Chrome only for most; cross-browser for critical

    5. Parallel workers: workers: OS_CPU_COUNT (default is already optimal)

    6. Test grouping: Run @smoke first → fast feedback in 5 min

    7. waitForLoadState('domcontentloaded') vs 'networkidle'
       networkidle can wait 30s on slow pages

    8. Eliminate unnecessary navigations: chain locator actions
       without page.reload()

───────────────────────────────────────────────────────────

Q29. How would you explain your Playwright framework in an interview?

A:  STRUCTURE your answer: Framework → Design → Execution → Reporting

    "I built a Playwright TypeScript framework for [project] following
    a layered architecture:

    Foundation: playwright.config.ts with multi-browser setup (Chrome, Firefox,
    WebKit), environment-based configuration, and CI-aware retries and workers.

    Page Objects: TypeScript classes extending BasePage, with locators as
    class properties and business actions as methods — keeps tests readable.

    Fixtures: Extended the base test with page object fixtures and an
    authenticated page fixture that injects pre-saved storage state,
    eliminating repeated logins.

    Test Data: Faker.js-generated unique data for each test, with a
    TestDataFactory class for consistency. External JSON for reference data.

    CI/CD: GitHub Actions with 4-shard parallel execution, JUnit publishing
    to Azure DevOps, and Slack notifications on failure.

    Reporting: HTML report + JUnit for Azure DevOps + Allure for trend analysis.
    Trace Viewer enabled on failure for rapid root-cause analysis in CI."

───────────────────────────────────────────────────────────

Q30. Common mistakes Playwright beginners make (and how to avoid them):

A:  Mistake 1: Using page.waitForTimeout(3000) — hardcoded sleeps
    Fix: Use expect(locator).toBeVisible() — it polls until visible

    Mistake 2: Not using Storage State for auth
    Fix: auth.setup.ts + storageState in config = zero login time

    Mistake 3: Ignoring TypeScript errors / using any
    Fix: Enable strict: true in tsconfig.json

    Mistake 4: test.only() left in code, breaking CI
    Fix: forbidOnly: !!process.env.CI in playwright.config.ts

    Mistake 5: Sharing state between parallel tests
    Fix: Each test creates its own data with unique identifiers

    Mistake 6: Using ElementHandle instead of Locators
    Fix: Always use page.locator() / getByRole() etc.

    Mistake 7: Not cleaning up resources (contexts, pages)
    Fix: Use fixtures — they handle cleanup automatically

    Mistake 8: CSS selectors tied to class names that change
    Fix: Use data-testid or ARIA role selectors

    Mistake 9: Not using the HTML report for debugging
    Fix: Always open the report after failures — traces are gold

    Mistake 10: Testing too much in one test
    Fix: One assertion per test concept (or closely related assertions)
*/

export {}; // TypeScript module requirement
