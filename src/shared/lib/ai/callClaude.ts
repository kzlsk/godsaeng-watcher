// 하위 호환용 재노출 파일. src/app/api/nag/route.ts(이 티켓 scope 밖)가 이 경로 그대로
// import하고 있어서 경로/함수명은 유지하고, 실제 구현(OpenAI 연동)은 callOpenAI.ts로 옮겼다.
// "server-only" 가드는 여기서만 건다 — callOpenAI.ts는 node --test로 직접 단위 테스트하기
// 위해 이 가드 없이 둔다 (server-only는 plain Node에서 항상 throw하는 패키지라 테스트 불가).
import "server-only";

export { generateNagMessage } from "@/shared/lib/ai/callOpenAI";
