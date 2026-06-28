import type { SupabaseClient } from '@supabase/supabase-js';
import { extractInboundRecipients } from '@/lib/inbound/addresses';
import { matchProjectFromSubject } from '@/lib/inbound/match-project';
import {
  buildEmailDocument,
  type InboundEmailPayload,
} from '@/lib/inbound/parse-payload';
import {
  createProjectFileFromBuffer,
  inferSourceTypeFromAttachment,
} from '@/lib/files/create-from-buffer';
import { sanitizeUploadFileName } from '@/lib/upload/client';

export interface ResolvedInboundTarget {
  projectId: string;
  ownerId: string;
  routing: 'project_address' | 'user_address' | 'manual_assignment';
}

export type ResolveInboundResult =
  | { status: 'matched'; target: ResolvedInboundTarget }
  | { status: 'pending_assignment'; ownerId: string; detail: string }
  | { status: 'rejected'; detail: string };

const PENDING_ASSIGNMENT_DETAIL =
  'Could not determine which project this email belongs to. Assign it from your dashboard or include the client and project name in the subject.';

export async function resolveInboundTarget(
  supabase: SupabaseClient,
  payload: InboundEmailPayload
): Promise<ResolveInboundResult> {
  const recipients = extractInboundRecipients(payload.to);
  if (!recipients.length) {
    return { status: 'rejected', detail: 'No inbound UpperDeck address found in recipients' };
  }

  for (const recipient of recipients) {
    if (recipient.type === 'project') {
      const { data: project } = await supabase
        .from('projects')
        .select('id, owner_id')
        .eq('inbound_token', recipient.token)
        .single();

      if (project) {
        return {
          status: 'matched',
          target: {
            projectId: project.id,
            ownerId: project.owner_id,
            routing: 'project_address',
          },
        };
      }
    }
  }

  for (const recipient of recipients) {
    if (recipient.type !== 'user') continue;

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('inbound_token', recipient.token)
      .single();

    if (!profile) continue;

    const { data: projects } = await supabase
      .from('projects')
      .select('id, client_name, project_name, last_activity_at, owner_id')
      .eq('owner_id', profile.user_id)
      .order('last_activity_at', { ascending: false });

    const match = matchProjectFromSubject(payload.subject, projects ?? []);
    if (!match) {
      return {
        status: 'pending_assignment',
        ownerId: profile.user_id,
        detail: PENDING_ASSIGNMENT_DETAIL,
      };
    }

    return {
      status: 'matched',
      target: {
        projectId: match.id,
        ownerId: profile.user_id,
        routing: 'user_address',
      },
    };
  }

  return { status: 'rejected', detail: 'Inbound address not recognized' };
}

export async function ingestInboundEmail(
  supabase: SupabaseClient,
  target: ResolvedInboundTarget,
  payload: InboundEmailPayload
): Promise<{ fileIds: string[] } | { error: string }> {
  const fileIds: string[] = [];
  const subjectSlug = sanitizeUploadFileName(payload.subject).slice(0, 80) || 'forwarded-email';
  const emailBody = buildEmailDocument(payload);

  const emailFile = await createProjectFileFromBuffer({
    supabase,
    projectId: target.projectId,
    uploadedBy: target.ownerId,
    fileName: `${subjectSlug}.eml`,
    buffer: Buffer.from(emailBody, 'utf8'),
    mimeType: 'message/rfc822',
    sourceType: 'email',
    userNote: `Forwarded from ${payload.from}`,
    metadata: {
      inbound_email: {
        from: payload.from,
        subject: payload.subject,
        routing: target.routing,
      },
    },
  });

  if ('error' in emailFile) return emailFile;
  fileIds.push(emailFile.fileId);

  for (const attachment of payload.attachments) {
    const attachmentFile = await createProjectFileFromBuffer({
      supabase,
      projectId: target.projectId,
      uploadedBy: target.ownerId,
      fileName: attachment.filename,
      buffer: attachment.content,
      mimeType: attachment.contentType,
      sourceType: inferSourceTypeFromAttachment(attachment.filename, attachment.contentType),
      userNote: attachment.inline
        ? `Image from email body: ${payload.subject}`
        : `Attachment from forwarded email: ${payload.subject}`,
      metadata: {
        inbound_email: {
          from: payload.from,
          subject: payload.subject,
          routing: target.routing,
          parent_email_file_id: emailFile.fileId,
          inline_image: attachment.inline ?? false,
        },
      },
    });

    if ('error' in attachmentFile) {
      return attachmentFile;
    }
    fileIds.push(attachmentFile.fileId);
  }

  return { fileIds };
}
