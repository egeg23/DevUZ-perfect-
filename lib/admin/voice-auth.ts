import { bearerOf, verifyGithubOidc, type OidcExpect } from "@/lib/admin/github-oidc";
import { VOICE_SECRET_HEADER, voiceSecretOk } from "@/lib/admin/voice-notes";

/**
 * Кто может ходить в app/api/voice/*: задача «Голосовые — расшифровка» с
 * ветки main нашего репозитория — по пропуску GitHub (OIDC,
 * lib/admin/github-oidc.ts) — или тот, у кого есть секрет смен
 * (SHIFT_REPORT_SECRET, как у отчёта смены). Звук голосового — это ТЗ
 * клиента: без одного из двух — отказ.
 */
export const VOICE_OIDC: OidcExpect = {
  audience: "devuz-voice",
  // egeg23/DevUZ-perfect- — номер не меняется при переименовании.
  repositoryId: "1341825659",
  workflowRef: "egeg23/DevUZ-perfect-/.github/workflows/voice-transcribe.yml@refs/heads/main",
};

export async function voiceAuthorized(request: Request): Promise<boolean> {
  if (voiceSecretOk(request.headers.get(VOICE_SECRET_HEADER), process.env.SHIFT_REPORT_SECRET)) return true;
  const token = bearerOf(request.headers.get("authorization"));
  if (!token) return false;
  const result = await verifyGithubOidc(token, VOICE_OIDC);
  if (!result.ok) console.error("голосовые: пропуск GitHub не принят", result.why);
  return result.ok;
}
