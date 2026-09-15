갓생 감시자 - 기술 설계 문서 (Technical Design)
=================================================

1. 아키텍처 개요

---

[Browser]
-> Next.js (App Router, Vercel)
-> Server Components / Route Handlers
-> Supabase (Auth, Postgres, RLS)
-> OpenAI API (오늘의 쓴소리 생성)
-> Supabase Auth (Kakao/Google OAuth 콜백)

인증, 데이터 CRUD, AI 호출 모두 Next.js 레이어 안에서 처리.
별도 백엔드 서버 없음 (Route Handlers가 그 역할).

2. 폴더 구조 (Next.js App Router 기준)

---

src/
app/
(auth)/
login/page.tsx
auth/callback/route.ts # OAuth 콜백 처리
(dashboard)/
layout.tsx # 인증 가드 포함
page.tsx # 메인 대시보드
api/
missions/route.ts # GET, POST
missions/[id]/route.ts # PATCH, DELETE
checkins/route.ts # GET, POST (오늘 체크인)
focus-sessions/route.ts # POST (세션 기록)
streak/route.ts # GET (스트릭 계산)
nag/route.ts # POST (AI 쓴소리 생성)
nag/settings/route.ts # GET, PATCH (강도/페르소나)
components/
dashboard/
MissionList.tsx
MissionItem.tsx
CheckinCard.tsx
FocusTimer.tsx
StreakBadge.tsx
NagCard.tsx
NagSettings.tsx
mascot/
Mascot.tsx # 무드별 SVG 렌더링
lib/
supabase/
client.ts # 브라우저 클라이언트
server.ts # 서버 클라이언트 (RLS 적용)
ai/
buildNagPrompt.ts # 프롬프트 조립
callOpenAI.ts # API 호출 + 캐싱 + 폴백
fallbackMessages.ts # 규칙 기반 폴백 메시지 풀
streak.ts # 스트릭 계산 로직
hooks/
useMissions.ts # TanStack Query
useCheckins.ts
useFocusSessions.ts
useNag.ts
types/
db.ts # Supabase generated types

3. DB 스키마 (Supabase / Postgres, 최종안)

---

-- missions
create table missions (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users not null,
title text not null,
category text,
deadline timestamptz,
duration_min int,
done boolean default false,
urgent boolean default false,
created_at timestamptz default now()
);

-- checkins (하루 1건, user_id + date 유니크)
create table checkins (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users not null,
date date not null,
applications int default 0,
problems int default 0,
created_at timestamptz default now(),
unique (user_id, date)
);

-- focus_sessions
create table focus_sessions (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users not null,
mission_id uuid references missions(id),
started_at timestamptz not null,
ended_at timestamptz,
duration_min int,
completed boolean default false
);

-- nag_settings (유저당 1행)
create table nag_settings (
user_id uuid primary key references auth.users,
intensity int default 70,
persona text default 'realist'
);

-- nag_logs
create table nag_logs (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users not null,
context jsonb, -- 생성 시점 입력 데이터 스냅샷
content text not null,
generated_at timestamptz default now(),
regenerate_count int default 0
);

RLS: 모든 테이블에 "user_id = auth.uid()" 정책 적용 (본인 데이터만 조회/수정 가능).

4. API 설계 (Route Handlers)

---

GET /api/missions 오늘/전체 미션 목록
POST /api/missions 미션 생성
PATCH /api/missions/:id 완료 토글, 수정
DELETE /api/missions/:id 삭제

GET /api/checkins?date=today 오늘 체크인 조회
POST /api/checkins 체크인 생성/수정 (upsert)

POST /api/focus-sessions 세션 시작/종료 기록
GET /api/focus-sessions/weekly 주간 총 집중시간 집계

GET /api/streak 현재 스트릭, 최근 끊김 여부

POST /api/nag 오늘의 쓴소리 생성 (또는 재생성)
GET /api/nag/settings 강도/페르소나 조회
PATCH /api/nag/settings 강도/페르소나 수정

5. 상태 관리 (TanStack Query)

---

Query Key 설계:
['missions', date]
['checkins', date]
['focus-sessions', 'weekly']
['streak']
['nag', 'today']
['nag-settings']

미션 완료/체크인 변경 시 관련 쿼리(streak, nag) invalidate 하도록 연결
(쓴소리 카드가 최신 행동 데이터를 반영해야 하므로)

6. AI 하네스 워크플로우 (오늘의 쓴소리)

---

1. 입력 수집: 오늘 미션 완료율, 마감 초과 건수, 오늘/주간 집중시간, 현재 스트릭,
   nag_settings(강도/페르소나)
2. buildNagPrompt.ts에서 위 데이터를 구조화된 system/user 프롬프트로 조립
   - 강도(intensity)에 따라 톤 지시문 스케일링 (예: 30=순한 잔소리, 90=팩폭)
   - 페르소나별 시스템 프롬프트 프리셋 분리 관리 (버저닝 가능하게 파일 분리)
3. callOpenAI.ts에서 OpenAI API 호출
   - 동일 입력 조건(같은 날, 같은 데이터 스냅샷)이면 캐시된 응답 재사용
   - 실패/타임아웃 시 fallbackMessages.ts의 규칙 기반 메시지로 대체
4. 응답을 nag_logs에 context 스냅샷과 함께 저장 (재현 가능성, 디버깅용)
5. "한 번 더 때려줘" 클릭 시 동일 컨텍스트 + regenerate_count 증가로 재호출
   (온도를 살짝 높여 변주)

7) 에이전트 개발 워크플로우 (바이브 코딩 진행 방식)

---

Claude Code로 아래 순서로 작업을 나눠서 진행 (한 번에 전체를 맡기지 않음):

1. Supabase 스키마/RLS 마이그레이션 파일 생성
2. 인증 플로우 (로그인 페이지, 콜백, 미들웨어 가드)
3. 미션/체크인 CRUD API + 훅
4. 대시보드 UI 컴포넌트 (목업/레퍼런스 기준)
5. 포커스 타이머 + 주간 집계
6. 스트릭 계산 + 마스코트 무드 연동
7. AI 쓴소리 하네스 (프롬프트/캐싱/폴백/로그)
8. MCP 연동 (후보 확정 후)
9. 테스트 (단위 + 주요 플로우 e2e)
10. 배포 설정 (Vercel 환경변수, Supabase 프로덕션 연결)

각 단계 종료 시 커밋 단위로 분리, 에이전트가 만든 코드에 대한 리뷰/수정 로그를
남겨서 "AI와 어떻게 협업했는지"가 레포 히스토리에 드러나게 함 (포트폴리오 포인트).

8. 테스트 전략

---

- 단위: 스트릭 계산 로직, 쓴소리 프롬프트 조립 함수
- API: 각 Route Handler에 대한 통합 테스트 (Supabase 로컬/테스트 프로젝트 사용)
- e2e: 로그인 -> 미션 생성 -> 완료 -> 체크인 -> 쓴소리 생성까지 핵심 플로우 1개

9. 배포

---

- Vercel 프로젝트 연결, 환경변수: SUPABASE_URL, SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE(서버 전용), ANTHROPIC_API_KEY, OAuth 클라이언트 키
- Supabase는 프로덕션 프로젝트 분리 (개발용과 별도)
