// Звук для распознавания: 16 кГц, 16 бит, один канал. Здесь нет ни браузера,
// ни сети: частота, нарезка речи на куски по паузам. Это проверяет тест
// (tests/callhelper-extension.test.ts).

export const RATE = 16000;

/** Понижает частоту усреднением: 48 000 или 44 100 → 16 000. Помнит остаток между кусками. */
export function makeResampler(fromRate) {
  const ratio = fromRate / RATE;
  let acc = 0;
  let count = 0;
  let idx = 0;
  let next = ratio;
  return function resample(input) {
    if (ratio <= 1) return Float32Array.from(input);
    const out = new Float32Array(Math.ceil(input.length / ratio) + 1);
    let n = 0;
    for (let i = 0; i < input.length; i++) {
      acc += input[i];
      count++;
      idx++;
      if (idx >= next) {
        out[n++] = acc / count;
        acc = 0;
        count = 0;
        next += ratio;
      }
    }
    if (idx > 1e6) {
      next -= idx;
      idx = 0;
    }
    return out.subarray(0, n);
  };
}

export function toPcm16(float) {
  const out = new Int16Array(float.length);
  for (let i = 0; i < float.length; i++) {
    const v = Math.max(-1, Math.min(1, float[i]));
    out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return out;
}

/**
 * Режет поток на реплики: начало — когда речь идёт дольше `startMs`, конец —
 * пауза `endMs` или длина `maxMs`. Порог громкости подстраивается под шум.
 * Тишина на сервер не уходит: за неё не платят и её не распознают.
 */
export class Segmenter {
  constructor(opts = {}) {
    const o = { frameMs: 30, startMs: 90, endMs: 700, maxMs: 12000, preMs: 240, minMs: 350, tailMs: 200, floor: 0.008, ...opts };
    this.o = o;
    this.frame = Math.round((RATE * o.frameMs) / 1000);
    this.rest = new Float32Array(0);
    this.pre = [];
    this.preMax = Math.ceil(o.preMs / o.frameMs);
    this.seg = null;
    this.run = 0;
    this.quiet = 0;
    this.voiced = 0;
    this.noise = o.floor;
    this.clock = 0;
    this.segStart = 0;
  }

  /** Сколько миллисекунд звука прошло через нарезку. */
  get ms() {
    return (this.clock * this.o.frameMs) | 0;
  }

  feed(samples) {
    const done = [];
    const all = new Float32Array(this.rest.length + samples.length);
    all.set(this.rest);
    all.set(samples, this.rest.length);
    let at = 0;
    for (; at + this.frame <= all.length; at += this.frame) {
      const frame = all.subarray(at, at + this.frame);
      const out = this.step(frame);
      if (out) done.push(out);
    }
    this.rest = all.slice(at);
    return done;
  }

  step(frame) {
    const o = this.o;
    this.clock++;
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    const speech = rms > Math.max(o.floor, this.noise * 3);
    if (!speech) this.noise = this.noise * 0.95 + rms * 0.05;

    if (!this.seg) {
      this.pre.push(frame.slice(0));
      if (this.pre.length > this.preMax) this.pre.shift();
      this.run = speech ? this.run + 1 : 0;
      if (this.run * o.frameMs >= o.startMs) {
        this.seg = this.pre.splice(0);
        this.segStart = this.ms - this.seg.length * o.frameMs;
        this.voiced = this.run;
        this.quiet = 0;
        this.run = 0;
      }
      return null;
    }

    this.seg.push(frame.slice(0));
    if (speech) {
      this.voiced++;
      this.quiet = 0;
    } else this.quiet++;

    const long = this.seg.length * o.frameMs >= o.maxMs;
    if (this.quiet * o.frameMs >= o.endMs || long) return this.close(long);
    return null;
  }

  close(keepTalking = false) {
    const o = this.o;
    const frames = this.seg;
    const voiced = this.voiced;
    const start = this.segStart;
    // Хвост тишины короче: оставляем `tailMs`.
    const cut = Math.max(0, this.quiet - Math.ceil(o.tailMs / o.frameMs));
    const keep = frames.length - cut;
    this.seg = keepTalking ? [] : null;
    this.segStart = this.ms;
    this.voiced = 0;
    this.quiet = 0;
    if (!frames || voiced * o.frameMs < o.minMs) return null;
    const out = new Float32Array(keep * this.frame);
    for (let i = 0; i < keep; i++) out.set(frames[i], i * this.frame);
    return { startMs: start, pcm: toPcm16(out) };
  }

  /** Конец звонка: отдать то, что недоговорено. */
  flush() {
    return this.seg ? this.close(false) : null;
  }
}

/** Реплика встаёт по времени начала: голоса идут двумя потоками и ответы приходят не по порядку. */
export function insertLine(lines, line) {
  let i = lines.length;
  while (i > 0 && lines[i - 1].t > line.t) i--;
  lines.splice(i, 0, line);
  return lines;
}
