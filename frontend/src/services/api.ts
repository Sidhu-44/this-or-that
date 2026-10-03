import type { DailyPollResponse, VoteResponse, ArchivePollItem, Poll, PollInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Manage anonymous voter ID in localStorage
export function getVoterId(): string {
  const STORAGE_KEY = 'thisorthat_voter_id';
  let voterId = localStorage.getItem(STORAGE_KEY);
  if (!voterId) {
    voterId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'voter_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, voterId);
  }
  return voterId;
}

// Manage admin secret key in localStorage
export function getAdminKey(): string | null {
  return localStorage.getItem('thisorthat_admin_key');
}

export function setAdminKey(key: string): void {
  localStorage.setItem('thisorthat_admin_key', key);
}

export function removeAdminKey(): void {
  localStorage.removeItem('thisorthat_admin_key');
}

// Public API Calls
export async function fetchTodayPoll(): Promise<DailyPollResponse> {
  const voterId = getVoterId();
  const res = await fetch(`${API_BASE_URL}/api/polls/today`, {
    headers: {
      'X-Voter-ID': voterId,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch today\'s poll');
  }
  return res.json();
}

export async function fetchPollById(pollId: number): Promise<DailyPollResponse> {
  const voterId = getVoterId();
  const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}`, {
    headers: {
      'X-Voter-ID': voterId,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch poll');
  }
  return res.json();
}

export async function fetchArchive(): Promise<ArchivePollItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/polls/archive`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to load poll archive');
  }
  return res.json();
}

export async function castVote(pollId: number, optionSelected: 'A' | 'B'): Promise<VoteResponse> {
  const voterId = getVoterId();
  const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Voter-ID': voterId,
    },
    body: JSON.stringify({ option_selected: optionSelected }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit vote');
  }
  return data;
}

// Admin API Calls
export async function verifyAdminKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
      headers: {
        'X-Admin-Key': key,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchAdminPolls(): Promise<ArchivePollItem[]> {
  const key = getAdminKey();
  const res = await fetch(`${API_BASE_URL}/api/admin/polls`, {
    headers: {
      'X-Admin-Key': key || '',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Admin authentication failed');
  }
  return res.json();
}

export async function createAdminPoll(pollData: PollInput): Promise<Poll> {
  const key = getAdminKey();
  const res = await fetch(`${API_BASE_URL}/api/admin/polls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': key || '',
    },
    body: JSON.stringify(pollData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to create poll');
  }
  return data;
}

export async function updateAdminPoll(pollId: number, pollData: Partial<PollInput>): Promise<Poll> {
  const key = getAdminKey();
  const res = await fetch(`${API_BASE_URL}/api/admin/polls/${pollId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': key || '',
    },
    body: JSON.stringify(pollData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update poll');
  }
  return data;
}

export async function deleteAdminPoll(pollId: number): Promise<void> {
  const key = getAdminKey();
  const res = await fetch(`${API_BASE_URL}/api/admin/polls/${pollId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Key': key || '',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete poll');
  }
}

export async function seedAdminData(): Promise<{ message: string }> {
  const key = getAdminKey();
  const res = await fetch(`${API_BASE_URL}/api/admin/seed`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': key || '',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to seed sample data');
  }
  return data;
}
