/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a similar distributed store
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Check if a key is rate limited
   * @param key - Unique identifier (e.g., IP address or token)
   * @param limit - Maximum number of requests
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    // No entry or expired - create new
    if (!entry || entry.resetAt < now) {
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    // Check if limit exceeded
    return entry.count <= limit;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, limit: number): number {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt < Date.now()) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number | null {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt < Date.now()) {
      return null;
    }
    return entry.resetAt;
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear() {
    this.store.clear();
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configuration for public endpoints
 */
export const RATE_LIMITS = {
  IP_PER_MINUTE: 30,
  TOKEN_PER_MINUTE: 5,
  WINDOW_MS: 60 * 1000, // 1 minute
} as const;

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string {
  // Check common headers for proxy/CDN forwarded IPs
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' if we can't determine IP
  // In production with proper reverse proxy, this shouldn't happen
  return "unknown";
}

/**
 * Check rate limit for IP address
 */
export function checkIpRateLimit(ip: string): boolean {
  return rateLimiter.check(`ip:${ip}`, RATE_LIMITS.IP_PER_MINUTE, RATE_LIMITS.WINDOW_MS);
}

/**
 * Check rate limit for token
 */
export function checkTokenRateLimit(token: string): boolean {
  return rateLimiter.check(`token:${token}`, RATE_LIMITS.TOKEN_PER_MINUTE, RATE_LIMITS.WINDOW_MS);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(key: string, limit: number): Record<string, string> {
  const remaining = rateLimiter.getRemaining(key, limit);
  const resetTime = rateLimiter.getResetTime(key);

  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    ...(resetTime && {
      "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
    }),
  };
}
