<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 갓생 감시자 — AGENTS.md

## 프로젝트 개요

취준생용 갓생 강제 트래커. Todo/체크인/집중타이머 행동 데이터를 기반으로
AI가 페르소나 기반 맞춤 피드백("오늘의 쓴소리")을 생성한다.

## 스택

Next.js (App Router) / TypeScript / Tailwind CSS / TanStack Query / Supabase
(Auth + Postgres) / OpenAI API / 배포: Vercel

## 아키텍처 (FSD-lite)

- 레이어: app → widgets → features → entities → shared
- import 방향은 반드시 entities → features → widgets → app 순으로만 허용.
  역방향 import 금지 (예: entities/mission이 features/add-mission을 참조하면 안 됨)
- 각 슬라이스는 index.ts로 외부에 노출할 것만 export 한다
- Next.js API 라우트는 app/api/{리소스}/route.ts, 동적 세그먼트는
  app/api/{리소스}/[id]/route.ts 형식을 반드시 따른다 (App Router 규칙)

## 명령어

- 개발 서버: npm run dev
- 타입체크: npm run typecheck
- 린트: npm run lint
- 테스트: npm run test
- 통합 게이트(병합 전 필수): npm run typecheck && npm run lint && npm run test

## 작업 범위 규칙 (중요)

- 모든 작업은 tickets/{id}.md 스펙을 기준으로 진행한다
- 티켓의 scope에 명시된 경로 밖의 파일은 수정하지 않는다
- 이미 확정된 아키텍처 결정(Supabase, Next.js, FSD 구조 등)을 재논의하지 않는다
- DoD 체크리스트를 모두 만족해야 작업 완료로 간주한다

## 브랜치 라이프사이클

- 티켓 시작 시 `ticket/{id}-{요약}` 브랜치를 에이전트가 직접 생성한다
- 작업 완료 후 로컬에서 통합 게이트(타입체크+린트+테스트)를 직접 실행하고,
  통과한 경우에만 `integration` 브랜치로 병합한다
- 게이트를 통과하지 못하면 병합하지 않고 실패 로그를 docs/agent-runs/{ticket-id}.md에
  남긴 뒤 스스로 수정을 시도한다 (최대 2회 재시도, 이후에도 실패하면 사람에게 보고)
- `integration` 브랜치 병합이 끝나고 게이트까지 통과했다면 해당 `ticket/*` 브랜치는
  에이전트가 직접 삭제한다
- 단, `integration` → `main` 병합은 에이전트가 자동으로 하지 않는다. 사람이 diff를
  직접 확인한 뒤 병합한다 (여러 티켓이 겹칠 때의 인터페이스 불일치는 자동 게이트로
  못 걸러지는 경우가 있기 때문)

## Supabase 관련

- 로컬 개발은 `supabase start`로 띄운 로컬 인스턴스를 사용한다
  (여러 워크트리에서 동시에 원격 dev 프로젝트에 마이그레이션을 적용하지 않는다)
- 마이그레이션 파일은 supabase/migrations/ 아래에 순번을 붙여 추가한다
- 모든 테이블에는 RLS를 적용하고 auth.uid() = user_id 정책을 기본으로 한다

## AI 하네스 관련 (오늘의 쓴소리)

- 프롬프트는 코드에 하드코딩하지 않고 prompts/personas/*.md, prompts/intensity-scale.md
  파일로 분리 관리한다 (버전 관리 대상)
- API 실패/타임아웃 시 반드시 shared/lib/ai/fallbackMessages.ts로 폴백한다
- 프롬프트나 페르소나를 변경하면 scenarios/ 아래 고정 시나리오로 재검증한다

## 테스트 규칙

- 새 로직(스트릭 계산, 프롬프트 조립 등)에는 단위 테스트를 추가한다
- API 라우트 변경 시 통합 테스트를 추가한다

## 커밋 컨벤션

- 형식: `{ticket-id}: {요약}` (예: `001: supabase 초기 스키마 및 RLS 추가`)
