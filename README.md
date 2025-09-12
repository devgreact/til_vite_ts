# Infinity Scroll Loop 리스트

- 스크롤시 추가 목록 구현 (UI가 SNS 서비스에 좋다.)

## 1. /src/services/todoService.ts

- 무한 스크롤 todos 목록 조회기능 추가

```ts
// 무한 스크롤 todo 목록 조회
export const getTodosInfinite = async (
  offset: number = 0,
  limit: number = 5,
): Promise<{ todos: Todo[]; hasMore: boolean; totalCount: number }> => {
  try {
    // 전체 todos 의 Row 개수
    const { count, error: countError } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`getTodosInfinite count 오류 : ${countError.message}`);
    }

    // 무한 스크롤 데이터 조회
    const { data, error: limitError } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (limitError) {
      throw new Error(`getTodosInfinite limit 오류 : ${limitError.message}`);
    }

    // 전체 개수
    const totalCount = count || 0;

    // 앞으로 더 가져올 것이 있는가?
    const hasMore = offset + limit < totalCount;

    // 최종 값을 리턴함.
    return {
      todos: data || [],
      hasMore,
      totalCount,
    };
  } catch (error) {
    console.log(`getTodosInfinite 오류 : ${error}`);
    throw new Error(`getTodosInfinite 오류 : ${error}`);
  }
};
```

## 2. 상태관리(Context State)

- 별도로 구성해서 진행해봄.
- /src/contexts/InfiniteScrollContext.tsx
- 1 번 초기값

```tsx
import type { Todo } from '../types/TodoType';

// 1. 초기값
type InfiniteScrollState = {
  todos: Todo[];
  hasMore: boolean;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
};
const initialState: InfiniteScrollState = {
  todos: [],
  hasMore: false,
  totalCount: 0,
  loading: false,
  loadingMore: false,
};
```

- 2 번 액션타입

```tsx
// 2. Action 타입 정의
enum InfiniteScrollActionType {
  SET_LOADING = 'SET_LOADING',
  SET_LOADING_MORE = 'SET_LOADING_MORE',
  SET_TODOS = 'SET_TODOS',
  APPEND_TODOS = 'APPEND_TODOS',
  ADD_TODO = 'ADD_TODO',
  TOGGLE_TODO = 'TOGGLE_TODO',
  DELETE_TODO = 'DELETE_TODO',
  EDIT_TODO = 'EDIT_TODO',
  RESET = 'RESET',
}

type SetLoadingAction = { type: InfiniteScrollActionType.SET_LOADING; payload: boolean };
type SetLoadingMoreAction = { type: InfiniteScrollActionType.SET_LOADING_MORE; payload: boolean };
type SetTodosAction = {
  type: InfiniteScrollActionType.SET_TODOS;
  payload: { todos: Todo[]; hasMore: boolean; totalCount: number };
};
type AppendTodosAction = {
  type: InfiniteScrollActionType.APPEND_TODOS;
  payload: { todos: Todo[]; hasMore: boolean };
};
type AddAction = {
  type: InfiniteScrollActionType.ADD_TODO;
  payload: { todo: Todo };
};
type ToggleAction = {
  type: InfiniteScrollActionType.TOGGLE_TODO;
  payload: { id: number };
};
type DeleteAction = {
  type: InfiniteScrollActionType.DELETE_TODO;
  payload: { id: number };
};
type EditAction = {
  type: InfiniteScrollActionType.EDIT_TODO;
  payload: { id: number; title: string };
};
type ResetAction = {
  type: InfiniteScrollActionType.RESET;
};

type InfiniteScrollAction =
  | SetLoadingAction
  | SetLoadingMoreAction
  | SetTodosAction
  | AppendTodosAction
  | AddAction
  | ToggleAction
  | EditAction
  | DeleteAction
  | ResetAction;
```

## 3. 리듀서 함수

