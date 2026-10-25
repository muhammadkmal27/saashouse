import { API_BASE_URL } from '@/utils/api';

export async function getAutopilot<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = (API_BASE_URL || '') + endpoint + query;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message || res.statusText || ('Status ' + res.status);
    throw new Error('GET ' + endpoint + ' failed: ' + message);
  }
  return res.json();
}

export async function postAutopilot<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
  const url = (API_BASE_URL || '') + endpoint;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message || res.statusText || ('Status ' + res.status);
    throw new Error('POST ' + endpoint + ' failed: ' + message);
  }
  return res.json();
}
