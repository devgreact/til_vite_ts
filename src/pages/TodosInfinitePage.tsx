import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { InfiniteScrollProvider, useInfiniteScroll } from '../contexts/InfiniteScrollContext';
import type { Profile } from '../types/TodoType';
import { getProfile } from '../lib/profile';
// 용서하세요. 입력창 컴포넌트
const InfiniteTodoWrite = () => {
  return <div>입력창</div>;
};

// 용서하세요. 목록 컴포넌트
const InfiniteTodoList = () => {
  const { loading, todos, totalCount, editTodo, toggleTodo, deleteTodo } = useInfiniteScroll();
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
    console.log(
      `번호 계산 - index : ${index}, totalCount : ${totalCount}, globalIndex: ${globalIndex}`,
    );
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

  if (loading) {
    return <div>데이터 로딩중 ...</div>;
  }
  return (
    <div>
      <h3>TodoList(무한 스크롤) {profile?.nickname && <span>{profile.nickname}님의 할일</span>}</h3>
      {todos.length === 0 ? (
        <p>등록된 할일이 없습니다.</p>
      ) : (
        <div>
          <ul>
            {todos.map((item, index) => (
              <li key={item.id}>
                {/* 번호표시 */}
                <span>{getGlobalIndex(index)}</span>
                {/* 체크박스 */}
                <input type="checkbox" checked={item.completed} />
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
                    <button>삭제</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

function TodosInfinitePage() {
  return (
    <InfiniteScrollProvider itemsPerPage={5}>
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
