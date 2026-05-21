import { afterEach, describe, expect, it, vi } from "vitest";

import { setupWaitKit, WaitKitTimeoutError } from "../src";

const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("setupWaitKit", () => {
  it("passes unmatched requests through to the original fetch", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: "/api/users", delay: 1000 }],
    });

    await fetch("/api/posts");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delays matched requests before calling the original fetch", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: "/api/users", delay: 1000 }],
    });

    const promise = fetch("/api/users");

    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns simulated error responses", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [
        {
          url: "/api/payment",
          errorRate: 1,
          errorResponse: {
            status: 503,
            body: { message: "Unavailable" },
          },
        },
      ],
    });

    const response = await fetch("/api/payment");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws timeout errors after timeoutMs", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: "/api/report", timeoutRate: 1, timeoutMs: 5000 }],
    });

    const promise = fetch("/api/report");
    const expectation =
      expect(promise).rejects.toBeInstanceOf(WaitKitTimeoutError);
    await vi.advanceTimersByTimeAsync(5000);

    await expectation;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("can disable, enable, and restore the interceptor", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock as typeof fetch;

    const controller = setupWaitKit({
      rules: [
        {
          url: "/api/users",
          errorRate: 1,
          errorResponse: { status: 500 },
        },
      ],
    });

    controller.disable();
    const disabledResponse = await fetch("/api/users");
    expect(disabledResponse.status).toBe(200);

    controller.enable();
    const enabledResponse = await fetch("/api/users");
    expect(enabledResponse.status).toBe(500);

    controller.restore();
    expect(globalThis.fetch).toBe(fetchMock);
  });

  it("switches scenarios at runtime", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock as typeof fetch;

    const controller = setupWaitKit({
      activeScenario: "server-error",
      rules: [
        {
          url: "/api/users",
          errorRate: 1,
          errorResponse: { status: 400 },
        },
      ],
      scenarios: {
        "server-error": [
          {
            url: "/api/users",
            errorRate: 1,
            errorResponse: { status: 500 },
          },
        ],
      },
    });

    expect((await fetch("/api/users")).status).toBe(500);

    controller.resetScenario();
    expect((await fetch("/api/users")).status).toBe(400);

    controller.setScenario("server-error");
    expect(controller.getScenario()).toBe("server-error");
  });

  it("emits request, match, delay, and error events", async () => {
    vi.useFakeTimers();
    const onRequest = vi.fn();
    const onMatch = vi.fn();
    const onDelayStart = vi.fn();
    const onDelayEnd = vi.fn();
    const onError = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response("ok")) as typeof fetch;

    setupWaitKit({
      rules: [
        {
          url: "/api/users",
          delay: 100,
          errorRate: 1,
          errorResponse: { status: 500 },
        },
      ],
      onRequest,
      onMatch,
      onDelayStart,
      onDelayEnd,
      onError,
    });

    const promise = fetch("/api/users");
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onMatch).toHaveBeenCalledTimes(1);
    expect(onDelayStart).toHaveBeenCalledTimes(1);
    expect(onDelayEnd).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
