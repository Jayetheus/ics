import { describe, it, expect } from 'vitest';

describe('Simple Tests', () => {
  it('should pass basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should validate email function', () => {
    const validateEmail = (email: string): boolean => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    };

    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('should validate password function', () => {
    const validatePassword = (password: string): boolean => {
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return passwordPattern.test(password);
    };

    expect(validatePassword('Password123!')).toBe(true);
    expect(validatePassword('password')).toBe(false);
  });

  it('should validate phone number function', () => {
    const validatePhoneNumber = (phone: string): boolean => {
      // Simple phone validation - at least 10 digits
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 10;
    };

    expect(validatePhoneNumber('+1234567890')).toBe(true);
    expect(validatePhoneNumber('123-456-7890')).toBe(true);
    expect(validatePhoneNumber('123')).toBe(false);
  });

  it('should parse QR code data', () => {
    const parseQRCode = (qrData: string): any | null => {
      try {
        const parsed = JSON.parse(qrData);
        
        if (parsed.sessionId && parsed.timestamp && parsed.type) {
          return parsed;
        }
        
        throw new Error('Invalid QR code data');
      } catch (error) {
        return null;
      }
    };

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

    expect(parseQRCode('invalid-json')).toBeNull();
  });

  it('should check QR code expiration', () => {
    const isQRCodeExpired = (timestamp: number, durationMinutes: number = 15): boolean => {
      const now = Date.now();
      const expirationTime = timestamp + (durationMinutes * 60 * 1000);
      return now > expirationTime;
    };

    const recentTimestamp = Date.now() - 1000; // 1 second ago
    const expiredTimestamp = Date.now() - (30 * 60 * 1000); // 30 minutes ago

    expect(isQRCodeExpired(recentTimestamp)).toBe(false);
    expect(isQRCodeExpired(expiredTimestamp)).toBe(true);
  });
});
