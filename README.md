# Reference
## 기본
- [ts+express 세팅](https://blog.logrocket.com/how-to-set-up-node-typescript-express/)
- https://velog.io/@superlipbalm/full-stack-typescript-with-trpc-and-react
- https://www.robinwieruch.de/typescript-node/


## DB
- [mongoose + typescript](https://mongoosejs.com/docs/typescript.html)
- express + mongoose 연동
  - [1](https://poiemaweb.com/mongoose)
  - [2](https://velopert.com/594)

## 소셜 로그인 
- [express로 카카오 소셜 로그인 기능을 적용하기](https://velog.io/@gbwlxhd97/express%EB%A1%9C-%EC%B9%B4%EC%B9%B4%EC%98%A4-%EC%86%8C%EC%85%9C-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EA%B8%B0%EB%8A%A5%EC%9D%84-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0)

mongod --dbpath :D:\Tool\MongoDB\data --quiet



# API
## Test
### /ping
- method: `GET`
- usage: 핑퐁
- request body
  ```typescript
  
  ```
- response body
  ```typescript
  "pong"
  ```

## User

### /user/fakeget
- method: `GET`
- usage: 유저 DB 저장 확인
- request body
  ```typescript
  ```
- response body
  ```typescript
  interface response {
    id: number;
    name:string;
  }
  ```
 


### /user/test
- method: `POST`
- usage: 테스트 가입
- request body
  ```typescript
  interface request {
    name: string;
    phoneNumber: string;
  }
  ```
- response body
  ```typescript
  interface response {
    id: number;
  }
  ```
