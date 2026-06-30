import { getApiBaseUrl } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { parseSseChunk } from '@/lib/sse';
import type {
  ChatMessage,
  ChatSession,
  CriticalItem,
  DashboardStats,
  DashboardUpdatesFeed,
  ProjectOverviewResponse,
  ProjectWithStats,
  SunnyUpdate,
} from '@/lib/types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const body = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new ApiError(body.error ?? `Request failed (${response.status})`, response.status);
  }

  return body as T;
}

export function fetchDashboardStats() {
  return apiJson<{ stats: DashboardStats; portfolio: string }>('/api/dashboard/stats');
}

export function fetchDashboardUpdates(limit = 5) {
  return apiJson<DashboardUpdatesFeed>(`/api/dashboard/updates?limit=${limit}`);
}

export function fetchSunnyUpdate(id: string) {
  return apiJson<{ update: SunnyUpdate }>(`/api/sunny-updates/${id}`);
}

export function fetchCriticalItems(limit?: number) {
  const query = limit ? `?limit=${limit}` : '';
  return apiJson<{ items: CriticalItem[] }>(`/api/critical-items${query}`);
}

export function fetchProjects() {
  return apiJson<{ projects: ProjectWithStats[] }>('/api/projects');
}

export function fetchProjectOverview(projectId: string) {
  return apiJson<ProjectOverviewResponse>(`/api/projects/${projectId}/overview`);
}

export function updateCriticalItemStatus(itemId: string, status: 'acknowledged' | 'resolved') {
  return apiJson<{ success: boolean }>(`/api/critical-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function fetchChatSessions(projectId: string) {
  return apiJson<{ sessions: ChatSession[] }>(
    `/api/chat/sessions?type=project&project_id=${encodeURIComponent(projectId)}`
  );
}

export function fetchChatSession(sessionId: string) {
  return apiJson<{ session: ChatSession; messages: ChatMessage[] }>(`/api/chat/sessions/${sessionId}`);
}

export async function uploadProjectPhoto(projectId: string, uri: string, fileName: string, userNote?: string) {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append(
    'file',
    {
      uri,
      name: fileName,
      type: 'image/jpeg',
    } as unknown as Blob
  );
  if (userNote?.trim()) {
    formData.append('user_note', userNote.trim());
  }

  const response = await apiFetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string; data?: { id: string } };
  if (!response.ok) {
    throw new ApiError(body.error ?? 'Upload failed', response.status);
  }
  return body;
}

export type ChatStreamHandlers = {
  onSession?: (sessionId: string, title?: string) => void;
  onStatus?: (message: string) => void;
  onToken?: (fullText: string) => void;
  onMeta?: (meta: Record<string, unknown>) => void;
  onDone?: (sessionId: string) => void;
  onError?: (message: string) => void;
};

export async function streamProjectChat(
  input: {
    projectId: string;
    message: string;
    sessionId?: string;
  },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
) {
  const response = await apiFetch('/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify({
      project_id: input.projectId,
      message: input.message,
      session_id: input.sessionId,
    }),
    signal,
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(err.error ?? `Chat failed (${response.status})`, response.status);
  }

  if (!response.body) {
    throw new ApiError('No response stream', 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = parseSseChunk(buffer);
    buffer = remainder;

    for (const event of events) {
      switch (event.event) {
        case 'session':
          handlers.onSession?.(
            String(event.data.session_id),
            event.data.title ? String(event.data.title) : undefined
          );
          break;
        case 'status':
          handlers.onStatus?.(String(event.data.message ?? ''));
          break;
        case 'token':
          fullText += String(event.data.text ?? '');
          handlers.onToken?.(fullText);
          break;
        case 'meta':
          handlers.onMeta?.(event.data);
          break;
        case 'done':
          handlers.onDone?.(String(event.data.session_id));
          break;
        case 'error':
          handlers.onError?.(String(event.data.message ?? 'Stream error'));
          break;
      }
    }
  }
}
