import { WaitKitDevTools, WaitKitProvider } from '@waitkit/react';

import { PostsCard, TodosCard, UsersCard } from './components/ApiCard';
import { controller, SCENARIO_NAMES } from './waitkit';

export default function App() {
  return (
    <WaitKitProvider controller={controller} scenarioNames={SCENARIO_NAMES}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">Waitkit</span>
            <span className="text-zinc-600 text-sm">예제 앱</span>
            <span className="ml-auto text-xs text-zinc-600">
              DevTools 패널로 scenario를 바꿔보세요 →
            </span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-100">API 요청 시뮬레이션</h1>
            <p className="mt-1 text-sm text-zinc-500">
              우측 하단 패널에서 scenario를 선택하면 각 카드의 요청 상태가 바뀝니다. reload 버튼으로
              재요청할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UsersCard />
            <PostsCard />
            <TodosCard />
          </div>

          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Scenario 안내
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="text-zinc-300 font-mono w-32 shrink-0">slow-network</span>
                <span className="text-zinc-500">모든 /api/ 요청에 2초 delay 적용</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-300 font-mono w-32 shrink-0">server-error</span>
                <span className="text-zinc-500">모든 /api/ 요청에 500 에러 응답 반환</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-300 font-mono w-32 shrink-0">timeout</span>
                <span className="text-zinc-500">모든 /api/ 요청을 3초 후 timeout 처리</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-500 font-mono w-32 shrink-0">(없음)</span>
                <span className="text-zinc-500">실제 JSONPlaceholder API 요청 통과</span>
              </li>
            </ul>
          </div>
        </main>
      </div>

      <WaitKitDevTools />
    </WaitKitProvider>
  );
}
