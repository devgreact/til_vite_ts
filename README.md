# Supabase 회원 탈퇴

- 기본 제공되는 탈퇴 기능
  - `supabase.auth.admin.deleteUser()`
    - 관리자 전용 (서버에서만 실행됨)
    - react 는 클라이언트 즉, 웹브라우저 전용이라서 실행불가
    - 보안상 위험 : 실수로 지울 가능성
    - 복구 불가
- 탈퇴 기능
  - 사용자 비활성
  - 30일 후 삭제 일반적 진행

## 1. React 에서는 관리자가 수작업으로 삭제

- profiles 및 사용자가 등록한 테이블에서 제거 진행
- 사용자 삭제 수작업 실행
- `탈퇴신청한 사용자 목록을 관리할 테이블`이 필요

## 2. DB 테이블 생성 및 업데이트 진행

- 탈퇴신청 사용자 테이블(SQL Editor)

```sql
-- Supabase Dashboard에서 실행
CREATE TABLE account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);
```

```sql
-- 탈퇴신청한 사용자 목록 테이블
CREATE TABLE account_deletion_requests (
  -- PK 이고 , DEFAULT gen_random_uuid() 중복 안되는 ID 생성
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- auth.users(id) 가 삭제되면 같이 삭제해줌.
  -- 관리자가 수작업으로 삭제하면 같이 삭제
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 탈퇴 신청자의 email 을 담아둠.
  user_email TEXT NOT NULL,

  -- 신청한 날짜
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 어떤 사유인지
  reason TEXT,

  -- status :  현재 탈퇴 신청 진행 상태
  -- 기본으로 pending :  처리중
  -- 탈퇴 승인 approved : 승인
  -- 탈퇴 거부 rejected : 거절
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- 관리자가 메시지를 남겨서 승인/거절 사유등을 기록 함
  admin_notes TEXT,

  -- 요청을 처리한 시간
  processed_at TIMESTAMP WITH TIME ZONE,

  -- 요청을 처리한 관리자 ID
  processed_by UUID REFERENCES auth.users(id)
);
```

## 3. 더미 회원 가입 시키기

- https://tmailor.com/ko
- 5명 정도 가입 시킴

## 4. 관리자와 일반 회원을 구분합니다.
