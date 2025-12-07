import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTelemetry } from "../hooks/useTelemetry";

// Mock the API module
vi.mock("../api", () => ({
  sendTelemetry: vi.fn().mockResolvedValue(undefined),
}));

import { sendTelemetry } from "../api";

describe("useTelemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTelemetry("test-token"));

    expect(result.current.telemetryState.startTime).toBeLessThanOrEqual(Date.now());
    expect(result.current.telemetryState.endTime).toBeNull();
    expect(result.current.telemetryState.interactions).toBe(0);
    expect(result.current.telemetryState.switchedToProblems).toBe(false);
  });

  it("should increment interactions count", () => {
    const { result } = renderHook(() => useTelemetry("test-token"));

    expect(result.current.telemetryState.interactions).toBe(0);

    act(() => {
      result.current.recordInteraction();
    });

    expect(result.current.telemetryState.interactions).toBe(1);

    act(() => {
      result.current.recordInteraction();
      result.current.recordInteraction();
    });

    expect(result.current.telemetryState.interactions).toBe(3);
  });

  it("should record problem switch", () => {
    const { result } = renderHook(() => useTelemetry("test-token"));

    expect(result.current.telemetryState.switchedToProblems).toBe(false);

    act(() => {
      result.current.recordProblemSwitch();
    });

    expect(result.current.telemetryState.switchedToProblems).toBe(true);
  });

  it("should send telemetry with correct data", async () => {
    const token = "test-token-123";
    const reportUuid = "report-uuid-456";

    const { result } = renderHook(() => useTelemetry(token));

    // Record some interactions
    act(() => {
      result.current.recordInteraction();
      result.current.recordInteraction();
      result.current.recordProblemSwitch();
    });

    await act(async () => {
      await result.current.sendFormTelemetry(reportUuid);
    });

    expect(sendTelemetry).toHaveBeenCalledWith({
      eventType: "FORM_SUBMIT",
      occurredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      metadata: {
        duration: expect.any(Number),
        interactions: 2,
        switchedToProblems: true,
      },
      linkUuid: token,
      reportUuid: reportUuid,
    });
  });

  it("should calculate duration correctly", async () => {
    const { result } = renderHook(() => useTelemetry("test-token"));

    const startTime = result.current.telemetryState.startTime;

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    await act(async () => {
      await result.current.sendFormTelemetry("report-uuid");
    });

    const call = vi.mocked(sendTelemetry).mock.calls[0][0];
    const duration = call.metadata.duration;

    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1); // Less than 1 second
  });

  it("should not send telemetry twice", async () => {
    const { result } = renderHook(() => useTelemetry("test-token"));

    await act(async () => {
      await result.current.sendFormTelemetry("report-uuid");
    });

    expect(sendTelemetry).toHaveBeenCalledTimes(1);

    // Try to send again
    await act(async () => {
      await result.current.sendFormTelemetry("report-uuid");
    });

    // Should still be called only once
    expect(sendTelemetry).toHaveBeenCalledTimes(1);
  });

  it("should handle telemetry without report UUID", async () => {
    const { result } = renderHook(() => useTelemetry("test-token"));

    await act(async () => {
      await result.current.sendFormTelemetry();
    });

    expect(sendTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        reportUuid: null,
      })
    );
  });
});
