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
  it("credits Pyrito Ops and sends support/source traffic to the fork", () => {
    const { getByRole, getByText } = render(<ProductAttribution />);

    expect(getByText("Pyrito Ops")).toBeVisible();
    expect(
      getByRole("link", { name: "View Pyrito Ops source code" }),
    ).toHaveAttribute("href", SOURCE_REPOSITORY_URL);
  });
});
