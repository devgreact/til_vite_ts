# Editor 와 파일 삭제

## 1. 게시글 삭제시 파일도 같이 삭제

## 2. 게시글 수정시 파일 삭제와 추가

## 3. RichTextEditor 이미지 삭제 문제 해결

### 문제점

- RichTextEditor에서 이미지 삭제 시 잘못된 이미지가 삭제되는 문제
- 삭제 후 업로드 시 이미지 순서가 맞지 않는 문제

### 해결 방법

1. **이미지 삽입 시 고유 ID 추가**
   - 각 이미지에 `data-temp-id` 속성 추가
   - 정확한 이미지 매칭을 위한 고유 식별자 생성

2. **동기화 로직 개선**
   - 에디터 내용에서 `blob:` URL을 순서대로 추출
   - `tempImagesRef.current` 배열을 에디터 순서에 맞춰 재정렬
   - 삭제된 이미지는 배열에서 완전히 제거하고 메모리 정리

3. **디버깅 강화**
   - 이미지 추가/삭제 시 콘솔 로그 추가
   - 업로드할 이미지 파일 목록 추적 가능

### 변경된 파일

- `src/components/RichTextEditor.tsx`
  - `syncTempImages` 함수 개선
  - 이미지 삽입 시 `data-temp-id` 속성 추가
  - `onImagesChange` 의존성 개선 (`value` 기반으로 변경)
