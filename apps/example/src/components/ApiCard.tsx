import { useFetch } from '../hooks/use-fetch';

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

interface Post {
  id: number;
  title: string;
  body: string;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface ApiCardProps {
  title: string;
  url: string;
  renderItem: (item: unknown) => React.ReactNode;
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-3 bg-zinc-700 rounded w-2/3" />
          <div className="h-3 bg-zinc-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ApiCard({ title, url, renderItem }: ApiCardProps) {
  const { state, reload } = useFetch<unknown[]>(url);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">{title}</h2>
        <button
          onClick={reload}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
        >
          reload
        </button>
      </div>

      <div className="min-h-[96px]">
        {state.status === 'idle' && <p className="text-xs text-zinc-600">대기 중</p>}

        {state.status === 'loading' && <Skeleton />}

        {state.status === 'error' && (
          <div className="flex items-start gap-2 text-red-400">
            <span className="text-base leading-none mt-0.5">✕</span>
            <p className="text-xs leading-relaxed break-all">{state.message}</p>
          </div>
        )}

        {state.status === 'success' && (
          <ul className="space-y-2">
            {state.data.slice(0, 3).map((item, i) => (
              <li key={i} className="text-xs text-zinc-400 leading-relaxed">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-zinc-800">
        <span
          className={[
            'inline-block w-1.5 h-1.5 rounded-full',
            state.status === 'loading' && 'bg-yellow-400 animate-pulse',
            state.status === 'success' && 'bg-green-400',
            state.status === 'error' && 'bg-red-400',
            state.status === 'idle' && 'bg-zinc-600',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className="text-[10px] text-zinc-600">
          {state.status === 'loading' && '요청 중…'}
          {state.status === 'success' && `${state.data.length}개 항목`}
          {state.status === 'error' && '오류 발생'}
          {state.status === 'idle' && '대기'}
        </span>
        <span className="ml-auto text-[10px] text-zinc-700 font-mono">{url}</span>
      </div>
    </div>
  );
}

export function UsersCard() {
  return (
    <ApiCard
      title="Users"
      url="/api/users"
      renderItem={(item) => {
        const u = item as User;
        return (
          <>
            <span className="text-zinc-300 font-medium">{u.name}</span>
            <span className="text-zinc-600"> · {u.email}</span>
          </>
        );
      }}
    />
  );
}

export function PostsCard() {
  return (
    <ApiCard
      title="Posts"
      url="/api/posts"
      renderItem={(item) => {
        const p = item as Post;
        return (
          <>
            <span className="text-zinc-300 font-medium line-clamp-1">{p.title}</span>
            <p className="text-zinc-600 line-clamp-1">{p.body}</p>
          </>
        );
      }}
    />
  );
}

export function TodosCard() {
  return (
    <ApiCard
      title="Todos"
      url="/api/todos"
      renderItem={(item) => {
        const t = item as Todo;
        return (
          <span className={t.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}>
            {t.title}
          </span>
        );
      }}
    />
  );
}
