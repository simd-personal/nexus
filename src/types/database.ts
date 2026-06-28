export type ProjectStatus = 'healthy' | 'watch' | 'critical' | 'needs_review';
export type FileStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'uploaded_unprocessed';
export type SourceType = 'meeting' | 'email' | 'deck' | 'pdf' | 'note' | 'transcript' | 'audio' | 'csv' | 'other';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type CriticalCategory =
  | 'conflict'
  | 'risk'
  | 'missed_follow_up'
  | 'client_concern'
  | 'ownership_gap'
  | 'timeline_issue'
  | 'broken_process';
export type ItemStatus = 'open' | 'acknowledged' | 'resolved';
export type ActionItemStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TimelineEventType =
  | 'meeting'
  | 'file_upload'
  | 'email'
  | 'note'
  | 'sunny_summary'
  | 'critical_item'
  | 'action_item'
  | 'playbook'
  | 'follow_up_email'
  | 'contradiction';
export type GeneratedDocType = 'playbook' | 'follow_up_email' | 'brief' | 'memo';
export type AccountType = 'individual' | 'enterprise';
export type OrganizationIndustry = 'software' | 'healthcare' | 'other';
export type OrganizationMemberRole = 'owner' | 'admin' | 'member';
export type OrganizationMemberStatus = 'active' | 'suspended';
export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface Citation {
  file_id?: string;
  file_name: string;
  source_type?: SourceType;
  page_number?: number;
  timestamp_start?: string;
  timestamp_end?: string;
  sender?: string;
  date?: string;
  snippet: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
  account_type: AccountType;
  default_organization_id: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: OrganizationIndustry;
  phi_protection_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  status: OrganizationMemberStatus;
  joined_at: string;
}

export interface OrganizationAccessRequest {
  id: string;
  organization_id: string;
  user_id: string;
  message: string | null;
  status: AccessRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  organization_id: string | null;
  client_name: string;
  project_name: string;
  description: string | null;
  status: ProjectStatus;
  last_summary: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  file_count: number;
  meeting_count: number;
  email_count: number;
  action_item_count: number;
  critical_item_count: number;
  last_sunny_update: string | null;
}

export interface FileRecord {
  id: string;
  project_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_type: string;
  source_type: SourceType;
  storage_path: string | null;
  status: FileStatus;
  extracted_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Chunk {
  id: string;
  project_id: string;
  file_id: string;
  chunk_index: number;
  text: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SunnyUpdate {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  why_it_matters: string | null;
  suggested_action: string | null;
  source_citations: Citation[];
  created_at: string;
  project?: Pick<Project, 'client_name' | 'project_name'>;
}

export interface CriticalItem {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  severity: Severity;
  category: CriticalCategory;
  status: ItemStatus;
  sunny_reasoning: string | null;
  suggested_owner: string | null;
  suggested_next_action: string | null;
  source_citations: Citation[];
  created_at: string;
  updated_at: string;
  project?: Pick<Project, 'client_name' | 'project_name'>;
}

export interface ActionItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  owner: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  source_citations: Citation[];
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  source_file_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  metadata: Record<string, unknown>;
  created_at: string;
  session_id?: string | null;
}

export interface ChatSession {
  id: string;
  owner_id: string;
  project_id: string | null;
  session_type: 'project' | 'search' | 'brief' | 'playbook';
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  id: string;
  project_id: string;
  type: GeneratedDocType;
  title: string;
  content: string;
  citations: Citation[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SearchResult {
  id: string;
  project_id: string;
  file_id: string;
  chunk_index: number;
  text: string;
  metadata: Record<string, unknown>;
  similarity?: number;
  rank?: number;
  match_reason: string;
  file_name?: string;
  source_type?: SourceType;
  client_name?: string;
  project_name?: string;
}

export interface SunnyBrief {
  executive_summary: string;
  what_changed_recently: string;
  critical_items: string;
  client_concerns: string;
  risks: string;
  opportunities: string;
  people_mentioned: string;
  facilities_mentioned: string;
  open_action_items: string;
  contradictions: string;
  recommended_next_steps: string;
  citations: Citation[];
}

export interface SunnyChatArtifact {
  type: 'brief' | 'deck' | 'playbook' | 'follow_up_email' | 'summary' | 'action_items';
  title: string;
  content: string;
}

export type ModelEngine = 'gpt' | 'claude';

/** User-facing model choice: auto-route, or force one provider. */
export type ModelPreference = 'auto' | 'gpt' | 'claude';

export interface SunnyChatResponse {
  answer: string;
  citations: Citation[];
  confidence: 'high' | 'medium' | 'low';
  suggested_next_step?: string;
  artifact?: SunnyChatArtifact;
  actions_taken?: string[];
  model?: ModelEngine;
}
