import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PageTitle from "./page-title";

afterEach(() => {
  cleanup();
});

describe("PageTitle", () => {
  it("uses Clickt HiveMind as the default product suffix", () => {
    render(<PageTitle title="Dashboard" />);

    expect(document.title).toBe("Dashboard · Clickt HiveMind");
  });
});
