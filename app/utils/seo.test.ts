import { describe, expect, it } from "vitest";
import { canonicalHostRedirect } from "./seo.ts";

describe("canonicalHostRedirect", () => {
  it("sends www to the apex, keeping path and query", () => {
    expect(canonicalHostRedirect(new URL("https://www.itsourmoney.us/about?a=1"))).toBe(
      "https://itsourmoney.us/about?a=1",
    );
  });

  it("builds the destination from the canonical origin, whatever scheme arrived", () => {
    expect(canonicalHostRedirect(new URL("http://www.itsourmoney.us/"))).toBe(
      "https://itsourmoney.us/",
    );
  });

  it("sends the Fly hostname to the apex, keeping path and query", () => {
    expect(canonicalHostRedirect(new URL("https://its-our-money.fly.dev/help?a=1"))).toBe(
      "https://itsourmoney.us/help?a=1",
    );
  });

  it("never redirects the health check, on any host", () => {
    for (const host of ["its-our-money.fly.dev", "www.itsourmoney.us", "172.19.0.2:8080"]) {
      expect(
        canonicalHostRedirect(new URL(`http://${host}/resources/healthcheck`)),
        host,
      ).toBeNull();
    }
  });

  it("leaves the apex alone", () => {
    expect(canonicalHostRedirect(new URL("https://itsourmoney.us/about"))).toBeNull();
  });

  it("leaves localhost alone", () => {
    expect(canonicalHostRedirect(new URL("http://localhost:3000/"))).toBeNull();
  });

  it("does not match lookalike hosts", () => {
    expect(canonicalHostRedirect(new URL("https://www.itsourmoney.us.evil.test/"))).toBeNull();
    expect(canonicalHostRedirect(new URL("https://fly.dev.evil.test/"))).toBeNull();
  });
});
