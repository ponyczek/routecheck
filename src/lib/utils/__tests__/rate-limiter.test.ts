import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { rateLimiter, checkIpRateLimit, checkTokenRateLimit, getClientIP } from "../rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  afterEach(() => {
    rateLimiter.clear();
  });

  describe("rateLimiter.check", () => {
    it("should allow requests under the limit", () => {
      expect(rateLimiter.check("key1", 5, 60000)).toBe(true);
      expect(rateLimiter.check("key1", 5, 60000)).toBe(true);
      expect(rateLimiter.check("key1", 5, 60000)).toBe(true);
    });

    it("should block requests over the limit", () => {
      // Allow first 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check("key1", 5, 60000)).toBe(true);
      }
      // Block 6th request
      expect(rateLimiter.check("key1", 5, 60000)).toBe(false);
    });

    it("should track different keys separately", () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check("key1", 5, 60000)).toBe(true);
      }
      expect(rateLimiter.check("key1", 5, 60000)).toBe(false);

      // Different key should start fresh
      expect(rateLimiter.check("key2", 5, 60000)).toBe(true);
    });

    it("should reset after window expires", () => {
      const windowMs = 100; // 100ms window

      // Fill the limit
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check("key1", 5, windowMs)).toBe(true);
      }
      expect(rateLimiter.check("key1", 5, windowMs)).toBe(false);

      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          // Should be allowed again
          expect(rateLimiter.check("key1", 5, windowMs)).toBe(true);
          resolve(undefined);
        }, windowMs + 10);
      });
    });
  });

  describe("rateLimiter.getRemaining", () => {
    it("should return correct remaining count", () => {
      const limit = 10;

      expect(rateLimiter.getRemaining("key1", limit)).toBe(10);

      rateLimiter.check("key1", limit, 60000);
      expect(rateLimiter.getRemaining("key1", limit)).toBe(9);

      rateLimiter.check("key1", limit, 60000);
      rateLimiter.check("key1", limit, 60000);
      expect(rateLimiter.getRemaining("key1", limit)).toBe(7);
    });

    it("should return 0 when limit exceeded", () => {
      const limit = 3;

      for (let i = 0; i < 5; i++) {
        rateLimiter.check("key1", limit, 60000);
      }

      expect(rateLimiter.getRemaining("key1", limit)).toBe(0);
    });
  });

  describe("checkIpRateLimit", () => {
    it("should check rate limit for IP", () => {
      const ip = "192.168.1.1";

      // Should allow multiple requests under limit
      for (let i = 0; i < 30; i++) {
        expect(checkIpRateLimit(ip)).toBe(true);
      }

      // Should block after limit (30 per minute)
      expect(checkIpRateLimit(ip)).toBe(false);
    });

    it("should track different IPs separately", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";

      for (let i = 0; i < 30; i++) {
        checkIpRateLimit(ip1);
      }

      expect(checkIpRateLimit(ip1)).toBe(false);
      expect(checkIpRateLimit(ip2)).toBe(true); // Different IP not affected
    });
  });

  describe("checkTokenRateLimit", () => {
    it("should check rate limit for token", () => {
      const token = "test-token-123";

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        expect(checkTokenRateLimit(token)).toBe(true);
      }

      // Should block after limit (5 per minute)
      expect(checkTokenRateLimit(token)).toBe(false);
    });

    it("should track different tokens separately", () => {
      const token1 = "token-1";
      const token2 = "token-2";

      for (let i = 0; i < 5; i++) {
        checkTokenRateLimit(token1);
      }

      expect(checkTokenRateLimit(token1)).toBe(false);
      expect(checkTokenRateLimit(token2)).toBe(true); // Different token not affected
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      expect(getClientIP(request)).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-real-ip": "192.168.1.1",
        },
      });

      expect(getClientIP(request)).toBe("192.168.1.1");
    });

    it("should prioritize x-forwarded-for over x-real-ip", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "10.0.0.1",
        },
      });

      expect(getClientIP(request)).toBe("192.168.1.1");
    });

    it('should return "unknown" if no IP headers present', () => {
      const request = new Request("https://example.com");
      expect(getClientIP(request)).toBe("unknown");
    });
  });
});
