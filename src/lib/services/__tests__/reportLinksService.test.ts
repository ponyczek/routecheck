import { describe, it, expect } from "vitest";

import { hashToken } from "../reportLinksService";

describe("reportLinksService", () => {
  describe("hashToken", () => {
    it("should hash token with pepper consistently", () => {
      const token = "test-token-123";
      const pepper = "secret-pepper";

      const hash1 = hashToken(token, pepper);
      const hash2 = hashToken(token, pepper);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it("should produce different hashes for different tokens", () => {
      const pepper = "secret-pepper";

      const hash1 = hashToken("token1", pepper);
      const hash2 = hashToken("token2", pepper);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce different hashes with different peppers", () => {
      const token = "test-token";

      const hash1 = hashToken(token, "pepper1");
      const hash2 = hashToken(token, "pepper2");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty strings", () => {
      const hash = hashToken("", "");
      expect(hash).toHaveLength(64);
    });

    it("should handle special characters", () => {
      const token = "token-with-special-!@#$%^&*()";
      const pepper = "pepper-with-special-😀🎉";

      const hash = hashToken(token, pepper);
      expect(hash).toHaveLength(64);
    });
  });
});
