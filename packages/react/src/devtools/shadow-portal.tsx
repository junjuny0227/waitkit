import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ShadowPortalProps {
  css: string;
  children: ReactNode;
}

const HOST_TAG = 'waitkit-devtools';

function createShadowRoot(): ShadowRoot | null {
  if (typeof document === 'undefined') return null;
  return document.createElement(HOST_TAG).attachShadow({ mode: 'open' });
}

/**
 * Renders children into an open shadow root attached to `document.body`, so the host app's
 * CSS cannot style the panel and the panel's CSS cannot leak into the app. Renders nothing
 * on the server.
 */
export function ShadowPortal({ css, children }: ShadowPortalProps): ReactNode {
  const [shadowRoot] = useState(createShadowRoot);

  useEffect(() => {
    if (shadowRoot === null) return undefined;
    document.body.append(shadowRoot.host);
    return () => shadowRoot.host.remove();
  }, [shadowRoot]);

  if (shadowRoot === null) return null;

  return createPortal(
    <>
      <style>{css}</style>
      {children}
    </>,
    shadowRoot,
  );
}