```tsx
// 3. 리듀서 함수
function reducer(state: InfiniteScrollState, action: InfiniteScrollAction): InfiniteScrollState {
  switch (action.type) {
    case InfiniteScrollActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case InfiniteScrollActionType.SET_LOADING_MORE:
      return { ...state, loadingMore: action.payload };
    case InfiniteScrollActionType.SET_TODOS:
      return {
        ...state,
        todos: action.payload.todos,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
        loading: false,
        loadingMore: false,
      };
    case InfiniteScrollActionType.APPEND_TODOS:
      // 추가
      return {
        ...state,
        todos: [...action.payload.todos, ...state.todos],
        hasMore: action.payload.hasMore,
        loadingMore: false,
      };
    case InfiniteScrollActionType.ADD_TODO:
      return {
        ...state,
        todos: [action.payload.todo, ...state.todos],
        totalCount: state.totalCount + 1,
      };
    case InfiniteScrollActionType.TOGGLE_TODO:
      return {
        ...state,
        todos: state.todos.map(item =>
          item.id === action.payload.id ? { ...item, completed: !item.completed } : item,
        ),
      };
    case InfiniteScrollActionType.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(item => item.id !== action.payload.id),
      };

    case InfiniteScrollActionType.EDIT_TODO:
      return {
        ...state,
        todos: state.todos.map(item =>
          item.id === action.payload.id ? { ...item, title: action.payload.title } : item,
        ),
      };

    case InfiniteScrollActionType.RESET:
      return initialState;

    default:
      return state;
  }
}
```

## 4. Context 생성

```ts
type InfiniteScrollContextValue = {
  todos: Todo[];
  hasMore: boolean;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  loadingIntialTodos: () => Promise<void>;
  loadMoreTodos: () => Promise<void>;
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  editTodo: (id: number, title: string) => void;
  reset: () => void;
};
const InfiniteScrollContext = createContext<InfiniteScrollContextValue | null>(null);
```

## 5. Provider 생성

```tsx
// 5. Provider 생성
// interface InfiniteScrollProviderProps {
//   children?: React.ReactNode;
//   itemsPerPage: number;
// }
interface InfiniteScrollProviderProps extends PropsWithChildren {
  itemsPerPage?: number;
}

export const InfiniteScrollProvider: React.FC<InfiniteScrollProviderProps> = ({
  children,
  itemsPerPage = 5,
}) => {
  // ts 자리
  // useReducer 를 활용
  const [state, dispatch] = useReducer(reducer, initialState);

  // 초기 데이터 로드
  const loadingIntialTodos = async (): Promise<void> => {
    try {
      // 초기로딩 활성화
      dispatch({ type: InfiniteScrollActionType.SET_LOADING, payload: true });
      const result = await getTodosInfinite(0, itemsPerPage);

      console.log(
        '초기로드 된 데이터 ',
        result.todos.map(item => ({
          id: item.id,
          title: item.title,
          create_at: item.created_at,
          user_id: item.user_id,
        })),
      );

      dispatch({
        type: InfiniteScrollActionType.SET_TODOS,
        payload: { todos: result.todos, hasMore: result.hasMore, totalCount: result.totalCount },
      });
    } catch (error) {
      console.log(`초기 데이터 로드 실패 : ${error}`);
      dispatch({ type: InfiniteScrollActionType.SET_LOADING, payload: false });
    }
  };

  // 데이터 더 보기 기능
  const loadMoreTodos = async (): Promise<void> => {
    try {
      dispatch({ type: InfiniteScrollActionType.SET_LOADING_MORE, payload: true });
      const result = await getTodosInfinite(state.todos.length, itemsPerPage);
      console.log(
        '추가로 로드된 데이터 ',
        result.todos.map(item => ({
          id: item.id,
          title: item.title,
          create_at: item.created_at,
          user_id: item.user_id,
        })),
      );

      dispatch({
        type: InfiniteScrollActionType.APPEND_TODOS,
        payload: { todos: result.todos, hasMore: result.hasMore },
      });
    } catch (error) {
      console.log(`추가 데이터 로드 실패 : ${error}`);
      dispatch({ type: InfiniteScrollActionType.SET_LOADING_MORE, payload: false });
    }
  };

  // Todo 추가
  const addTodo = (todo: Todo): void => {
    dispatch({ type: InfiniteScrollActionType.ADD_TODO, payload: { todo } });
  };

  // Todo 토글
  const toggleTodo = (id: number): void => {
    dispatch({ type: InfiniteScrollActionType.TOGGLE_TODO, payload: { id } });
  };

  // Todo 삭제
  const deleteTodo = (id: number): void => {
    dispatch({ type: InfiniteScrollActionType.DELETE_TODO, payload: { id } });
  };

  // Todo 수정
  const editTodo = (id: number, title: string): void => {
    dispatch({ type: InfiniteScrollActionType.EDIT_TODO, payload: { id, title } });
  };

  // Context 상태 초기화
  const reset = (): void => {
    dispatch({ type: InfiniteScrollActionType.RESET });
  };

  // 최초 실행시 데이터 로드
  useEffect(() => {
    loadingIntialTodos();
  }, []);

  const value: InfiniteScrollContextValue = {
    todos: state.todos,
    hasMore: state.hasMore,
    totalCount: state.totalCount,
    loading: state.loading,
    loadingMore: state.loadingMore,
    loadingIntialTodos,
    loadMoreTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    reset,
  };

  // tsx 자리
  return <InfiniteScrollContext.Provider value={value}>{children}</InfiniteScrollContext.Provider>;
};
```

