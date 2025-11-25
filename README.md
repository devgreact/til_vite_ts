# JWT

## 1. 개념

- JavaScript Web Token
- `String` 이고, 모양이 json 형태다. (javaScript Object Notation)
- `{키명:키값...}`
- `디지털 입장권`처럼 자료요청, 자료등록등에 서버에 작업시 요청시 활용

## 2. 토근의 종류

### 2.1. Access Token

- 서버에 자료 요청 및 자료 등록시 활용되는 토큰
- 유효기간이 존재함.

### 2.2. Refresh Token

- 유효기간이 만료시에 Access Token 을 재요청하기 위한 토큰

### 2.3. 토근의 흐름

- Access Token > 유효기간 만료시 > Refresh Token > Access Token 재발급

## 3. 발급 받은 토근 보관 장소

- 웹브라우저 : Cookie
- 웹브라우저 : LocalStorage
- Redux 에서는 redux-persist 라이브러리로 LocalStorage 에 보관

## 4. 토큰 사용법

### 4.1. 일반적으로 axios 를 활용함.

### 4.2. 일반적으로 axios의 intercepter 를 활용함.

- 자동으로 Access 또는 Refresh 토큰들을 포함해서 요청, 등록 을 진행

### 4.3. Access 토큰 활용예

```ts
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://example.com/api',
});

// 요청 인터셉터
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
```

### 4.4. Refresh 토큰 활용하기

```ts
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response.status === 401) {
      const refresh = localStorage.getItem('refreshToken');

      // 새 토큰 요청
      const res = await axios.post('/auth/refresh', { refresh });

      localStorage.setItem('accessToken', res.data.newAccessToken);

      // 원래 요청 다시 보내기
      error.config.headers.Authorization = `Bearer ${res.data.newAccessToken}`;
      return api(error.config);
    }

    return Promise.reject(error);
  },
);
```
