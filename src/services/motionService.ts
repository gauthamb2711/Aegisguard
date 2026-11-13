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
    }, 1800);

    const handler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity ?? event.acceleration;
      if (!acc || (acc.x === null && acc.y === null && acc.z === null)) {
        return;
      }

      receivedValidSample = true;
      const ax = acc.x ?? 0;
      const ay = acc.y ?? 0;
      const az = acc.z ?? 0;
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

    window.addEventListener('devicemotion', handler);

    return () => {
      window.clearTimeout(hardwareTimer);
      window.removeEventListener('devicemotion', handler);
    };
  },
};
