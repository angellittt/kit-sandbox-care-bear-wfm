import { expect, test } from "@playwright/test";
import { API_URL } from "./support/utils.js";

// A minimal example proving the stack is wired correctly end-to-end: the
// web app renders and navigates, and the api is reachable from the
// playwright container. Replace/expand once the app has real flows worth
// covering.
test("web app renders the dashboard and opens a bear's profile", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Workforce overview" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Bears", exact: true }).click();
  // Wait for the hash route to switch: the overview also links each bear.
  await expect(page.getByRole("heading", { name: "Bears" })).toBeVisible();
  await page
    .getByRole("link", { name: "Tenderheart Bear", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tenderheart Bear" }),
  ).toBeVisible();
});

test("api is reachable and healthy", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/v1/healthcheck`);
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(body.status).toBe("OK");
});
