import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { act, render, screen, within } from "@/tests/utils";

const goTo = async (hash: string) => {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
};

beforeAll(() => {
  // jsdom has no matchMedia; the sidebar reads it to pick its mobile layout.
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(async () => {
  await goTo("");
});

describe("App", () => {
  it("shows the workforce overview by default", async () => {
    await render(<App />);
    expect(
      screen.getByRole("heading", { name: "Workforce overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Roster")).toBeInTheDocument();
  });

  it("shows a bear's profile with their powers", async () => {
    await render(<App />);
    await goTo("#/bears/grumpy");
    expect(
      screen.getByRole("heading", { name: "Grumpy Bear" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gadgeteering")).toBeInTheDocument();
    expect(screen.getByText("Recharging")).toBeInTheDocument();
  });

  it("explains when a bear isn't on the roster", async () => {
    await render(<App />);
    await goTo("#/bears/beastly");
    expect(screen.getByText("Bear not found")).toBeInTheDocument();
  });

  it("filters the bears directory by search", async () => {
    const { user } = await render(<App />);
    await goTo("#/bears");
    const search = screen.getByRole("searchbox", {
      name: "Search by name, power or specialty",
    });

    await user.type(search, "lullaby");
    const grid = screen.getByRole("list", { name: "Bear profiles" });
    expect(within(grid).getAllByRole("listitem")).toHaveLength(1);
    expect(within(grid).getByText("Bedtime Bear")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzz");
    expect(screen.getByText("No bears match")).toBeInTheDocument();
  });

  it("lists unassigned missions under their tab", async () => {
    const { user } = await render(<App />);
    await goTo("#/missions");
    await user.click(screen.getByRole("tab", { name: /Needs a bear/ }));
    expect(screen.getByText("Repair the Caring Meter")).toBeInTheDocument();
    expect(screen.queryByText("Rainbow bridge restoration")).toBeNull();
  });
});
