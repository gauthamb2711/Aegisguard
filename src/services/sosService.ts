import {
  LocationData,
  SafetyEvent,
  SafetyEventType,
} from '../types/safety';
import { locationService } from './locationService';

export const sosService = {
  createEvent(params: {
    type: SafetyEventType;
    userConfirmed: boolean;
    cancelled?: boolean;
    locationConsented: boolean;
    location?: LocationData | null;
    messagePrepared?: boolean;
    notes: string;
  }): SafetyEvent {
    const timestamp = Date.now();
    const id = `EVT-${new Date(timestamp)
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return {
      id,
      type: params.type,
      timestamp,
      userConfirmed: params.userConfirmed,
      cancelled: Boolean(params.cancelled),
      status: params.cancelled
        ? 'CANCELLED'
        : params.userConfirmed
          ? 'ACTIVE'
          : 'ACKNOWLEDGED',
      locationConsented: params.locationConsented,
      location:
        params.locationConsented && params.location
          ? {
              latitude: params.location.latitude,
              longitude: params.location.longitude,
              accuracy: params.location.accuracy,
            }
          : undefined,
      messagePrepared: Boolean(params.messagePrepared),
      sharedVia: 'NONE',
      notes: params.notes,
    };
  },

  buildEmergencyMessage(params: {
    location: LocationData | null;
    includeLocation: boolean;
    emergencyNumber: string;
    customNote?: string;
    destination?: string;
  }): string {
    const timeStr = new Date().toLocaleString();
    const lines: string[] = [
      'EMERGENCY SOS ALERT (User-Initiated via AegisGuard)',
      `Time: ${timeStr}`,
      'I need immediate assistance. Please contact me or check on my safety.',
    ];

    if (params.destination) {
      lines.push(`Active Journey Destination: ${params.destination}`);
    }

    if (params.customNote?.trim()) {
      lines.push(`Note: ${params.customNote.trim()}`);
    }

    if (params.includeLocation && params.location) {
      const { latitude, longitude, accuracy } = params.location;
      lines.push(
        `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Accuracy: ±${Math.round(accuracy)}m)`
      );
      lines.push(
        `Google Maps: ${locationService.getGoogleMapsUrl(latitude, longitude)}`
      );
      lines.push(
        `OpenStreetMap: ${locationService.getOpenStreetMapUrl(latitude, longitude)}`
      );
    } else if (params.includeLocation && !params.location) {
      lines.push(
        'Location: GPS coordinates could not be retrieved at the time of this alert.'
      );
    } else {
      lines.push('Location: Location sharing was not included by user preference.');
    }

    lines.push(
      `Local Emergency Helpline configured: ${params.emergencyNumber || '112'}`
    );

    return lines.join('\n');
  },
};
