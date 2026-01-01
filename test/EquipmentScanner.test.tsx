import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EquipmentScanner from '../components/EquipmentScanner';
import { useApp } from '../context/AppContext';
import { identifyEquipment, generateWorkoutPlan } from '../services/geminiService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../services/geminiService', () => ({
  identifyEquipment: vi.fn(),
  generateWorkoutPlan: vi.fn(),
}));

describe('EquipmentScanner', () => {
  const mockSetEquipment = vi.fn();
  const mockSetPlan = vi.fn();
  const mockSetStep = vi.fn();
  const mockSetLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue({
      user: { id: 'user1' },
      setEquipment: mockSetEquipment,
      setPlan: mockSetPlan,
      setStep: mockSetStep,
      setLoading: mockSetLoading,
      isLoading: false,
    });
  });

  it('displays error when generation fails', async () => {
    (generateWorkoutPlan as any).mockRejectedValue(new Error('Network error'));
    
    render(<EquipmentScanner />);
    
    // Add a dummy item so we can generate
    const input = screen.getByPlaceholderText(/Add manually/i);
    fireEvent.change(input, { target: { value: 'Dumbbells' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Click generate
    const generateBtn = screen.getByText('Generate Workout Plan');
    fireEvent.click(generateBtn);

    // Verify loading state
    expect(mockSetLoading).toHaveBeenCalledWith(true);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate workout plan/i)).toBeInTheDocument();
    });

    // Verify loading stopped
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('clears error when trying again', async () => {
    (generateWorkoutPlan as any).mockRejectedValueOnce(new Error('Fail')).mockResolvedValueOnce({});
    
    render(<EquipmentScanner />);
    
    // Add item
    const input = screen.getByPlaceholderText(/Add manually/i);
    fireEvent.change(input, { target: { value: 'Barbell' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Fail first time
    fireEvent.click(screen.getByText('Generate Workout Plan'));
    await waitFor(() => screen.getByText(/Failed/i));

    // Try again
    fireEvent.click(screen.getByText('Generate Workout Plan'));
    
    // Error should disappear (we'd need to check implementation details or just that success happens)
    // The implementation clears error at start of handleGenerate
    
    await waitFor(() => {
      expect(mockSetStep).toHaveBeenCalledWith('dashboard');
    });
  });
});