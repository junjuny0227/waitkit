import { setupWaitKit } from '@waitkit/core';

import config from '../waitkit.config';

export const controller = setupWaitKit(config, { enabled: import.meta.env.DEV });
