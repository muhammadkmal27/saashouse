import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('DashboardPage Component', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    // Mock user context if needed, otherwise mock fetch
  });

  it('renders dashboard with project list', async () => {
    // Mock projects fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', title: 'Test Project 1', status: 'LIVE', description: 'Desc 1', updated_at: new Date().toISOString() },
        { id: '2', title: 'Draft Project 2', status: 'DRAFT', description: 'Desc 2', updated_at: new Date().toISOString() },
      ],
    });

    render(<DashboardPage />);
    
    // 1. Wait for loading indicator to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Synchronizing Project Data/i)).toBeNull();
    }, { timeout: 5000 });
    
    // 2. Now check for content using exact: false to handle wrapping/whitespace
    expect(screen.getByText('Welcome back!', { exact: false })).toBeDefined();
    expect(screen.getAllByText('Test Project 1', { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft Project 2', { exact: false }).length).toBeGreaterThan(0);
    
    expect(screen.getAllByText(/LIVE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/DRAFT/i).length).toBeGreaterThan(0);
  });

  it('shows empty state if no projects', async () => {
    // Mock empty projects fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/No active projects detected/i)).toBeDefined();
    });
  });
});