## 6. 커스텀 훅

```tsx
export function useInfiniteScroll(): InfiniteScrollContextValue {
  const ctx = useContext(InfiniteScrollContext);
  if (!ctx) {
    throw new Error('InfiniteScrollContext 컨텍스트가 없어요.');
  }
  return ctx;
}
```

## 7. 전체 Context 코드

```tsx
import {
  act,
  createContext,
  useContext,
  useEffect,
  useReducer,
  type PropsWithChildren,
} from 'react';
import type { Todo } from '../types/TodoType';
import { getTodosInfinite } from '../services/todoService';
import { supabase } from '../lib/supabase';

// 1. 초기값
type InfiniteScrollState = {
  todos: Todo[];
  hasMore: boolean;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
};
const initialState: InfiniteScrollState = {
  todos: [],
  hasMore: false,
  totalCount: 0,
  loading: false,
  loadingMore: false,
};

// 2. Action 타입 정의
enum InfiniteScrollActionType {
  SET_LOADING = 'SET_LOADING',
  SET_LOADING_MORE = 'SET_LOADING_MORE',
  SET_TODOS = 'SET_TODOS',
  APPEND_TODOS = 'APPEND_TODOS',
  ADD_TODO = 'ADD_TODO',
  TOGGLE_TODO = 'TOGGLE_TODO',
  DELETE_TODO = 'DELETE_TODO',
  EDIT_TODO = 'EDIT_TODO',
  RESET = 'RESET',
}

type SetLoadingAction = { type: InfiniteScrollActionType.SET_LOADING; payload: boolean };
type SetLoadingMoreAction = { type: InfiniteScrollActionType.SET_LOADING_MORE; payload: boolean };
type SetTodosAction = {
  type: InfiniteScrollActionType.SET_TODOS;
  payload: { todos: Todo[]; hasMore: boolean; totalCount: number };
};
type AppendTodosAction = {
  type: InfiniteScrollActionType.APPEND_TODOS;
  payload: { todos: Todo[]; hasMore: boolean };
};
type AddAction = {
  type: InfiniteScrollActionType.ADD_TODO;
  payload: { todo: Todo };
};
type ToggleAction = {
  type: InfiniteScrollActionType.TOGGLE_TODO;
  payload: { id: number };
};
type DeleteAction = {
  type: InfiniteScrollActionType.DELETE_TODO;
  payload: { id: number };
};
type EditAction = {
  type: InfiniteScrollActionType.EDIT_TODO;
  payload: { id: number; title: string };
};
type ResetAction = {
  type: InfiniteScrollActionType.RESET;
};

type InfiniteScrollAction =
  | SetLoadingAction
  | SetLoadingMoreAction
  | SetTodosAction
  | AppendTodosAction
  | AddAction
  | ToggleAction
  | EditAction
  | DeleteAction
  | ResetAction;

// 3. 리듀서 함수
function reducer(state: InfiniteScrollState, action: InfiniteScrollAction): InfiniteScrollState {
  switch (action.type) {
    case InfiniteScrollActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case InfiniteScrollActionType.SET_LOADING_MORE:
      return { ...state, loadingMore: action.payload };
    case InfiniteScrollActionType.SET_TODOS:
      return {
        ...state,
        todos: action.payload.todos,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
        loading: false,
        loadingMore: false,
      };
    case InfiniteScrollActionType.APPEND_TODOS:
      // 추가
      return {
        ...state,
        todos: [...action.payload.todos, ...state.todos],
        hasMore: action.payload.hasMore,
        loadingMore: false,
      };
    case InfiniteScrollActionType.ADD_TODO:
      return {
        ...state,
        todos: [action.payload.todo, ...state.todos],
        totalCount: state.totalCount + 1,
      };
    case InfiniteScrollActionType.TOGGLE_TODO:
      return {
        ...state,
        todos: state.todos.map(item =>
          item.id === action.payload.id ? { ...item, completed: !item.completed } : item,
        ),
      };
    case InfiniteScrollActionType.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(item => item.id !== action.payload.id),
      };

    case InfiniteScrollActionType.EDIT_TODO:
      return {
        ...state,
        todos: state.todos.map(item =>
          item.id === action.payload.id ? { ...item, title: action.payload.title } : item,
        ),
      };

    case InfiniteScrollActionType.RESET:
      return initialState;

    default:
      return state;
  }
}
// 4. Context 생성
type InfiniteScrollContextValue = {
  todos: Todo[];
  hasMore: boolean;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  loadingIntialTodos: () => Promise<void>;
  loadMoreTodos: () => Promise<void>;
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  editTodo: (id: number, title: string) => void;
  reset: () => void;
};
const InfiniteScrollContext = createContext<InfiniteScrollContextValue | null>(null);

// 5. Provider 생성
// interface InfiniteScrollProviderProps {
//   children?: React.ReactNode;
//   itemsPerPage: number;
// }
interface InfiniteScrollProviderProps extends PropsWithChildren {
  itemsPerPage?: number;
}

export const InfiniteScrollProvider: React.FC<InfiniteScrollProviderProps> = ({
  children,
  itemsPerPage = 5,
}) => {
  // ts 자리
  // useReducer 를 활용
  const [state, dispatch] = useReducer(reducer, initialState);

  // 초기 데이터 로드
  const loadingIntialTodos = async (): Promise<void> => {
    try {
      // 초기로딩 활성화
      dispatch({ type: InfiniteScrollActionType.SET_LOADING, payload: true });
      const result = await getTodosInfinite(0, itemsPerPage);

      console.log(
        '초기로드 된 데이터 ',
        result.todos.map(item => ({
          id: item.id,
          title: item.title,
          create_at: item.created_at,
          user_id: item.user_id,
        })),
      );

      dispatch({
        type: InfiniteScrollActionType.SET_TODOS,
        payload: { todos: result.todos, hasMore: result.hasMore, totalCount: result.totalCount },
      });
    } catch (error) {
      console.log(`초기 데이터 로드 실패 : ${error}`);
      dispatch({ type: InfiniteScrollActionType.SET_LOADING, payload: false });
    }
  };

  // 데이터 더 보기 기능
  const loadMoreTodos = async (): Promise<void> => {
    try {
      dispatch({ type: InfiniteScrollActionType.SET_LOADING_MORE, payload: true });
      const result = await getTodosInfinite(state.todos.length, itemsPerPage);
      console.log(
        '추가로 로드된 데이터 ',
        result.todos.map(item => ({
          id: item.id,
          title: item.title,
          create_at: item.created_at,
          user_id: item.user_id,
        })),
      );

      dispatch({
        type: InfiniteScrollActionType.APPEND_TODOS,
        payload: { todos: result.todos, hasMore: result.hasMore },
      });
    } catch (error) {
      console.log(`추가 데이터 로드 실패 : ${error}`);
      dispatch({ type: InfiniteScrollActionType.SET_LOADING_MORE, payload: false });
    }
  };

  // Todo 추가
  const addTodo = (todo: Todo): void => {
    dispatch({ type: InfiniteScrollActionType.ADD_TODO, payload: { todo } });
  };

  // Todo 토글
  const toggleTodo = (id: number): void => {
    dispatch({ type: InfiniteScrollActionType.TOGGLE_TODO, payload: { id } });
  };

  // Todo 삭제
  const deleteTodo = (id: number): void => {
    dispatch({ type: InfiniteScrollActionType.DELETE_TODO, payload: { id } });
  };

  // Todo 수정
  const editTodo = (id: number, title: string): void => {
    dispatch({ type: InfiniteScrollActionType.EDIT_TODO, payload: { id, title } });
  };

  // Context 상태 초기화
  const reset = (): void => {
    dispatch({ type: InfiniteScrollActionType.RESET });
  };

  // 최초 실행시 데이터 로드
  useEffect(() => {
    loadingIntialTodos();
  }, []);

  const value: InfiniteScrollContextValue = {
    todos: state.todos,
    hasMore: state.hasMore,
    totalCount: state.totalCount,
    loading: state.loading,
    loadingMore: state.loadingMore,
    loadingIntialTodos,
    loadMoreTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    reset,
  };

  // tsx 자리
  return <InfiniteScrollContext.Provider value={value}>{children}</InfiniteScrollContext.Provider>;
};

// 6. 커스텀 훅
export function useInfiniteScroll(): InfiniteScrollContextValue {
  const ctx = useContext(InfiniteScrollContext);
  if (!ctx) {
    throw new Error('InfiniteScrollContext 컨텍스트가 없어요.');
  }
  return ctx;
}
```

