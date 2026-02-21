import { Injectable } from '@angular/core';

const DEVICE_KEY = 'aurum_hrms_device_id';

type TrustSignals = {
  deviceIdHash?: string;
  ipHash?: string;
  userAgentHash?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  reasonCode?: string;
  reasonText?: string;
};

@Injectable({
  providedIn: 'root',
})
export class AttendanceTrustService {
  private ensureDeviceId() {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && existing.trim().length > 0) return existing;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, next);
    return next;
  }

  private async sha256(input: string) {
    if (!input) return '';
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return btoa(input).slice(0, 64);
    }
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async getGeoSignal() {
    if (!('geolocation' in navigator)) return {};

    return new Promise<Pick<TrustSignals, 'latitude' | 'longitude' | 'accuracyMeters'>>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          });
        },
        () => resolve({}),
        {
          enableHighAccuracy: false,
          maximumAge: 5 * 60 * 1000,
          timeout: 2500,
        },
      );
    });
  }

  async getTrustSignals(reasonCode?: string, reasonText?: string): Promise<TrustSignals> {
    const deviceId = this.ensureDeviceId();
    const [deviceIdHash, userAgentHash, geo] = await Promise.all([
      this.sha256(deviceId),
      this.sha256(navigator.userAgent || ''),
      this.getGeoSignal(),
    ]);

    return {
      deviceIdHash,
      userAgentHash,
      latitude: geo.latitude,
      longitude: geo.longitude,
      accuracyMeters: geo.accuracyMeters,
      reasonCode,
      reasonText,
    };
  }
}
