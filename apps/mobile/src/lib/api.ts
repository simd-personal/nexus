import { Platform } from 'react-native';
import { getApiBaseUrl } from '@/lib/config';
import {
  streamChatWithFetch,
  streamChatWithXhr,
  type ChatStreamHandlers,
} from '@/lib/chat-stream';
import { supabase } from '@/lib/supabase';
import type {
  ActionItem,
  ChatMessage,
  ChatSession,
  CriticalItem,
  DashboardStats,
  DashboardUpdatesFeed,
  InboundInfo,
  Project,
  ProjectFile,
  ProjectOverviewResponse,
  ProjectWithStats,
  SunnyUpdate,
  DashboardPortfolioScope,
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

function withPortfolioQuery(path: string, portfolio?: DashboardPortfolioScope) {
  if (!portfolio) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}portfolio=${portfolio}`;
}

function scopedListPath(
  basePath: string,
  options?: { portfolio?: DashboardPortfolioScope; limit?: number }
) {
  const params = new URLSearchParams();
  if (options?.portfolio) params.set('portfolio', options.portfolio);
  if (options?.limit) params.set('limit', String(options.limit));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Uses the signed-in user's saved dashboard scope (same as web) when portfolio is omitted. */
export function fetchDashboardPortfolioPreference() {
  return apiJson<{ scope: DashboardPortfolioScope }>('/api/me/dashboard-portfolio');
}

export function updateDashboardPortfolioPreference(scope: DashboardPortfolioScope) {
  return apiJson<{ success: boolean }>('/api/me/dashboard-portfolio', {
    method: 'POST',
    body: JSON.stringify({ scope }),
  });
}

export function fetchDashboardStats(options?: { portfolio?: DashboardPortfolioScope }) {
  return apiJson<{ stats: DashboardStats; portfolio: DashboardPortfolioScope }>(
    withPortfolioQuery('/api/dashboard/stats', options?.portfolio)
  );
}

export function fetchDashboardUpdates(
  limit = 5,
  options?: { portfolio?: DashboardPortfolioScope }
) {
  return apiJson<DashboardUpdatesFeed>(
    withPortfolioQuery(`/api/dashboard/updates?limit=${limit}`, options?.portfolio)
  );
}

export function fetchSunnyUpdate(id: string) {
  return apiJson<{ update: SunnyUpdate }>(`/api/sunny-updates/${id}`);
}

export function fetchCriticalItems(
  limit?: number,
  options?: { portfolio?: DashboardPortfolioScope }
) {
  return apiJson<{ items: CriticalItem[]; portfolio: DashboardPortfolioScope }>(
    scopedListPath('/api/critical-items', { ...options, limit })
  );
}

export function fetchOpenActionItems(
  limit?: number,
  options?: { portfolio?: DashboardPortfolioScope }
) {
  return apiJson<{ items: ActionItem[]; portfolio: DashboardPortfolioScope }>(
    scopedListPath('/api/action-items', { ...options, limit })
  );
}

export function fetchProjects(options?: { portfolio?: DashboardPortfolioScope }) {
  return apiJson<{ projects: ProjectWithStats[]; portfolio: DashboardPortfolioScope }>(
    withPortfolioQuery('/api/projects', options?.portfolio)
  );
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

export function updateActionItemStatus(
  itemId: string,
  status: ActionItem['status'],
  options?: { applies_to_me?: boolean }
) {
  return apiJson<{ success: boolean }>(`/api/action-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...options }),
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

export function fetchProjectFiles(projectId: string) {
  return apiJson<{ files: ProjectFile[] }>(`/api/projects/${projectId}/files`);
}

export function fetchProjectInbound(projectId: string) {
  return apiJson<InboundInfo>(`/api/projects/${projectId}/inbound`);
}

export function fetchAccountInbound() {
  return apiJson<InboundInfo>('/api/account/inbound');
}

export type CreateProjectInput = {
  clientName: string;
  projectName: string;
  description?: string;
  sunnyNotes?: string;
  portfolio?: 'work' | 'personal';
  parentProjectId?: string;
};

export async function createProject(input: CreateProjectInput) {
  const formData = new FormData();
  formData.append('client_name', input.clientName.trim());
  formData.append('project_name', input.projectName.trim());
  if (input.description?.trim()) formData.append('description', input.description.trim());
  if (input.sunnyNotes?.trim()) formData.append('sunny_notes', input.sunnyNotes.trim());
  if (input.portfolio) formData.append('portfolio', input.portfolio);
  if (input.parentProjectId) formData.append('parent_project_id', input.parentProjectId);

  const response = await apiFetch('/api/projects', { method: 'POST', body: formData });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    upgradeRequired?: boolean;
    data?: Project;
  };

  if (!response.ok) {
    throw new ApiError(body.error ?? 'Could not create project', response.status);
  }

  if (!body.data) {
    throw new ApiError('Project was created but no data returned', 500);
  }

  return { project: body.data, upgradeRequired: body.upgradeRequired };
}

