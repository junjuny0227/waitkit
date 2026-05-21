import { describe, expect, it } from 'vitest';

import { createErrorResponse } from '../src/response';

describe('createErrorResponse', () => {
  it('creates JSON responses with default content-type', async () => {
    const response = createErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'x-waitkit': 'test' },
      body: { message: 'Invalid input' },
    });

    expect(response.status).toBe(422);
    expect(response.statusText).toBe('Unprocessable Entity');
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('x-waitkit')).toBe('test');
    expect(await response.json()).toEqual({ message: 'Invalid input' });
  });

  it('preserves explicit content-type headers', async () => {
    const response = createErrorResponse({
      headers: { 'content-type': 'application/problem+json' },
      body: { message: 'Conflict' },
    });

    expect(response.headers.get('content-type')).toBe('application/problem+json');
    expect(await response.json()).toEqual({ message: 'Conflict' });
  });

  it('uses the runtime Response default statusText when omitted', () => {
    const response = createErrorResponse({ status: 503 });
    const nativeResponse = new Response(null, { status: 503 });

    expect(response.status).toBe(503);
    expect(response.statusText).toBe(nativeResponse.statusText);
  });

  it('creates text responses', async () => {
    const response = createErrorResponse({
      body: 'Unavailable',
    });

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Unavailable');
  });

  it('creates URLSearchParams responses', async () => {
    const response = createErrorResponse({
      body: new URLSearchParams({ error: 'invalid' }),
    });

    expect(await response.text()).toBe('error=invalid');
  });

  it('creates binary responses', async () => {
    const response = createErrorResponse({
      body: new TextEncoder().encode('binary'),
    });

    expect(await response.text()).toBe('binary');
  });

  it('wraps response creation failures with WaitKit context', () => {
    const body: { self?: unknown } = {};
    body.self = body;

    let error: unknown;

    try {
      createErrorResponse({ body });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error).toHaveProperty(
      'message',
      expect.stringContaining('WaitKit failed to create simulated error response'),
    );
    expect(error).toHaveProperty('cause');
  });
});
