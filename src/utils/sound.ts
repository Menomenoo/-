// Synthesized Web Audio API feedback for tactile RPG gameplay

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('sf_rpg_muted');
      if (saved === 'true') this.muted = true;
    } catch {
      // ignore storage errors
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('sf_rpg_muted', String(this.muted));
    } catch {
      // ignore
    }
    if (!this.muted) this.playClick();
    return this.muted;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sawtooth',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(420, 0.06, 'triangle', 0.04);
  }

  public playCoin() {
    this.playTone(987.77, 0.09, 'sine', 0.06, 0);
    this.playTone(1318.51, 0.16, 'sine', 0.06, 0.07);
  }

  public playUpgrade() {
    this.playTone(330, 0.1, 'triangle', 0.07, 0);
    this.playTone(440, 0.1, 'triangle', 0.07, 0.08);
    this.playTone(659.25, 0.18, 'triangle', 0.07, 0.16);
  }

  public playStrike() {
    this.playSweep(240, 75, 0.13, 'sawtooth', 0.08, 0);
    this.playTone(95, 0.14, 'square', 0.05, 0.03);
  }

  public playCritStrike() {
    this.playSweep(520, 110, 0.16, 'sawtooth', 0.1, 0);
    this.playTone(880, 0.14, 'triangle', 0.08, 0.04);
    this.playTone(1174.66, 0.18, 'sine', 0.06, 0.08);
  }

  public playGuard() {
    this.playTone(260, 0.12, 'triangle', 0.07, 0);
    this.playTone(520, 0.16, 'sine', 0.06, 0.03);
  }

  public playUltimate() {
    this.playSweep(110, 48, 0.28, 'sawtooth', 0.1, 0);
    this.playTone(220, 0.22, 'square', 0.06, 0.05);
    this.playTone(440, 0.25, 'triangle', 0.08, 0.12);
    this.playTone(659.25, 0.3, 'sine', 0.07, 0.18);
  }

  public playHealPotion() {
    this.playTone(587.33, 0.1, 'sine', 0.06, 0);
    this.playTone(783.99, 0.12, 'sine', 0.06, 0.07);
    this.playTone(1046.5, 0.2, 'triangle', 0.07, 0.14);
  }

  public playBossHit() {
    this.playSweep(160, 42, 0.22, 'sawtooth', 0.11, 0);
    this.playTone(70, 0.24, 'square', 0.07, 0.02);
  }

  public playLevelUp() {
    this.playTone(440, 0.1, 'triangle', 0.07, 0);
    this.playTone(554.37, 0.1, 'triangle', 0.07, 0.08);
    this.playTone(659.25, 0.12, 'triangle', 0.08, 0.16);
    this.playTone(880, 0.3, 'sine', 0.09, 0.24);
  }

  public playWarHorn() {
    this.playSweep(130, 146.83, 0.38, 'sawtooth', 0.07, 0);
    this.playTone(196, 0.36, 'triangle', 0.06, 0.06);
  }

  public playVictory() {
    this.playTone(523.25, 0.12, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.08, 0.1);
    this.playTone(783.99, 0.24, 'triangle', 0.09, 0.2);
  }

  public playDefeat() {
    this.playTone(220, 0.18, 'sawtooth', 0.06, 0);
    this.playTone(165, 0.28, 'sawtooth', 0.06, 0.16);
  }

  public playError() {
    this.playTone(180, 0.12, 'square', 0.05, 0);
  }
}

export const soundFX = new SoundEngine();
