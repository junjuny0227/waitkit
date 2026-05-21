import type { WaitKitErrorResponse } from "./types";

export function createErrorResponse(
  errorResponse: WaitKitErrorResponse | undefined,
): Response {
  const status = errorResponse?.status ?? 500;
  const headers = new Headers(errorResponse?.headers);
  const body = serializeBody(errorResponse?.body, headers);

  return new Response(body, {
    status,
    statusText: errorResponse?.statusText,
    headers,
  });
}

function serializeBody(body: unknown, headers: Headers): BodyInit | null {
  if (body === undefined || body === null) {
    return null;
  }

  if (typeof body === "string" || isBlob(body) || isFormData(body)) {
    return body;
  }

  if (
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    isUrlSearchParams(body)
  ) {
    return body as BodyInit;
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return JSON.stringify(body);
}

function isBlob(body: unknown): body is Blob {
  return typeof Blob !== "undefined" && body instanceof Blob;
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isUrlSearchParams(body: unknown): body is URLSearchParams {
  return (
    typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams
  );
}
