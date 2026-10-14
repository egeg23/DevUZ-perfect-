/**
 * Пропуск задачи GitHub Actions без общего секрета (lib/admin/github-oidc.ts):
 * подпись GitHub и поля — какой репозиторий, какая задача, какая ветка.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { GITHUB_ISSUER, bearerOf, claimsProblem, parseJwt, signatureOk } from "@/lib/admin/github-oidc";
import { VOICE_OIDC } from "@/lib/admin/voice-auth";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = publicKey.export({ format: "jwk" });
const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey.export({ format: "jwk" });

const NOW = 1_800_000_000;
const good = {
  iss: GITHUB_ISSUER,
  aud: VOICE_OIDC.audience,
  exp: NOW + 300,
  nbf: NOW - 10,
  repository_id: VOICE_OIDC.repositoryId,
  workflow_ref: VOICE_OIDC.workflowRef,
};

function token(claims: object, alg = "RS256"): string {
  const part = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const signed = `${part({ alg, kid: "k1", typ: "JWT" })}.${part(claims)}`;
  return `${signed}.${sign("RSA-SHA256", Buffer.from(signed), privateKey).toString("base64url")}`;
}

test("подпись GitHub сходится только с его ключом", () => {
  const jwt = parseJwt(token(good));
  assert.ok(jwt);
  assert.equal(signatureOk(jwt, jwk), true);
  assert.equal(signatureOk(jwt, other), false, "чужой ключ");
  const tampered = parseJwt(token(good).replace(/\.[^.]+\./, `.${Buffer.from(JSON.stringify({ ...good, workflow_ref: "x" })).toString("base64url")}.`));
  assert.ok(tampered);
  assert.equal(signatureOk(tampered, jwk), false, "поля подменены после подписи");
  const none = parseJwt(token(good, "none"));
  assert.ok(none);
  assert.equal(signatureOk(none, jwk), false, "alg none не принимаем");
  assert.equal(parseJwt("не.токен"), null);
  assert.equal(parseJwt("a.b"), null);
});

test("поля: наш репозиторий, эта задача, ветка main, свежий", () => {
  assert.equal(claimsProblem(good, VOICE_OIDC, NOW), null);
  assert.equal(claimsProblem({ ...good, aud: [VOICE_OIDC.audience, "x"] }, VOICE_OIDC, NOW), null);
  assert.equal(claimsProblem({ ...good, iss: "https://evil" }, VOICE_OIDC, NOW), "issuer");
  assert.equal(claimsProblem({ ...good, aud: "sts.amazonaws.com" }, VOICE_OIDC, NOW), "audience");
  assert.equal(claimsProblem({ ...good, exp: NOW - 120 }, VOICE_OIDC, NOW), "expired");
  assert.equal(claimsProblem({ ...good, nbf: NOW + 600 }, VOICE_OIDC, NOW), "not_yet");
  assert.equal(claimsProblem({ ...good, repository_id: "1" }, VOICE_OIDC, NOW), "repository", "копия репозитория");
  const branch = VOICE_OIDC.workflowRef.replace("refs/heads/main", "refs/heads/feature");
  assert.equal(claimsProblem({ ...good, workflow_ref: branch }, VOICE_OIDC, NOW), "workflow", "чужая ветка");
  const otherWorkflow = VOICE_OIDC.workflowRef.replace("voice-transcribe.yml", "deploy-vps.yml");
  assert.equal(claimsProblem({ ...good, workflow_ref: otherWorkflow }, VOICE_OIDC, NOW), "workflow");
});

test("пропуск — для той самой задачи из этого репозитория", () => {
  const workflow = readFileSync(new URL("../.github/workflows/voice-transcribe.yml", import.meta.url), "utf8");
  assert.match(workflow, new RegExp(`audience=${VOICE_OIDC.audience}`));
  assert.ok(VOICE_OIDC.workflowRef.endsWith("/.github/workflows/voice-transcribe.yml@refs/heads/main"));
  assert.equal(bearerOf("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(bearerOf("bearer abc"), "abc");
  assert.equal(bearerOf("Basic abc"), null);
  assert.equal(bearerOf(null), null);
});
