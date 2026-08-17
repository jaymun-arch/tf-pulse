# TF Pulse

2026 교육혁신 성과보고서 TF 운영 허브 (정적 웹앱)

## 실행 방법

### 로컬 서버 (AI API 포함)

1. OpenAI 키 설정 (둘 중 하나)
   - `c:\Users\user\Documents\api\.env` 에 `OPENAI_API_KEY=...` (자동 로드·동기화)
   - 또는 프로젝트 루트 `.env` 에 동일하게 설정
2. 실행 (`npm start` 시 Documents/api/.env → 프로젝트 `.env` 자동 동기화):

```bash
npm run start
```

브라우저: [http://127.0.0.1:5174/](http://127.0.0.1:5174/)

키만 다시 맞출 때: `npm run sync-env`

### 단일 HTML (오프라인·모바일)

`TF-Pulse.html` 은 서버 없이 기본 기능만 동작합니다. **AI 취합분석·그림생성은 API 서버가 필요합니다.**

### 배포 (Vercel)

- 앱: [https://tf-pulse.vercel.app](https://tf-pulse.vercel.app)
- 저장소: [https://github.com/jaymun-arch/tf-pulse](https://github.com/jaymun-arch/tf-pulse)
- 환경변수: Vercel에 `OPENAI_API_KEY` 등록됨
- API: `/api/analyze`, `/api/generate-image`, `/api/review-summary`

## AI 기능

- **취합 현황** (+ 관리자 AI 분석): 취합 입력과 문서(.txt/.docx/.hwpx 또는 텍스트) AI 브리핑을 한 화면에서 처리
- **윤독·리뷰**: 담당자 PDF 업로드 → 주요내용·수치·계획·환류 요약표 / 관리자 확인 가이드·리뷰 태그 / 윤독 회의 코멘트
- **보고서 그림**: 연성대 테마(딥네이비·블루) 이미지 생성 → PNG / PPT 다운로드

## 주요 기능

- TF 요약, 통합 일정, 취합, 공통 요청, 예산취합, 드라이브, 공통 서식
- 오늘 뭐먹지 (돌림판 · 식사담당 업체 관리 · 메뉴 투표)
- 역할별 화면 (관리자 · 예산담당 · 식사담당 · 대상자)
- 데이터는 브라우저 `localStorage`에 저장

## powered by

Jay.Mun
