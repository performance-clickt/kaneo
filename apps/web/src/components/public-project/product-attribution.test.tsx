import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SOURCE_REPOSITORY_URL } from "@/constants/urls";
import { ProductAttribution } from "./product-attribution";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: () => "Powered by" }),
}));

afterEach(() => {
  cleanup();
});

describe("ProductAttribution", () => {
  it("credits Clickt HiveMind and sends support/source traffic to the fork", () => {
    const { getByRole, getByText } = render(<ProductAttribution />);

    expect(getByText("Clickt HiveMind")).toBeVisible();
    expect(
      getByRole("link", { name: "View Clickt HiveMind source code" }),
    ).toHaveAttribute("href", SOURCE_REPOSITORY_URL);
  });
});
