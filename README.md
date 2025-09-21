# GSC Portal API

## ⭐ 실행 방법

```bash
docker-compose up --build
```

서버 실행 후:  

API 서버: http://localhost:3000  

Swagger 문서: http://localhost:3000/api-docs

<hr style="height:3px; background:#444; border:none;" />



## 🧑‍💻 코드 규칙

- ESLint + Prettier 적용  
- 세미콜론(;) 필수  
- 큰따옴표(") 사용  
- 들여쓰기: 스페이스 2칸  
- 커밋 전에 npm run lint:fix 실행  

<hr style="height:3px; background:#444; border:none;" />


## 📝 커밋 컨벤션  
커밋 메시지는 다음 규칙을 따릅니다:  

- ✨ feat	새로운 기능 추가  
- 🐛 fix	버그 수정  
- 📚 docs	문서 수정 (README, 주석 등)  
- 💅 style	코드 포맷팅 (세미콜론, 공백 등)  
- ♻️ refactor	코드 리팩토링 (구조 개선)  
- 🔧 chore	잡다한 작업 (설정, 패키지 등)  

### ✅ 예시  
- ✨ feat: 로그인 API 추가  
- 🐛 fix: DB 연결 버그 수정  
- 📚 docs: README에 코드 규칙 작성  
- 💅 style: prettier로 코드 정리  
- ♻️ refactor: UserController 구조 개선  
- 🔧 chore: eslint 패키지 설치  

<hr style="height:3px; background:#444; border:none;" />

## 📂 프로젝트 구조 (초기)  

src/  
├─ controllers/   # 컨트롤러  
├─ db/            # DB 연결  
├─ docs/          # Swagger 설정  
├─ middleware/    # 인증/검증 로직  
├─ models/        # DB 모델  
├─ routes/        # 라우팅  
├─ service/       # 비즈니스 로직  
├─ app.js         # Express 앱 초기화  
└─ server.js      # 서버 실행  


