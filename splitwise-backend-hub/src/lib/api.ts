import type {
  AuthResponse,
  User,
  Group,
  Expense,
  Balance,
  SimplifiedSettlement,
  Settlement,
  CreateExpenseRequest,
  CreateGroupRequest,
  RecordSettlementRequest,
  GroupMember,
} from '@/types/api';

// Configure your backend API base URL here
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/api/auth/me');
  }

  // Groups
  async createGroup(data: CreateGroupRequest): Promise<Group> {
    return this.request('/api/groups', { method: 'POST', body: JSON.stringify(data) });
  }

  async getGroups(): Promise<Group[]> {
    return this.request('/api/groups');
  }

  async getGroup(groupId: string): Promise<Group & { members: GroupMember[] }> {
    return this.request(`/api/groups/${groupId}`);
  }

  async deleteGroup(groupId: string): Promise<{ message: string }> {
    return this.request(`/api/groups/${groupId}`, { method: 'DELETE' });
  }

  async addMember(groupId: string, email: string): Promise<GroupMember> {
    return this.request(`/api/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async removeMember(groupId: string, memberId: string): Promise<{ message: string }> {
    return this.request(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
  }

  // Expenses
  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    return this.request('/api/expenses', { method: 'POST', body: JSON.stringify(data) });
  }

  async getGroupExpenses(groupId: string, limit = 50, offset = 0): Promise<Expense[]> {
    return this.request(`/api/expenses/group/${groupId}?limit=${limit}&offset=${offset}`);
  }

  async getExpense(expenseId: string): Promise<Expense> {
    return this.request(`/api/expenses/${expenseId}`);
  }

  async deleteExpense(expenseId: string): Promise<{ message: string }> {
    return this.request(`/api/expenses/${expenseId}`, { method: 'DELETE' });
  }

  async getGroupBalances(groupId: string): Promise<Balance[]> {
    return this.request(`/api/expenses/group/${groupId}/balances`);
  }

  // Settlements
  async getSimplifiedSettlements(groupId: string): Promise<SimplifiedSettlement[]> {
    return this.request(`/api/settlements/group/${groupId}/simplified`);
  }

  async recordSettlement(data: RecordSettlementRequest): Promise<Settlement> {
    return this.request('/api/settlements', { method: 'POST', body: JSON.stringify(data) });
  }

  async getGroupSettlements(groupId: string): Promise<Settlement[]> {
    return this.request(`/api/settlements/group/${groupId}`);
  }

  async confirmSettlement(settlementId: string): Promise<Settlement> {
    return this.request(`/api/settlements/${settlementId}/confirm`, { method: 'PATCH' });
  }

  async deleteSettlement(settlementId: string): Promise<{ message: string }> {
    return this.request(`/api/settlements/${settlementId}`, { method: 'DELETE' });
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();
