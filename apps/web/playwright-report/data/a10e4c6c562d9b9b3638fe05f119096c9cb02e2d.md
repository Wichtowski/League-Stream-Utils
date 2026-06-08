# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> smoke tests >> login page toggles to register
- Location: e2e/smoke.spec.ts:21:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText(/register/i)

```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Zaloguj się" [level=1] [ref=e5]
      - paragraph [ref=e6]: Wprowadź dane logowania
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Nazwa użytkownika
        - textbox "Nazwa użytkownika" [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]: Hasło
        - textbox "Hasło" [ref=e13]
      - button "Zaloguj się" [ref=e14]
    - generic [ref=e17]: lub
    - button "Kontynuuj z Google" [ref=e19]:
      - img [ref=e20]
      - text: Kontynuuj z Google
    - paragraph [ref=e25]:
      - text: Nie masz konta?
      - button "Zarejestruj" [ref=e26]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("smoke tests", () => {
  4  |   test("home page loads", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/League Stream Utils/);
  7  |   });
  8  | 
  9  |   test("home page has sign-in link", async ({ page }) => {
  10 |     await page.goto("/");
  11 |     await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  12 |   });
  13 | 
  14 |   test("login page renders form", async ({ page }) => {
  15 |     await page.goto("/login");
  16 |     await expect(page.getByLabel(/username/i)).toBeVisible();
  17 |     await expect(page.getByLabel(/password/i)).toBeVisible();
  18 |     await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  19 |   });
  20 | 
  21 |   test("login page toggles to register", async ({ page }) => {
  22 |     await page.goto("/login");
> 23 |     await page.getByText(/register/i).click();
     |                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  24 |     await expect(page.getByLabel(/email/i)).toBeVisible();
  25 |     await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
  26 |   });
  27 | 
  28 |   test("404 page for unknown routes", async ({ page }) => {
  29 |     await page.goto("/nonexistent-route");
  30 |     await expect(page.getByText("404")).toBeVisible();
  31 |   });
  32 | });
  33 | 
  34 | test.describe("protected routes redirect to login", () => {
  35 |   test("modules page redirects to login", async ({ page }) => {
  36 |     await page.goto("/modules");
  37 |     await expect(page).toHaveURL(/\/login/);
  38 |   });
  39 | 
  40 |   test("teams page redirects to login", async ({ page }) => {
  41 |     await page.goto("/modules/teams");
  42 |     await expect(page).toHaveURL(/\/login/);
  43 |   });
  44 | 
  45 |   test("tournaments page redirects to login", async ({ page }) => {
  46 |     await page.goto("/modules/tournaments");
  47 |     await expect(page).toHaveURL(/\/login/);
  48 |   });
  49 | 
  50 |   test("draft page redirects to login", async ({ page }) => {
  51 |     await page.goto("/modules/draft");
  52 |     await expect(page).toHaveURL(/\/login/);
  53 |   });
  54 | });
  55 | 
  56 | test.describe("API health", () => {
  57 |   test("health endpoint returns ok", async ({ request }) => {
  58 |     const response = await request.get("/api/v1/health");
  59 |     expect(response.status()).toBe(200);
  60 |     const body = await response.json();
  61 |     expect(body.status).toBeDefined();
  62 |     expect(body.timestamp).toBeDefined();
  63 |   });
  64 | 
  65 |   test("auth validate returns null user without token", async ({ request }) => {
  66 |     const response = await request.get("/api/v1/auth/validate");
  67 |     expect(response.status()).toBe(200);
  68 |     const body = await response.json();
  69 |     expect(body.user).toBeNull();
  70 |   });
  71 | 
  72 |   test("teams API returns 401 without auth", async ({ request }) => {
  73 |     const response = await request.get("/api/v1/teams");
  74 |     expect(response.status()).toBe(401);
  75 |   });
  76 | });
  77 | 
```