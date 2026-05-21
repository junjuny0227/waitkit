import { createContext } from 'react';

import type { WaitKitReactStore } from './wait-kit-store';

export const WaitKitContext = createContext<WaitKitReactStore | null>(null);
