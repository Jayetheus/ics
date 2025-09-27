import { describe, it, expect } from 'vitest';
import { parseQRCode, isQRCodeExpired } from '../../utils/qrCodeUtils';

describe('QR Code Utils', () => {
  describe('parseQRCode', () => {
    it('should parse valid QR code data', () => {
      const validQRData = JSON.stringify({
        sessionId: 'session-123',
        timestamp: Date.now(),
        type: 'attendance'
      });

      const result = parseQRCode(validQRData);
      
      expect(result).toEqual({
        sessionId: 'session-123',
        timestamp: expect.any(Number),
        type: 'attendance'
      });
    });

    it('should return null for invalid JSON', () => {
      const invalidData = 'invalid-json';
      const result = parseQRCode(invalidData);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseQRCode('');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = parseQRCode(null as any);
      expect(result).toBeNull();
    });
  });

  describe('isQRCodeExpired', () => {
    it('should return false for recent QR code', () => {
      const recentTimestamp = Date.now() - 1000; // 1 second ago
      const result = isQRCodeExpired(recentTimestamp);
      expect(result).toBe(false);
    });

    it('should return true for expired QR code', () => {
      const expiredTimestamp = Date.now() - (30 * 60 * 1000); // 30 minutes ago
      const result = isQRCodeExpired(expiredTimestamp);
      expect(result).toBe(true);
    });

    it('should return false for QR code at expiration boundary', () => {
      const boundaryTimestamp = Date.now() - (15 * 60 * 1000); // 15 minutes ago
      const result = isQRCodeExpired(boundaryTimestamp);
      expect(result).toBe(false);
    });
  });
});
