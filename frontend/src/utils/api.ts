const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('badori_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (payload: { full_name: string; email: string; phone: string; password: string; country: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  accounts: {
    list: () => request<{ accounts: any[] }>('/accounts'),
    create: (account_type: string) =>
      request<{ account: any }>('/accounts', { method: 'POST', body: JSON.stringify({ account_type }) }),
    deposit: (id: string, amount: number, description?: string) =>
      request<{ account: any; transaction: any }>(`/accounts/${id}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amount, description }),
      }),
    withdraw: (id: string, amount: number, description?: string) =>
      request<{ account: any; transaction: any }>(`/accounts/${id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ amount, description }),
      }),
  },
  transactions: {
    list: () => request<{ transactions: any[] }>('/transactions'),
    transfer: (payload: { from_account_id: string; to_account_number: string; amount: number; description?: string }) =>
      request<{ transaction: any }>('/transactions/transfer', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    rates: () => request<{ rates: any[] }>('/transactions/rates'),
  },
};
