import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmitButton } from '../SubmitButton';

describe('SubmitButton', () => {
  it('should show happy path text when not problem', () => {
    render(<SubmitButton isSubmitting={false} isProblem={false} isOnline={true} />);
    
    expect(screen.getByRole('button')).toHaveTextContent('Wyślij raport - Wszystko OK');
  });

  it('should show problem path text when problem', () => {
    render(<SubmitButton isSubmitting={false} isProblem={true} isOnline={true} />);
    
    expect(screen.getByRole('button')).toHaveTextContent('Wyślij zgłoszenie problemu');
  });

  it('should show submitting text when submitting', () => {
    render(<SubmitButton isSubmitting={true} isProblem={false} isOnline={true} />);
    
    expect(screen.getByRole('button')).toHaveTextContent('Wysyłam...');
  });

  it('should show offline text when offline', () => {
    render(<SubmitButton isSubmitting={false} isProblem={false} isOnline={false} />);
    
    expect(screen.getByRole('button')).toHaveTextContent('Wyślę gdy będzie sieć');
  });

  it('should be disabled when submitting', () => {
    render(<SubmitButton isSubmitting={true} isProblem={false} isOnline={true} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not be disabled when not submitting and online', () => {
    render(<SubmitButton isSubmitting={false} isProblem={false} isOnline={true} />);
    
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('should show spinner when submitting', () => {
    render(<SubmitButton isSubmitting={true} isProblem={false} isOnline={true} />);
    
    // Loader icon should be present
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('should have type submit', () => {
    render(<SubmitButton isSubmitting={false} isProblem={false} isOnline={true} />);
    
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('should have aria-busy when submitting', () => {
    render(<SubmitButton isSubmitting={true} isProblem={false} isOnline={true} />);
    
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});


