import explosionUrl from '../assets/sounds/Spaceexplosion.mp3';
import launchUrl from '../assets/sounds/Launch.mp3';
import { panFor } from './spatial';

// Sound effects built on the Web Audio API. The launch is a sample generated
// with ElevenLabs: a deep, soft "fwoom" of a magnetic launcher pushing the shot
// away. A synthesised whoosh plays while it loads. The
// gravity hum is synthesised, since it changes continuously with distance. Every sound is panned to
// where it happens on screen. The context can only start after a user
// gesture, so nothing plays until unlock() has been called from a click.

type HumVoice = { osc: OscillatorNode; filter: BiquadFilterNode; gain: GainNode; pan: StereoPannerNode };

const HUM_VOICES = 2; // One per projectile
const HUM_GAIN = 0.22;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private explosion: AudioBuffer | null = null;
  private launch: AudioBuffer | null = null;
  private hums: HumVoice[] = [];

  /** Creates or resumes the audio context. Call from a click or tap. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    if (typeof AudioContext === 'undefined') return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.noise = this.createNoise(ctx);
    this.hums = Array.from({ length: HUM_VOICES }, () => this.createHumVoice(ctx));
    this.load(ctx, explosionUrl, buffer => { this.explosion = buffer; });
    this.load(ctx, launchUrl, buffer => { this.launch = buffer; });
  }

  private load(ctx: AudioContext, url: string, onLoad: (buffer: AudioBuffer) => void) {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(data => ctx.decodeAudioData(data))
      .then(onLoad)
      .catch(error => console.warn('Could not load sound:', url, error));
  }

  /** Pauses all effects, e.g. while the tab is hidden. */
  setPaused(paused: boolean) {
    if (!this.ctx) return;
    const change = paused ? this.ctx.suspend() : this.ctx.resume();
    change.catch(() => {});
  }

  /** The launch sound at the planet that fires, slightly varied in pitch each time. */
  playLaunch(x: number) {
    const { ctx, launch } = this;
    if (!ctx) return;
    if (!launch) {
      this.playSynthLaunch(x);
      return;
    }
    const source = ctx.createBufferSource();
    source.buffer = launch;
    source.playbackRate.value = 0.94 + Math.random() * 0.12;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    this.connect(source.connect(gain), x);
    source.start();
  }

  /** A short rising whoosh of filtered noise. */
  private playSynthLaunch(x: number) {
    const { ctx, noise } = this;
    if (!ctx || !noise) return;
    const t = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2500, t + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    this.connect(source.connect(filter).connect(gain), x);
    source.start(t);
    source.stop(t + 0.5);
  }

  /** The explosion sample, panned to the hit. The decisive hit plays slower and deeper. */
  playExplosion(x: number, decisive: boolean) {
    const { ctx, explosion } = this;
    if (!ctx || !explosion) return;
    const source = ctx.createBufferSource();
    source.buffer = explosion;
    source.playbackRate.value = decisive ? 0.7 : 1;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    this.connect(source.connect(gain), x);
    source.start();
  }

  /** Sets each hum voice from 0 (silent) to 1 (close to a heavy mass), at an x position. */
  updateHum(voices: { intensity: number; x: number }[]) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.hums.forEach((hum, i) => {
      const { intensity, x } = voices[i] ?? { intensity: 0, x: 0 };
      hum.gain.gain.setTargetAtTime(intensity * HUM_GAIN, t, 0.06);
      hum.osc.frequency.setTargetAtTime(45 + 30 * intensity, t, 0.1);
      hum.filter.frequency.setTargetAtTime(180 + 700 * intensity, t, 0.1);
      hum.pan.pan.setTargetAtTime(panFor(x), t, 0.05);
    });
  }

  private connect(node: AudioNode, x: number) {
    if (!this.ctx || !this.master) return;
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = panFor(x);
    node.connect(pan).connect(this.master);
  }

  private createNoise(ctx: AudioContext) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // A sawtooth through a low-pass filter: the deep tone, plus overtones that
  // small phone speakers can actually play
  private createHumVoice(ctx: AudioContext): HumVoice {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 45;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const pan = ctx.createStereoPanner();
    osc.connect(filter).connect(gain).connect(pan);
    if (this.master) pan.connect(this.master);
    osc.start();
    return { osc, filter, gain, pan };
  }
}
