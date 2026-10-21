// Сборка сцены: node build-scene.mjs <папка с three@0.180.0 и esbuild в node_modules>
// three и esbuild в зависимости сайта не добавляем: сцена — файл макета в public.
import { execFileSync } from "node:child_process";
const DIR = new URL(".", import.meta.url).pathname;
const tools = process.argv[2];
if (!tools) throw new Error("укажите папку с node_modules (three@0.180.0, esbuild)");
execFileSync(`${tools}/node_modules/.bin/esbuild`, [
  `${DIR}scene.src.js`, "--bundle", "--minify", "--format=iife", "--target=es2019", "--legal-comments=none",
  `--outfile=${DIR}../../../public/protos/samauto/scene.js`,
], { stdio: "inherit", env: { ...process.env, NODE_PATH: `${tools}/node_modules` }, cwd: tools });
