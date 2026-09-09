/**
 * Тесты защиты от SSRF.
 *
 * Здесь цена ошибки выше, чем где-либо ещё в проекте: посетитель управляет
 * адресом, по которому идёт наш сервер. Поэтому проверяются не «типичные»
 * случаи, а обходы — завёрнутый в IPv6 приватный адрес, метаданные облака,
 * восьмеричная запись и порт нестандартной службы.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BlockedAddress,
  isPrivateAddress,
  normalizeUrl,
} from "@/lib/audit/guard";

test("приватные и служебные диапазоны закрыты", () => {
  for (const ip of [
    "127.0.0.1", "10.0.0.1", "172.16.0.1", "172.31.255.255",
    "192.168.1.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
    "100.64.0.1",                 // CGNAT — за ним абонентские сети операторов
    "169.254.169.254",            // метаданные облака, главная цель SSRF
    "::1", "fe80::1", "fc00::1",
    "::ffff:127.0.0.1",           // v4, завёрнутый в v6 — готовый обход
    "::ffff:10.0.0.1",
  ]) {
    assert.equal(isPrivateAddress(ip), true, `должен быть закрыт: ${ip}`);
  }
});

test("публичные адреса открыты", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "213.230.106.1", "2606:4700::1111"]) {
    assert.equal(isPrivateAddress(ip), false, `должен быть открыт: ${ip}`);
  }
});

test("мусор вместо адреса считается опасным, а не безопасным", () => {
  // Направление умолчания важнее самих проверок: неизвестное — закрыто.
  for (const junk of ["", "не адрес", "999.1.1.1", "1.2.3", "0x7f000001"]) {
    assert.equal(isPrivateAddress(junk), true, `должен быть закрыт: ${junk}`);
  }
});

test("схему можно не писать — люди её и не пишут", () => {
  assert.equal(normalizeUrl("mysite.uz").href, "https://mysite.uz/");
  assert.equal(normalizeUrl("  WWW.MySite.UZ/каталог ").hostname, "www.mysite.uz");
  assert.equal(normalizeUrl("http://mysite.uz").protocol, "http:");
});

test("не-веб схемы отвергаются", () => {
  for (const bad of ["file:///etc/passwd", "ftp://mysite.uz", "gopher://x.uz"]) {
    assert.throws(() => normalizeUrl(bad), BlockedAddress, bad);
  }
});

test("нестандартный порт отвергается", () => {
  // 6379 — Redis, 22 — SSH. Публичному сайту там делать нечего, а вот
  // сканировать через нас чужую инфраструктуру — вполне.
  assert.throws(() => normalizeUrl("https://mysite.uz:6379"), BlockedAddress);
  assert.throws(() => normalizeUrl("https://mysite.uz:22"), BlockedAddress);
  assert.equal(normalizeUrl("https://mysite.uz:8443").port, "8443");
});

test("порт не путается со схемой", () => {
  // Наивная проверка «всё до двоеточия — это схема» отвергала бы
  // `mysite.uz:8443` как схему «mysite.uz». Порт — это только цифры.
  assert.equal(normalizeUrl("mysite.uz:8443").href, "https://mysite.uz:8443/");
  assert.equal(normalizeUrl("mysite.uz:443/каталог").hostname, "mysite.uz");
  // При этом настоящие небезопасные схемы по-прежнему закрыты.
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd"]) {
    assert.throws(() => normalizeUrl(bad), BlockedAddress, bad);
  }
});

test("учётные данные из адреса вычищаются", () => {
  // https://evil.uz@внутренний-хост/ — классическая попытка запутать разбор.
  const url = normalizeUrl("https://user:pass@mysite.uz/page");
  assert.equal(url.username, "");
  assert.equal(url.password, "");
  assert.equal(url.hostname, "mysite.uz");
});
