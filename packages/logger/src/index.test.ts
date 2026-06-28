import { describe, it, expect, vi, beforeEach } from "vitest";

import { createLogger, generateRequestId } from "./index";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createLogger returns object with log methods", () => {
    const log = createLogger("test");
    expect(log.debug).toBeTypeOf("function");
    expect(log.info).toBeTypeOf("function");
    expect(log.warn).toBeTypeOf("function");
    expect(log.error).toBeTypeOf("function");
    expect(log.child).toBeTypeOf("function");
  });

  it("info logs to console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("api");
    log.info("request received");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("request received");
  });

  it("error logs to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("db");
    log.error("connection failed");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("connection failed");
  });

  it("warn logs to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = createLogger("auth");
    log.warn("rate limited");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("rate limited");
  });

  it("child logger includes requestId", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("api");
    const child = log.child("req_abc123");
    child.info("handler start");
    expect(spy.mock.calls[0][0]).toContain("req_abc123");
  });

  it("includes context in output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("draft");
    log.info("session created");
    expect(spy.mock.calls[0][0]).toContain("draft");
  });

  it("includes extra metadata", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("test");
    log.info("action", { userId: "123", duration: 42 });
    const output = spy.mock.calls[0][0];
    expect(output).toContain("userId");
    expect(output).toContain("123");
  });
});

describe("generateRequestId", () => {
  it("returns unique ids", () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
  });

  it("starts with req_ prefix", () => {
    expect(generateRequestId()).toMatch(/^req_/);
  });
});
