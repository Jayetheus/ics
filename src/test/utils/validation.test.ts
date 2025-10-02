import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validatePhoneNumber } from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MyStr0ng@Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('Password')).toBe(false);
      expect(validatePassword('P@ss')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+27831234567')).toBe(true);
      expect(validatePhoneNumber('0831234567')).toBe(true);
      expect(validatePhoneNumber('083 123 4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abc-def-ghij')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('123-45-6789')).toBe(false);
      expect(validatePhoneNumber('123456789')).toBe(false); // Too short
      expect(validatePhoneNumber('123456789012')).toBe(false); // Too long
      expect(validatePhoneNumber('+1234567890')).toBe(false); // US format, should fail for SA validation
      expect(validatePhoneNumber('083123456')).toBe(false); // Too short for SA format
      expect(validatePhoneNumber('08312345678')).toBe(false); // Too long for SA format
    });
  });
});
