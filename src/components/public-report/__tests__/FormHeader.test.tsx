import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormHeader } from '../FormHeader';

describe('FormHeader', () => {
  const defaultProps = {
    driverName: 'Jan Kowalski',
    vehicleRegistration: 'WA12345',
    expiresAt: '2025-12-01T22:00:00Z',
  };

  it('should render driver name', () => {
    render(<FormHeader {...defaultProps} />);
    
    expect(screen.getByText('Cześć, Jan Kowalski!')).toBeInTheDocument();
  });

  it('should render vehicle registration', () => {
    render(<FormHeader {...defaultProps} />);
    
    expect(screen.getByText('Pojazd:')).toBeInTheDocument();
    expect(screen.getByText('WA12345')).toBeInTheDocument();
  });

  it('should render message when no vehicle', () => {
    render(<FormHeader {...defaultProps} vehicleRegistration={null} />);
    
    expect(screen.getByText('Brak przypisanego pojazdu')).toBeInTheDocument();
  });

  it('should render expiration time', () => {
    render(<FormHeader {...defaultProps} />);
    
    expect(screen.getByText(/Link wygasa:/i)).toBeInTheDocument();
    // Time element should be present
    expect(screen.getByText(/Link wygasa:/i).parentElement?.querySelector('time')).toBeInTheDocument();
  });

  it('should use time element with datetime attribute', () => {
    render(<FormHeader {...defaultProps} />);
    
    const timeElement = screen.getByText(/Link wygasa:/i).parentElement?.querySelector('time');
    expect(timeElement).toHaveAttribute('dateTime', defaultProps.expiresAt);
  });
});


