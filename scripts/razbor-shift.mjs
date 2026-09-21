#!/usr/bin/env node
//
// Ночная смена разборов — руками, в обход расписания.
//
//   cd /opt/devuz && set -a && . .env && set +a
//   node --import ./tests/alias-hook.mjs scripts/razbor-shift.mjs
//
// Нужен затем, чтобы правку смены можно было проверить в тот же день, а не
// ждать восьми утра по Ташкенту. Черновики ложатся туда же, куда и ночью:
// во вкладку «Разборы», на проверку владельцу. Наружу сам по себе не
// уходит ни один.
import { runRazborShift } from "@/lib/razbor/shift-run";

const run = await runRazborShift(new Date(), true);
console.log(JSON.stringify({
  смена: run.ran ? "прошла" : "не запускалась",
  посмотрено: run.looked,
  черновиков: run.drafted,
  пропущено: run.skipped,
  сбои: run.errors.slice(0, 5),
}, null, 2));
