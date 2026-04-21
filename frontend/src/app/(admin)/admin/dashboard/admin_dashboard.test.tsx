import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './page';

// Mock fetch
global.fetch = vi.fn();

describe('AdminDashboard Component', () => {
    const mockStats = {
        total_mrr: 15450,
        total_clients: 24,
        active_projects: 12
    };

    const mockProjects = [
        { id: '1', title: 'Test Project A', status: 'LIVE', subscription_status: 'active' },
        { id: '2', title: 'Test Project B', status: 'REVIEW', subscription_status: 'none' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays loading state initially', () => {
        (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves for this test
        render(<AdminDashboard />);
        expect(screen.getByText(/Loading System Oversight/i)).toBeDefined();
    });

    it('renders stats and recent projects after data fetch', async () => {
        // 1. Mock Stats
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockStats,
        });
        // 2. Mock Projects
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockProjects,
        });

        render(<AdminDashboard />);

        await waitFor(() => {
            // Check Stats
            expect(screen.getByText(/RM 15,450/i)).toBeDefined();
            expect(screen.getByText(/24 Klien/i)).toBeDefined();
            expect(screen.getByText(/12 Projects/i)).toBeDefined();

            // Check Projects Table
            expect(screen.getByText(/Test Project A/i)).toBeDefined();
            expect(screen.getByText(/Test Project B/i)).toBeDefined();
        });
    });

    it('handles empty activity gracefully', async () => {
        (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => mockStats });
        (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText(/No recent activity detected/i)).toBeDefined();
        });
    });
});
