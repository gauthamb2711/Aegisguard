import { MotionSample, PermissionStatusType } from '../types/safety';

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export const motionService = {
  isApiPresent(): boolean {
    return (
      typeof window !== 'undefined' && typeof window.DeviceMotionEvent !== 'undefined'
    );
  },

  requiresExplicitPermission(): boolean {
    if (!this.isApiPresent()) return false;
    const dme = window.DeviceMotionEvent as DeviceMotionEventWithPermission;
    return typeof dme.requestPermission === 'function';
  },

  async requestPermission(): Promise<PermissionStatusType> {
    if (!this.isApiPresent()) return 'unsupported';
    const dme = window.DeviceMotionEvent as DeviceMotionEventWithPermission;
    if (typeof dme.requestPermission === 'function') {
      try {
        const res = await dme.requestPermission();
        return res === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }
    return 'granted';
  },

  subscribe(
    onSample: (sample: MotionSample) => void,
    onNoHardwareData?: () => void
  ): () => void {
    if (!this.isApiPresent()) {
      onNoHardwareData?.();
      return () => {};
    }

    let prevMagnitude = 9.81;
    let receivedValidSample = false;

    const hardwareTimer = window.setTimeout(() => {
      if (!receivedValidSample) {
        onNoHardwareData?.();
      }
    }, 1400);

    const handler = (event: DeviceMotionEvent) => {
      const inc = event.accelerationIncludingGravity;
      const lin = event.acceleration;
      const hasInc =
        inc && (inc.x !== null || inc.y !== null || inc.z !== null);
      const hasLin =
        lin && (lin.x !== null || lin.y !== null || lin.z !== null);

      if (!hasInc && !hasLin) {
        return;
      }

      receivedValidSample = true;
      const ax = (hasInc ? inc?.x : lin?.x) ?? 0;
      const ay = (hasInc ? inc?.y : lin?.y) ?? 0;
      const az = (hasInc ? inc?.z : lin?.z) ?? (hasLin ? 9.81 : 0);
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      const deltaMagnitude = Math.abs(magnitude - prevMagnitude);
      prevMagnitude = magnitude;

      onSample({
        timestamp: Date.now(),
        ax: Number(ax.toFixed(2)),
        ay: Number(ay.toFixed(2)),
        az: Number(az.toFixed(2)),
        magnitude: Number(magnitude.toFixed(2)),
        deltaMagnitude: Number(deltaMagnitude.toFixed(2)),
        isSimulated: false,
      });
    };

    window.addEventListener('devicemotion', handler, { passive: true });

    return () => {
      window.clearTimeout(hardwareTimer);
      window.removeEventListener('devicemotion', handler);
    };
  },
};
