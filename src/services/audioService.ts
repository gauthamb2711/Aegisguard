class AudioService {
  private ctx: AudioContext | null = null;
  private ringInterval: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  playAlertChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [660, 880, 660];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.13);
    });
  }

  startRingtone(): boolean {
    const ctx = this.ensureContext();
    if (!ctx) return false;
    this.stopRingtone();

    const triggerRingBurst = () => {
      const c = this.ensureContext();
      if (!c) return;
      const start = c.currentTime;

      // Standard dual-tone phone ring burst (440Hz + 480Hz)
      [0, 0.32].forEach((offset) => {
        const osc1 = c.createOscillator();
        const osc2 = c.createOscillator();
        const gain = c.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, start + offset);
        osc2.frequency.setValueAtTime(480, start + offset);

        gain.gain.setValueAtTime(0.001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, start + offset + 0.03);
        gain.gain.setValueAtTime(0.12, start + offset + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.27);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(c.destination);
        osc1.start(start + offset);
        osc2.start(start + offset);
        osc1.stop(start + offset + 0.28);
        osc2.stop(start + offset + 0.28);
      });
    };

    triggerRingBurst();
    this.ringInterval = window.setInterval(triggerRingBurst, 2200);
    return true;
  }

  stopRingtone(): void {
    if (this.ringInterval !== null) {
      window.clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  dispose(): void {
    this.stopRingtone();
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioService = new AudioService();
