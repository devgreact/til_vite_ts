import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { InfiniteScrollProvider, useInfiniteScroll } from '../contexts/InfiniteScrollContext';
import type { Profile, Todo, TodoInsert } from '../types/TodoType';
import { getProfile } from '../lib/profile';
import InfiniteScroll from 'react-infinite-scroll-component';
// 용서하세요. 입력창 컴포넌트
const InfiniteTodoWrite = () => {
  const { addTodo, loadingIntialTodos } = useInfiniteScroll();

  const [title, setTitle] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };
  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      alert('제목을 입력하세요');
      return;
    }
    try {
      // 새할일 추가
      await addTodo(title);
      // 다시 데이터를 로딩한다.
      await loadingIntialTodos();
      setTitle('');
    } catch (error) {
      console.log('등록에 오류가 발생 : ', error);
      alert(`등록에 오류가 발생 : ${error}`);
    }
  };
  return (
    <div>
      <h3>할일 작성</h3>
      <div>
        <input
          type="text"
          value={title}
          onChange={e => handleChange(e)}
          onKeyDown={e => handleKeyDown(e)}
          placeholder="할일을 입력하세요."
        />
        <button onClick={handleSave}>등록</button>
      </div>
    </div>
  );
};

// 용서하세요. 목록 컴포넌트
const InfiniteTodoList = () => {
  const {
    loading,
    loadingMore,
    hasMore,
    loadMoreTodos,
    todos,
    totalCount,
    editTodo,
    toggleTodo,
    deleteTodo,
    loadingIntialTodos,
  } = useInfiniteScroll();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // 사용자 프로필 가져오기
  useEffect(() => {
    const loadProifle = async () => {
      if (user?.id) {
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
      }
    };
    loadProifle();
  }, [user?.id]);

  // 번호 계산 함수 (최신글이 높은 번호가지도록 )
  const getGlobalIndex = (index: number) => {
    // 무한스크롤시에 계산 해서 번호 출력
    const globalIndex = totalCount - index;
    // console.log(
    //   `번호 계산 - index : ${index}, totalCount : ${totalCount}, globalIndex: ${globalIndex}`,
    // );
    return globalIndex;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 수정 상태 관리
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  // 수정 시작
  const handleEditStart = (todo: any) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditSave = async (id: number) => {
    if (!editingTitle.trim()) {
      alert('제목을 입력하세요.');
      return;
    }
    try {
      editTodo(id, editingTitle);
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.log(error);
      alert('수정에 실패했습니다.');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      // Context 의 state 를 업데이트
      await toggleTodo(id);
    } catch (error) {
      console.log('토글 실패 : ', error);
      alert('상태 변경에 실패하였습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        // id 를 삭제
        await deleteTodo(id);
        // 삭제 이후에 번호를 갱신해서 정리해줌
        await loadingIntialTodos();
      } catch (error) {
        console.log('삭제에 실패하였습니다.');
        alert('삭제에 실패하였습니다.');
      }
    }
  };

  if (loading) {
    return <div>데이터 로딩중 ...</div>;
  }
  return (
    <div>
      <h3>TodoList(무한 스크롤) {profile?.nickname && <span>{profile.nickname}님의 할일</span>}</h3>
      {todos.length === 0 ? (
        <p>등록된 할일이 없습니다.</p>
      ) : (
        <div style={{ height: '600px', overflow: 'auto' }}>
          <InfiniteScroll
            dataLength={todos.length}
            next={loadMoreTodos}
            hasMore={hasMore}
            loader={
              <div
                style={{
                  color: '#007bff',
                  fontSize: '16px',
                  textAlign: 'center',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  margin: '10px 0',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #007bff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  🔄 더 많은 할 일을 불러오는 중...
                </div>
              </div>
            }
            endMessage={
              <div
                style={{
                  color: '#6c757d',
                  fontSize: '16px',
                  textAlign: 'center',
                  padding: '20px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '8px',
                  margin: '10px 0',
                  border: '1px solid #dee2e6',
                }}
              >
                ✅ 모든 데이터를 불러왔습니다.
              </div>
            }
          >
            <ul>
              {todos.map((item, index) => (
                <li key={item.id}>
                  {/* 번호표시 */}
                  <span>{getGlobalIndex(index)}</span>
                  {/* 체크박스 */}
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggle(item.id)}
                  />
                  {/* 제목과 날짜출력 */}
                  <div>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleEditSave(item.id);
                          } else if (e.key === 'Escape') {
                            handleEditCancel();
                          }
                        }}
                      />
                    ) : (
                      <span>{item.title}</span>
                    )}

                    <span>작성이 : {formatDate(item.created_at)}</span>
                  </div>
                  {/* 버튼들 */}
                  {editingId === item.id ? (
                    <>
                      <button onClick={() => handleEditSave(item.id)}>저장</button>
                      <button onClick={handleEditCancel}>취소</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditStart(item)}>수정</button>
                      <button onClick={() => handleDelete(item.id)}>삭제</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </InfiniteScroll>
        </div>
      )}

      {/* CSS 애니메이션을 위한 스타일 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

function TodosInfinitePage() {
  return (
    <InfiniteScrollProvider itemsPerPage={10}>
      <div>
        <h2>무한 스크롤 Todo 목록</h2>
        <div>
          <InfiniteTodoWrite />
        </div>
        <div>
          <InfiniteTodoList />
        </div>
      </div>
    </InfiniteScrollProvider>
  );
}

export default TodosInfinitePage;
