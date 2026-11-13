export interface ShakeDetectorConfig {
  threshold: number; // m/s^2 magnitude or delta threshold
  cooldownMs: number;
  requiredPeaks: number;
  windowMs: number;
}

export class ShakeDetector {
  private peakTimestamps: number[] = [];
  private lastTriggeredAt = 0;

  processSample(
    magnitude: number,
    deltaMagnitude: number,
    config: ShakeDetectorConfig
  ): { triggered: boolean; peakCountInWindow: number; cooldownRemainingSec: number } {
    const now = Date.now();
    const cooldownRemainingMs = Math.max(
      0,
      config.cooldownMs - (now - this.lastTriggeredAt)
    );

    if (cooldownRemainingMs > 0) {
      return {
        triggered: false,
        peakCountInWindow: this.peakTimestamps.length,
        cooldownRemainingSec: Math.ceil(cooldownRemainingMs / 1000),
      };
    }

    // Dynamic acceleration intensity relative to gravity or sudden delta
    const dynamicIntensity = Math.max(
      Math.abs(magnitude - 9.81),
      deltaMagnitude
    );

    if (dynamicIntensity >= config.threshold * 0.65 || magnitude >= config.threshold) {
      this.peakTimestamps.push(now);
    }

    // Prune stale peaks outside window
    this.peakTimestamps = this.peakTimestamps.filter(
      (ts) => now - ts <= config.windowMs
    );

    if (this.peakTimestamps.length >= config.requiredPeaks) {
      this.lastTriggeredAt = now;
      this.peakTimestamps = [];
      return {
        triggered: true,
        peakCountInWindow: config.requiredPeaks,
        cooldownRemainingSec: Math.ceil(config.cooldownMs / 1000),
      };
    }

    return {
      triggered: false,
      peakCountInWindow: this.peakTimestamps.length,
      cooldownRemainingSec: 0,
    };
  }

  reset(): void {
    this.peakTimestamps = [];
    this.lastTriggeredAt = 0;
  }
}
