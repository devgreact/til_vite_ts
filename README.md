# React Infinite Scroll Todo App

`react-infinite-scroll-component`를 사용한 안정적이고 자연스러운 무한 스크롤 Todo 애플리케이션입니다.

## 🚀 주요 기능

- **무한 스크롤**: 스크롤 시 자동으로 다음 데이터 로드
- **실시간 CRUD**: 할일 추가, 수정, 삭제, 완료 상태 변경
- **사용자 인증**: Supabase Auth 기반 로그인/회원가입
- **반응형 UI**: 깔끔하고 직관적인 사용자 인터페이스

## 📦 사용된 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **상태관리**: React Context API + useReducer
- **무한스크롤**: react-infinite-scroll-component
- **백엔드**: Supabase (PostgreSQL + Auth)
- **스타일링**: Inline CSS + CSS 애니메이션

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. react-infinite-scroll-component 설치

```bash
npm install react-infinite-scroll-component
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 Supabase 설정을 추가하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── todos/          # Todo 관련 컴포넌트
│   └── shop/           # 쇼핑몰 관련 컴포넌트
├── contexts/           # React Context 상태관리
│   ├── AuthContext.tsx
│   └── InfiniteScrollContext.tsx
├── pages/              # 페이지 컴포넌트
│   └── TodosInfinitePage.tsx
├── services/           # API 서비스
│   └── todoService.ts
├── types/              # TypeScript 타입 정의
│   └── TodoType.ts
└── lib/                # 유틸리티 및 설정
    ├── supabase.ts
    └── profile.ts
```

## 🔧 무한 스크롤 구현

### 1. react-infinite-scroll-component 기본 사용법

```tsx
import InfiniteScroll from 'react-infinite-scroll-component';

<InfiniteScroll
  dataLength={todos.length} // 현재 로드된 데이터 개수
  next={loadMoreTodos} // 다음 데이터 로드 함수
  hasMore={hasMore} // 더 불러올 데이터가 있는지
  loader={<LoadingSpinner />} // 로딩 중 표시할 UI
  endMessage={<EndMessage />} // 모든 데이터 로드 완료 시 UI
>
  {todos.map(todo => (
    <TodoItem key={todo.id} todo={todo} />
  ))}
</InfiniteScroll>;
```

### 2. 고정 높이 컨테이너로 스크롤바 보장

```tsx
<div style={{ height: '600px', overflow: 'auto' }}>
  <InfiniteScroll
    dataLength={todos.length}
    next={loadMoreTodos}
    hasMore={hasMore}
    loader={...}
    endMessage={...}
  >
    {/* 할일 목록 */}
  </InfiniteScroll>
</div>
```

### 3. Context 기반 상태 관리

```tsx
// InfiniteScrollContext.tsx
const {
  todos, // 현재 로드된 할일 목록
  hasMore, // 더 불러올 데이터가 있는지
  loadingMore, // 추가 데이터 로딩 중인지
  loadMoreTodos, // 다음 데이터 로드 함수
  addTodo, // 할일 추가
  editTodo, // 할일 수정
  deleteTodo, // 할일 삭제
  toggleTodo, // 완료 상태 토글
} = useInfiniteScroll();
```

## 🎨 UI/UX 특징

### 로딩 인디케이터

- 회전하는 스피너 애니메이션
- 카드 스타일의 깔끔한 디자인
- 그림자 효과로 시각적 깊이감

### 완료 메시지

- 모든 데이터 로드 완료 시 표시
- 이모지와 함께 직관적인 메시지

### CSS 애니메이션

```css
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

## 📊 데이터 흐름

1. **초기 로드**: 컴포넌트 마운트 시 첫 10개 할일 로드
2. **스크롤 감지**: `react-infinite-scroll-component`가 자동으로 스크롤 위치 감지
3. **데이터 요청**: 스크롤이 하단에 도달하면 `loadMoreTodos()` 호출
4. **상태 업데이트**: Context를 통해 새로운 데이터를 기존 목록에 추가
5. **UI 업데이트**: 자동으로 새로운 할일들이 화면에 표시

## 🔄 API 연동

### Supabase 서비스 함수

```tsx
// todoService.ts
export const getTodosInfinite = async (
  offset: number = 0,
  limit: number = 10,
): Promise<{ todos: Todo[]; hasMore: boolean; totalCount: number }> => {
  // Supabase에서 페이지네이션된 데이터 조회
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    todos: data || [],
    hasMore: offset + limit < totalCount,
    totalCount: count || 0,
  };
};
```

## 🚀 성능 최적화

### 1. IntersectionObserver 기반

- `react-infinite-scroll-component`는 내부적으로 IntersectionObserver 사용
- 스크롤 이벤트보다 성능이 우수
- 브라우저 네이티브 API 활용

### 2. 고정 높이 컨테이너

- 600px 고정 높이로 스크롤바 보장
- 데이터가 적어도 무한 스크롤 작동
- `overflow: auto`로 스크롤 영역 확보

### 3. 메모리 효율성

- 필요한 만큼만 데이터 로드
- 기존 데이터는 Context에서 관리
- 불필요한 리렌더링 최소화

## 🔧 주요 설정

### InfiniteScroll 컴포넌트 속성

```tsx
<InfiniteScroll
  dataLength={todos.length}     // 필수: 현재 데이터 개수
  next={loadMoreTodos}          // 필수: 다음 데이터 로드 함수
  hasMore={hasMore}             // 필수: 더 불러올 데이터 여부
  loader={...}                  // 로딩 중 UI
  endMessage={...}              // 완료 시 UI
  scrollableTarget="scrollableDiv" // 스크롤 대상 (선택사항)
  height={600}                  // 고정 높이 (선택사항)
>
```

### Context Provider 설정

```tsx
<InfiniteScrollProvider itemsPerPage={10}>
  <TodosInfinitePage />
</InfiniteScrollProvider>
```

## 🎯 핵심 장점

1. **안정성**: 검증된 라이브러리로 예측 가능한 동작
2. **간단함**: 복잡한 스크롤 이벤트 처리 불필요
3. **성능**: IntersectionObserver 기반 최적화
4. **스크롤바 보장**: 고정 높이로 데이터가 적어도 작동
5. **유지보수**: 깔끔한 코드 구조와 명확한 책임 분리

## 📝 주요 파일 설명

- **`TodosInfinitePage.tsx`**: 무한 스크롤 Todo 페이지 메인 컴포넌트
- **`InfiniteScrollContext.tsx`**: 무한 스크롤 상태 관리 Context
- **`todoService.ts`**: Supabase API 연동 서비스
- **`TodoType.ts`**: TypeScript 타입 정의

---

이 프로젝트는 `react-infinite-scroll-component`를 활용하여 안정적이고 사용자 친화적인 무한 스크롤 경험을 제공합니다. 고정 높이 컨테이너를 통해 데이터가 적어도 스크롤바가 생성되어 무한 스크롤이 정상 작동합니다.