## 8. 활용

- /src/pages/TodosInfinitePage.tsx 생성

## 9. 라우터 추가

- App.tsx

```tsx
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';
import TodosPage from './pages/TodosPage';
import AuthCallback from './pages/AuthCallback';
import Protected from './components/Protected';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import TodosInfinitePage from './pages/TodosInfinitePage';

const TopBar = () => {
  const { signOut, user } = useAuth();
  // 관리자인 경우 메뉴 추가로 출력하기
  // isAdmin 에는 true/false
  const isAdmin = user?.email === 'tarolong@naver.com';

  return (
    <nav style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', padding: 40 }}>
      <Link to="/">홈</Link>
      {user && <Link to="/todos">할일</Link>}
      {user && <Link to="/todos-infinite">무한스크롤 할일</Link>}
      {!user && <Link to="/signup">회원가입</Link>}
      {!user && <Link to="/signin">로그인</Link>}
      {user && <Link to="/profile">프로필</Link>}
      {user && <button onClick={signOut}>로그아웃</button>}

      {isAdmin && <Link to="/admin">관리자</Link>}
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <div>
        <h1>Todo Service</h1>
        <Router>
          <TopBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/todos"
              element={
                <Protected>
                  <TodosPage />
                </Protected>
              }
            />
            <Route
              path="/todos-infinite"
              element={
                <Protected>
                  <TodosInfinitePage />
                </Protected>
              }
            />

            <Route
              path="/profile"
              element={
                <Protected>
                  <ProfilePage />
                </Protected>
              }
            />

            <Route
              path="/admin"
              element={
                <Protected>
                  <AdminPage />
                </Protected>
              }
            />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
```
