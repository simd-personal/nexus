/** Types shared between the mobile app and Next.js mobile API routes. */

export type ProjectStatus = 'healthy' | 'watch' | 'critical' | 'needs_review';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ItemStatus = 'open' | 'acknowledged' | 'resolved';
export type DashboardPortfolioScope = 'work' | 'personal' | 'all';

export interface Citation {
  file_id?: string;
  file_name: string;
  snippet: string;
  source_type?: string;
  page_number?: number;
}

export interface MobileProject {
  id: string;
  client_name: string;
  project_name: string;
  description: string | null;
  status: ProjectStatus;
  last_summary: string | null;
  last_activity_at: string | null;
  portfolio: 'work' | 'personal';
  file_count?: number;
  critical_item_count?: number;
  action_item_count?: number;
  sub_projects?: MobileProjectWithStats[];
}

export type MobileProjectWithStats = MobileProject;

export type ActionItemStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export interface MobileCriticalItem {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  severity: Severity;
  category: string;
  status: ItemStatus;
  sunny_reasoning: string | null;
  suggested_next_action: string | null;
  source_citations: Citation[];
  project?: { client_name: string; project_name: string };
}

export interface MobileActionItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  owner: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  applies_to_me: boolean;
  item_kind: string | null;
  matched_terms: string[];
  source_citations: Citation[];
  created_at: string;
  project?: { client_name: string; project_name: string };
}

export interface MobileSunnyUpdate {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  why_it_matters: string | null;
  suggested_action: string | null;
  source_citations: Citation[];
  created_at: string;
  project?: { client_name: string; project_name: string };
}

export interface MobileDashboardStats {
  criticalCount: number;
  newUpdatesCount: number;
  actionItemsCount: number;
  conflictsCount: number;
}

export interface MobileDashboardUpdatesFeed {
  updates: MobileSunnyUpdate[];
  indexingActive: boolean;
}

export interface MobileChatSession {
  id: string;
  title: string | null;
  project_id: string | null;
  session_type: string;
  created_at: string;
  updated_at: string;
}

export interface MobileChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface MobileProjectOverviewResponse {
  project: MobileProject;
  stats: {
    file_count: number;
    critical_item_count: number;
    action_item_count: number;
  } | null;
  critical_items: MobileCriticalItem[];
}

export interface MobileProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string | null;
  source_type: string | null;
  status: string;
  created_at: string;
  user_note: string | null;
  origin_file_id?: string | null;
}

export interface MobileInboundInfo {
  address: string;
  subject_hint: string;
  client_name?: string;
  project_name?: string;
}

export type MobileTimelineEventType =
  | 'meeting'
  | 'file_upload'
  | 'email'
  | 'note'
  | 'sunny_summary'
  | 'critical_item'
  | 'action_item'
  | 'playbook'
  | 'follow_up_email'
  | 'contradiction'
  | 'file_moved'
  | 'file_shared'
  | 'file_replaced';

export interface MobileTimelineEvent {
  id: string;
  project_id: string;
  event_type: MobileTimelineEventType;
  title: string;
  description: string | null;
  source_file_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ProjectGenerateType = 'brief' | 'playbook' | 'follow_up_email' | 'deck';

export interface ProjectGenerateResponse {
  title: string;
  content: string;
  type: string;
}
