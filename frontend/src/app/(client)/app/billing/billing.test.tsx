import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BillingPage from './page';

// Mock fetch
global.fetch = vi.fn();

describe('BillingPage Component', () => {
  const mockProjects = [
    { id: 'proj-1', title: 'Test Project 1', status: 'REVIEW', description: 'Desc 1', requirements: { selected_plan: 'GROWTH' } },
    { id: 'proj-2', title: 'Test Project 2', status: 'DRAFT', description: 'Desc 2', requirements: { selected_plan: 'STANDARD' } }
  ];

  const mockSubscription = {
    id: 'sub-1',
    project_id: 'proj-1',
    status: 'active',
    plan_name: 'GROWTH',
    cancel_at_period_end: false,
    current_period_end: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project selection grid', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });

    render(<BillingPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Project 1/i)).toBeTruthy();
      expect(screen.getByText(/Test Project 2/i)).toBeTruthy();
    });
  });

  it('renders billing details when a project is selected', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubscription,
    });

    render(<BillingPage />);
    
    // Select Test Project 1
    const projectBtn = await screen.findByText(/Test Project 1/i);
    fireEvent.click(projectBtn);

    // GROWTH Plan (H2)
    expect(await screen.findByText(/GROWTH Plan/i)).toBeTruthy();
    
    // Price check (using getAll to handle multiple occurrences like sidebar and main card)
    await waitFor(() => {
        const priceElements = screen.getAllByText((content) => content.includes('RM') && content.includes('190'));
        expect(priceElements.length).toBeGreaterThan(0);
    });
    
    expect(screen.getByText(/Automated Renewal/i)).toBeTruthy();
  });

  it('calls checkout API when Activate Now is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" }),
    });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://stripe.com/checkout' }),
    });

    render(<BillingPage />);
    
    const projectBtn = await screen.findByText(/Test Project 1/i);
    fireEvent.click(projectBtn);

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    const activateBtn = await screen.findByText(/Activate Now/i);
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(window.location.href).toBe('https://stripe.com/checkout');
    });

    window.location = originalLocation;
  });
});
