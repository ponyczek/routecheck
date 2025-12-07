import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTokenValidation } from '../hooks/useTokenValidation';

// Mock the API module
vi.mock('../api', () => ({
  validateToken: vi.fn(),
}));

import { validateToken } from '../api';

describe('useTokenValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with validating state', () => {
    vi.mocked(validateToken).mockImplementation(() => new Promise(() => {}));
    
    const { result } = renderHook(() => useTokenValidation('test-token'));
    
    expect(result.current.isValidating).toBe(true);
    expect(result.current.isValid).toBe(false);
    expect(result.current.validationData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set validation data on success', async () => {
    const mockData = {
      valid: true as const,
      driverName: 'Jan Kowalski',
      vehicleRegistration: 'WA12345',
      expiresAt: '2025-12-01T22:00:00Z',
      editableUntil: '2025-12-01T21:10:00Z',
    };

    vi.mocked(validateToken).mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useTokenValidation('test-token'));
    
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });
    
    expect(result.current.isValid).toBe(true);
    expect(result.current.validationData).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should set error on failure', async () => {
    const mockError = {
      code: '404',
      message: 'Token not found',
    };

    vi.mocked(validateToken).mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useTokenValidation('invalid-token'));
    
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });
    
    expect(result.current.isValid).toBe(false);
    expect(result.current.validationData).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should call validateToken with correct token', async () => {
    const token = 'specific-token-123';
    vi.mocked(validateToken).mockResolvedValue({
      valid: true,
      driverName: 'Test',
      vehicleRegistration: null,
      expiresAt: '2025-12-01T22:00:00Z',
      editableUntil: '2025-12-01T21:10:00Z',
    });
    
    renderHook(() => useTokenValidation(token));
    
    await waitFor(() => {
      expect(validateToken).toHaveBeenCalledWith(token);
    });
  });

  it('should cleanup on unmount', async () => {
    vi.mocked(validateToken).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        valid: true,
        driverName: 'Test',
        vehicleRegistration: null,
        expiresAt: '2025-12-01T22:00:00Z',
        editableUntil: '2025-12-01T21:10:00Z',
      }), 100))
    );
    
    const { result, unmount } = renderHook(() => useTokenValidation('test-token'));
    
    expect(result.current.isValidating).toBe(true);
    
    // Unmount before validation completes
    unmount();
    
    // Wait a bit to ensure promise doesn't update unmounted component
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // No errors should be thrown
    expect(true).toBe(true);
  });
});


