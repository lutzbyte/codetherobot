import { getSettings, subscribeSettings } from "@/state/settings";
import { MUSIC_STEP_SECONDS, STEPS_PER_LOOP, buildMusicSteps } from "./music";
import { SFX } from "./sfxPatterns";
import type { Noise, SfxName, Tone } from "./sfxPatterns";

interface Bus {
  ctx: AudioContext;
  master: GainNode;
  sfx: GainNode;
  music: GainNode;
}

const MUSIC_STEPS = buildMusicSteps();
const MUSIC_LEVEL = 0.9;
const MASTER_LEVEL = 0.9;

let bus: Bus | null = null;
let noise: AudioBuffer | null = null;
let musicTimer: number | undefined;
let stepIndex = 0;
let nextTime = 0;
let wanted = { sound: true, music: true };
let adMuted = false;
let initialized = false;

function createBus(): Bus | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = adMuted ? 0 : MASTER_LEVEL;
  master.connect(ctx.destination);

  const sfx = ctx.createGain();
  sfx.connect(master);

  const music = ctx.createGain();
  music.gain.value = MUSIC_LEVEL;
  music.connect(master);

  return { ctx, master, sfx, music };
}

function scheduleTone(
  ctx: AudioContext,
  dest: AudioNode,
  tone: Tone,
  at: number,
  rate: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tone.wave;
  osc.frequency.setValueAtTime(tone.freq * rate, at);
  if (tone.slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, tone.slideTo * rate), at + tone.dur);
  }
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(tone.gain, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(at);
  osc.stop(at + tone.dur + 0.02);
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noise || noise.sampleRate !== ctx.sampleRate) {
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    noise = buffer;
  }
  return noise;
}

function scheduleNoise(b: Bus, n: Noise, at: number): void {
  const src = b.ctx.createBufferSource();
  src.buffer = noiseBuffer(b.ctx);
  const filter = b.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = n.lowpass ?? 1200;
  const gain = b.ctx.createGain();
  gain.gain.setValueAtTime(n.gain, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + n.dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(b.sfx);
  src.start(at, 0, n.dur);
}

/** Memainkan efek suara. Aman dipanggil kapan saja: diam jika suara mati atau audio belum aktif. */
export function playSfx(
  name: SfxName,
  options: { rate?: number; delay?: number } = {},
): void {
  if (!wanted.sound || !bus || bus.ctx.state !== "running") return;
  const pattern = SFX[name];
  const base = bus.ctx.currentTime + (options.delay ?? 0);
  const rate = options.rate ?? 1;
  for (const tone of pattern.tones) {
    scheduleTone(bus.ctx, bus.sfx, tone, base + tone.start, rate);
  }
  for (const n of pattern.noise ?? []) scheduleNoise(bus, n, base + n.start);
}

/**
 * Membisukan semua suara game seketika (sinkron) saat iklan tampil, lalu memulihkannya.
 * Dokumentasi Ad Placement API mewajibkan pembisuan dilakukan sinkron di beforeAd.
 */
export function setAdMute(muted: boolean): void {
  adMuted = muted;
  if (!bus) return;
  bus.master.gain.cancelScheduledValues(0);
  bus.master.gain.setValueAtTime(muted ? 0 : MASTER_LEVEL, bus.ctx.currentTime);
}

function scheduleMusic(): void {
  if (!bus || !wanted.music || bus.ctx.state !== "running") return;
  const horizon = bus.ctx.currentTime + 0.5;
  while (nextTime < horizon) {
    const notes = MUSIC_STEPS[stepIndex % STEPS_PER_LOOP] ?? [];
    for (const note of notes) {
      scheduleTone(
        bus.ctx,
        bus.music,
        { freq: note.freq, start: 0, dur: note.dur, wave: note.wave, gain: note.gain },
        nextTime,
        1,
      );
    }
    nextTime += MUSIC_STEP_SECONDS;
    stepIndex += 1;
  }
}

function startMusic(): void {
  if (!bus || musicTimer !== undefined || !wanted.music) return;
  bus.music.gain.cancelScheduledValues(0);
  bus.music.gain.setTargetAtTime(MUSIC_LEVEL, bus.ctx.currentTime, 0.1);
  nextTime = bus.ctx.currentTime + 0.1;
  musicTimer = window.setInterval(scheduleMusic, 120);
  scheduleMusic();
}

function stopMusic(): void {
  if (musicTimer !== undefined) {
    window.clearInterval(musicTimer);
    musicTimer = undefined;
  }
  if (bus) bus.music.gain.setTargetAtTime(0, bus.ctx.currentTime, 0.08);
}

async function unlock(): Promise<void> {
  if (!bus) bus = createBus();
  if (!bus) return;
  if (bus.ctx.state === "suspended") {
    try {
      await bus.ctx.resume();
    } catch {
      return;
    }
  }
  if (wanted.music) startMusic();
}

function applyWanted(): void {
  const s = getSettings();
  wanted = { sound: s.sound, music: s.music };
  if (!wanted.music) stopMusic();
  else if (bus && bus.ctx.state === "running") startMusic();
}

function onGesture(): void {
  if (!bus || bus.ctx.state !== "running") void unlock();
}

function onClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const control = target.closest("button, a, [role='tab']");
  if (!control || control.closest("[data-no-sfx]")) return;
  if (control instanceof HTMLButtonElement && control.disabled) return;
  playSfx("click");
}

function onVisibility(): void {
  if (!bus) return;
  if (document.hidden) void bus.ctx.suspend();
  else void bus.ctx.resume();
}

/**
 * Menyiapkan audio. Dipanggil sekali saat aplikasi mulai. Konteks audio baru dibuat
 * pada interaksi pertama pemain, sesuai aturan autoplay browser.
 */
export function initAudio(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  applyWanted();
  subscribeSettings(applyWanted);
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("visibilitychange", onVisibility);
}