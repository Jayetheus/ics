import { describe, it, expect } from 'vitest';
import { generateQRCodeData, isQRCodeExpired, parseQRCode } from '../utils/qrCodeUtils';

// Lightweight pure helpers test (no Firestore side-effects) focusing on QR data integrity

describe('QR Attendance Utilities', () => {
  const base = {
    sessionId: 'sess123',
    lecturerId: 'lect1',
    subjectCode: 'SUB101',
    courseCode: 'COURSE1',
    venue: 'A101',
    date: '2025-10-31',
    startTime: '08:00',
    endTime: '09:00'
  };

  it('generates QRCodeData with type attendance and timestamp', () => {
    const data = generateQRCodeData(
      base.sessionId,
      base.lecturerId,
      base.subjectCode,
      base.courseCode,
      base.venue,
      base.date,
      base.startTime,
      base.endTime
    );
    expect(data.type).toBe('attendance');
    expect(typeof data.timestamp).toBe('number');
  });

  it('serializes and parses full QR payload', () => {
    const data = generateQRCodeData(
      base.sessionId,
      base.lecturerId,
      base.subjectCode,
      base.courseCode,
      base.venue,
      base.date,
      base.startTime,
      base.endTime
    );
    const encoded = JSON.stringify(data);
    const parsed = parseQRCode(encoded);
    expect(parsed).toBeTruthy();
    if (parsed) {
      expect(parsed.sessionId).toBe(base.sessionId);
      expect(parsed.type).toBe('attendance');
    }
  });

  it('detects expiration after duration', () => {
    const now = Date.now();
    expect(isQRCodeExpired(now - 30 * 60 * 1000, 15)).toBe(true); // 30 minutes old with 15 minute window
    expect(isQRCodeExpired(now, 15)).toBe(false);
  });

  it('rejects invalid json', () => {
    const parsed = parseQRCode('{"foo":123}');
    expect(parsed).toBeNull();
  });
});
