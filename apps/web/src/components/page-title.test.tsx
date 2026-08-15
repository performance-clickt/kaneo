import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PageTitle from "./page-title";

afterEach(() => {
  cleanup();
});

describe("PageTitle", () => {
  it("uses Pyrito Ops as the default product suffix", () => {
    render(<PageTitle title="Dashboard" />);

    expect(document.title).toBe("Dashboard · Pyrito Ops");
  });
});
