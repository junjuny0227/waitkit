// Type-level compatibility with MSW 2 (installed as the `msw2` alias). Checked by `tsc`.
import { HttpResponse, http } from 'msw2';
import { expectTypeOf, it } from 'vitest';

import { withWaitKit } from '../src';

it('MSW 2 핸들러에서도 resolver 인자 타입이 추론된다', () => {
  http.get(
    '/users/:id',
    withWaitKit({ delay: [100, 300], error: { rate: 0.1 } }, ({ request, params }) => {
      expectTypeOf(request).toExtend<Request>();
      expectTypeOf(params.id).toEqualTypeOf<string | readonly string[] | undefined>();
      return HttpResponse.json({ id: params.id });
    }),
  );
});
