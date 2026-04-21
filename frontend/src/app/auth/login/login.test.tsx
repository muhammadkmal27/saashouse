import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('LoginPage Component', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Welcome back/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
  });

  it('shows error message on failed login', async () => {
    // Mock fetch failure
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeDefined();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    // Mock fetch success
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'SUCCESS' }),
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'correct@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'correctpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app/dashboard');
    });
  });

  it('redirects to 2FA verification if required', async () => {
    // Mock 2FA requirement
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: '2FA_REQUIRED' }),
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: '2fa@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/verify-2fa');
    });
  });
});
