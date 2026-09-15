@AGENTS.md

# Claude Code 전용 지침

- 이 세션은 하나의 git worktree, 즉 하나의 티켓만 담당한다.
  다른 티켓 파일이나 다른 worktree의 변경사항을 참조하거나 수정하지 않는다.
- 작업을 마치면 docs/agent-runs/{ticket-id}.md에 아래 내용을 남긴다:
  - 받은 티켓 스펙 요약
  - 변경한 파일 목록
  - DoD 체크 결과
  - 통합 게이트(npm run typecheck && npm run lint && npm run test) 실행 결과
- 위 로그 파일 생성을 마지막으로 세션을 종료한다 (Stop hook이 이 시점에
  Discord 웹훅으로 완료 알림을 보낸다).
- 스코프를 벗어난 변경이 필요하다고 판단되면, 직접 진행하지 말고 이유를
  docs/agent-runs/{ticket-id}.md에 "블로커"로 기록하고 중단한다.