export async function uploadProjectFile(
  projectId: string,
  uri: string,
  fileName: string,
  mimeType: string,
  userNote?: string
) {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append(
    'file',
    {
      uri,
      name: fileName,
      type: mimeType,
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
    if (response.status === 413) {
      throw new ApiError('File is too large for upload (max 4 MB on mobile).', response.status);
    }
    if (response.status === 400 && !body.error) {
      throw new ApiError('Upload was rejected. Try capturing the photo again.', response.status);
    }
    throw new ApiError(body.error ?? `Upload failed (${response.status})`, response.status);
  }
  return body;
}

export async function uploadProjectPhoto(projectId: string, uri: string, fileName: string, userNote?: string) {
  return uploadProjectFile(projectId, uri, fileName, 'image/jpeg', userNote);
}

export type FilePreviewResponse = {
  fileName: string;
  mimeType: string;
  viewType: 'image' | 'pdf' | 'text' | 'spreadsheet' | 'docx' | 'unsupported';
  url: string | null;
  text?: string | null;
  html?: string | null;
  sheets?: { name: string; rows: string[][] }[];
  status: string;
  hasOriginal: boolean;
};

export function fetchFilePreview(fileId: string) {
  return apiJson<FilePreviewResponse>(`/api/files/${fileId}/view`);
}

export function patchProjectFile(
  fileId: string,
  patch: { file_name?: string; user_note?: string | null }
) {
  return apiJson<{ data: ProjectFile }>(`/api/files/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteProjectFile(fileId: string) {
  return apiJson<{ success: boolean }>(`/api/files/${fileId}`, { method: 'DELETE' });
}

export function removeProjectFile(fileId: string, projectId: string) {
  return apiJson<{ success: boolean }>(`/api/files/${fileId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
}

export function moveProjectFile(fileId: string, targetProjectId: string) {
  return apiJson<{ data: ProjectFile }>(`/api/files/${fileId}/move`, {
    method: 'POST',
    body: JSON.stringify({ target_project_id: targetProjectId }),
  });
}

export function shareProjectFile(fileId: string, targetProjectId: string) {
  return apiJson<{ data: ProjectFile }>(`/api/files/${fileId}/share`, {
    method: 'POST',
    body: JSON.stringify({ target_project_id: targetProjectId }),
  });
}

export function reprocessProjectFile(fileId: string) {
  return apiJson<{ success: boolean; status: string; file_id: string }>(
    `/api/files/${fileId}/reprocess`,
    { method: 'POST' }
  );
}

export async function replaceProjectFile(
  fileId: string,
  uri: string,
  fileName: string,
  mimeType: string
) {
  const formData = new FormData();
  formData.append(
    'file',
    {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob
  );

  const response = await apiFetch(`/api/files/${fileId}/replace`, {
    method: 'POST',
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    data?: ProjectFile;
    replaced?: boolean;
  };
  if (!response.ok) {
    throw new ApiError(body.error ?? 'Replace failed', response.status);
  }
  return body;
}

export function fetchSearchChatSessions() {
  return apiJson<{ sessions: ChatSession[] }>('/api/chat/sessions?type=search');
}

export type { ChatStreamHandlers };

async function streamSsePost(
  path: string,
  payload: string,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
) {
  if (Platform.OS !== 'web') {
    const token = await getAccessToken();
    try {
      await streamChatWithXhr(`${getApiBaseUrl()}${path}`, token, payload, handlers, signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : 'Stream failed';
      throw new ApiError(message, 500);
    }
    return;
  }

  const response = await apiFetch(path, {
    method: 'POST',
    body: payload,
    signal,
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(err.error ?? `Request failed (${response.status})`, response.status);
  }

  try {
    await streamChatWithFetch(response, handlers);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    const message = error instanceof Error ? error.message : 'Stream failed';
    throw new ApiError(message, 500);
  }
}

export async function streamSearchChat(
  input: {
    query: string;
    projectIds?: string[] | null;
    scopeLabels?: string[];
    sessionId?: string;
  },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
) {
  const payload = JSON.stringify({
    query: input.query,
    project_ids: input.projectIds ?? undefined,
    scope_labels: input.scopeLabels ?? [],
    session_id: input.sessionId,
  });
  await streamSsePost('/api/search/stream', payload, handlers, signal);
}

export async function streamProjectChat(
  input: {
    projectId: string;
    message: string;
    sessionId?: string;
  },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
) {
  const payload = JSON.stringify({
    project_id: input.projectId,
    message: input.message,
    session_id: input.sessionId,
  });

  await streamSsePost('/api/chat/stream', payload, handlers, signal);
}
