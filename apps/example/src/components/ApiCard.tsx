import { type ReactNode, useState } from 'react';

import { useFetch } from '../hooks/use-fetch';

interface User {
  id: number;
  name: string;
  email: string;
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

interface ApiCardProps<T extends { id: number }> {
  title: string;
  url: string;
  renderItem: (item: T) => ReactNode;
}

const SKELETON_ROWS = ['first', 'second', 'third'];

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {SKELETON_ROWS.map((row) => (
        <div key={row} className="space-y-1">
          <div className="h-3 bg-zinc-700 rounded w-2/3" />
          <div className="h-3 bg-zinc-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

const statusDot = {
  loading: 'bg-yellow-400 animate-pulse',
  success: 'bg-green-400',
  error: 'bg-red-400',
} as const;

function ApiCard<T extends { id: number }>(props: ApiCardProps<T>) {
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">
          {props.title}
        </h2>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
        >
          reload
        </button>
      </div>

      {/* A new key remounts the body, which aborts the previous request and starts a new one. */}
      <ApiCardBody key={attempt} {...props} />
    </div>
  );
}

function ApiCardBody<T extends { id: number }>({ url, renderItem }: ApiCardProps<T>) {
  const state = useFetch<T[]>(url);

  return (
    <>
      <div className="min-h-[96px]">
        {state.status === 'loading' && <Skeleton />}

        {state.status === 'error' && (
          <div className="flex items-start gap-2 text-red-400">
            <span className="text-base leading-none mt-0.5">✕</span>
            <p className="text-xs leading-relaxed break-all">{state.message}</p>
          </div>
        )}

        {state.status === 'success' && (
          <ul className="space-y-2">
            {state.data.slice(0, 3).map((item) => (
              <li key={item.id} className="text-xs text-zinc-400 leading-relaxed">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-zinc-800">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[state.status]}`} />
        <span className="text-[10px] text-zinc-600">
          {state.status === 'loading' && '요청 중…'}
          {state.status === 'success' && `${state.data.length}개 항목`}
          {state.status === 'error' && '오류 발생'}
        </span>
        <span className="ml-auto text-[10px] text-zinc-700 font-mono">{url}</span>
      </div>
    </>
  );
}

export function UsersCard() {
  return (
    <ApiCard<User>
      title="Users"
      url="/api/users"
      renderItem={(user) => (
        <>
          <span className="text-zinc-300 font-medium">{user.name}</span>
          <span className="text-zinc-600"> · {user.email}</span>
        </>
      )}
    />
  );
}

export function PostsCard() {
  return (
    <ApiCard<Post>
      title="Posts"
      url="/api/posts"
      renderItem={(post) => (
        <>
          <span className="text-zinc-300 font-medium line-clamp-1">{post.title}</span>
          <p className="text-zinc-600 line-clamp-1">{post.body}</p>
        </>
      )}
    />
  );
}

export function TodosCard() {
  return (
    <ApiCard<Todo>
      title="Todos"
      url="/api/todos"
      renderItem={(todo) => (
        <span className={todo.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}>
          {todo.title}
        </span>
      )}
    />
  );
}
