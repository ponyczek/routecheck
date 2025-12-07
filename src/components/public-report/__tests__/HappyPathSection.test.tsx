import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HappyPathSection } from '../HappyPathSection';

describe('HappyPathSection', () => {
  it('should render success icon', () => {
    const { container } = render(<HappyPathSection />);
    
    // Check for SVG icon
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render confirmation message', () => {
    render(<HappyPathSection />);
    
    expect(screen.getByText('Świetnie!')).toBeInTheDocument();
    expect(screen.getByText(/Trasa przebiegła bez problemów/i)).toBeInTheDocument();
  });

  it('should render edit info', () => {
    render(<HappyPathSection />);
    
    expect(screen.getByText(/10 minut/i)).toBeInTheDocument();
    expect(screen.getByText(/edytować ten raport/i)).toBeInTheDocument();
  });

  it('should have proper structure for mobile', () => {
    const { container } = render(<HappyPathSection />);
    
    // Should have centered layout
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center');
  });
});

