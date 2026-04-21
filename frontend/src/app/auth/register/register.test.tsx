import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from './page';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock cookie utility
vi.mock('@/utils/cookies', () => ({
  getCookie: vi.fn(),
}));

describe('RegisterPage Component', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders registration form correctly', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/Create an account/i)).toBeDefined();
    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined();
  });

  it('shows error message if registration fails', async () => {
    // Mock fetch failure
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already exists' }),
    });

    render(<RegisterPage />);
    
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'dup@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeDefined();
    });
  });

  it('redirects to dashboard on successful registration', async () => {
    // Mock fetch success
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'SUCCESS' }),
    });

    render(<RegisterPage />);
    
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Success User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'success@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Success flow involves dynamic import of cookies, so we wait for router push
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app/dashboard');
    });
  });
});
