import { test, expect } from "@playwright/test";

test.describe("smoke tests", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/League Stream Utils/);
  });

  test("home page has sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login page toggles to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByText(/register/i).click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
  });

  test("404 page for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-route");
    await expect(page.getByText("404")).toBeVisible();
  });
});

test.describe("protected routes redirect to login", () => {
  test("modules page redirects to login", async ({ page }) => {
    await page.goto("/modules");
    await expect(page).toHaveURL(/\/login/);
  });

  test("teams page redirects to login", async ({ page }) => {
    await page.goto("/modules/teams");
    await expect(page).toHaveURL(/\/login/);
  });

  test("tournaments page redirects to login", async ({ page }) => {
    await page.goto("/modules/tournaments");
    await expect(page).toHaveURL(/\/login/);
  });

  test("draft page redirects to login", async ({ page }) => {
    await page.goto("/modules/draft");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("API health", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/v1/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  test("auth validate returns null user without token", async ({ request }) => {
    const response = await request.get("/api/v1/auth/validate");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBeNull();
  });

  test("teams API returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/v1/teams");
    expect(response.status()).toBe(401);
  });
});
