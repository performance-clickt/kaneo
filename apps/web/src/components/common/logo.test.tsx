import { cleanup, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Logo } from "./logo";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/store/project", () => ({
  default: () => ({ setProject: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("Logo", () => {
  it("exposes one Pyrito Ops link and swaps the supplied lockup by theme", () => {
    const { container, getByRole } = render(<Logo />);

    expect(getByRole("link", { name: "Pyrito Ops" })).toHaveAttribute(
      "href",
      "/dashboard",
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/logo-light.svg");
    expect(images[0]).toHaveAttribute("aria-hidden", "true");
    expect(images[0]).toHaveClass("max-w-full");
    expect(images[0]).toHaveClass("dark:hidden");
    expect(images[1]).toHaveAttribute("src", "/logo-dark.svg");
    expect(images[1]).toHaveAttribute("aria-hidden", "true");
    expect(images[1]).toHaveClass("max-w-full");
    expect(images[1]).toHaveClass("dark:block");
  });

  it("provides the D20 mark without duplicating the link name in icon collapse", () => {
    const { container, getAllByRole } = render(<Logo compactOnCollapsed />);

    expect(getAllByRole("link", { name: "Pyrito Ops" })).toHaveLength(1);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveClass("group-data-[collapsible=icon]:hidden");
    expect(images[1]).toHaveClass("group-data-[collapsible=icon]:hidden");
    expect(images[2]).toHaveAttribute("src", "/favicon.svg");
    expect(images[2]).toHaveClass("group-data-[collapsible=icon]:block");
  });
});
