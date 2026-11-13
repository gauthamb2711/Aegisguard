import { EmergencyContact } from '../types/safety';

export const sharingService = {
  isWebShareSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  },

  async shareViaWebShare(title: string, text: string, url?: string): Promise<{
    ok: boolean;
    error?: string;
  }> {
    if (!this.isWebShareSupported()) {
      return {
        ok: false,
        error: 'Web Share API is not supported on this browser or device.',
      };
    }

    try {
      await navigator.share({
        title,
        text,
        ...(url ? { url } : {}),
      });
      return { ok: true };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, error: 'Share action was cancelled before completion.' };
      }
      return {
        ok: false,
        error: 'Unable to open device share sheet. Use Copy Message, SMS, or Email below.',
      };
    }
  },

  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback below
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  },

  buildSmsUri(contacts: EmergencyContact[], message: string): string {
    const phones = contacts
      .map((c) => c.phone.replace(/[^\d+]/g, ''))
      .filter(Boolean);
    const recipients = phones.join(',');
    const encoded = encodeURIComponent(message);
    return `sms:${recipients}?body=${encoded}`;
  },

  buildMailtoUri(
    contacts: EmergencyContact[],
    subject: string,
    body: string
  ): string {
    const emails = contacts
      .map((c) => c.email?.trim() ?? '')
      .filter(Boolean)
      .join(',');
    return `mailto:${emails}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  },

  buildTelUri(phoneNumber: string): string {
    const clean = phoneNumber.replace(/[^\d+]/g, '');
    return `tel:${clean}`;
  },
};
