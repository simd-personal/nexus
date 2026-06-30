/**
 * End-to-end user flow smoke test — run while dev server is up.
 * Usage: npm run test:flows
 * Optional: SMOKE_SKIP_AI=1 to skip OpenAI/Claude calls
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient, type Session } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const SKIP_AI = process.env.SMOKE_SKIP_AI === '1';
const EMAIL = process.env.SEED_USER_EMAIL ?? 'sim@test.com';
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'admin';

type Result = { name: string; ok: boolean; detail?: string };

const results: Result[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function authCookie(session: Session): string {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const key = `sb-${ref}-auth-token`;
  const json = JSON.stringify(session);
  const base64url = Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${key}=base64-${base64url}`;
}

async function fetchApp(
  path: string,
  options: RequestInit & { cookie?: string } = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.cookie) headers.set('Cookie', options.cookie);
  return fetch(`${BASE}${path}`, {
    ...options,
    headers,
    redirect: 'manual',
  });
}

async function readSseUntil(
  res: Response,
  predicate: (chunk: string) => boolean,
  timeoutMs = 90_000
): Promise<string> {
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    if (predicate(buffer)) break;
  }

  try {
    await reader.cancel();
  } catch {
    // ignore
  }

  return buffer;
}

async function main() {
  console.log(`BriefNexus user flow smoke test → ${BASE}\n`);

  // --- Auth ---
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: auth, error: authError } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (authError || !auth.session) {
    fail('Sign in', authError?.message ?? 'No session');
    printSummary();
    process.exit(1);
  }
  pass('Sign in', EMAIL);

  const cookie = authCookie(auth.session);

  // Public + auth gates
  const loginPage = await fetchApp('/login');
  loginPage.status === 200 ? pass('Login page loads') : fail('Login page loads', String(loginPage.status));

  const dashUnauth = await fetchApp('/dashboard');
  dashUnauth.status === 307 || dashUnauth.status === 302
    ? pass('Unauthenticated dashboard redirects')
    : fail('Unauthenticated dashboard redirects', String(dashUnauth.status));

  const uploadUnauth = await fetchApp('/api/upload', {
    method: 'POST',
    body: new FormData(),
  });
  uploadUnauth.status === 401
    ? pass('Unauthenticated upload returns 401 JSON')
    : fail('Unauthenticated upload returns 401 JSON', String(uploadUnauth.status));

  // App pages (authenticated)
  const pages = [
    '/dashboard',
    '/projects',
    '/updates',
    '/critical-items',
    '/sunny',
    '/search',
    '/settings',
  ];

  let projectId: string | null = null;

  for (const path of pages) {
    const res = await fetchApp(path, { cookie });
    if (res.status === 200) {
      pass(`Page ${path}`);
    } else {
      fail(`Page ${path}`, `HTTP ${res.status}`);
    }
  }

  // Resolve a project
  const { data: projects } = await anon.from('projects').select('id, project_name').limit(1);
  projectId = projects?.[0]?.id ?? null;

  if (!projectId) {
    fail('Find project', 'No projects in database');
  } else {
    pass('Find project', projects![0].project_name);

    const projectPages = [
      `/projects/${projectId}/overview`,
      `/projects/${projectId}/files`,
      `/projects/${projectId}/timeline`,
      `/projects/${projectId}/critical-items`,
      `/projects/${projectId}/ask-sunny`,
      `/projects/${projectId}/deck`,
      `/projects/${projectId}/playbook`,
      `/projects/${projectId}/follow-up`,
      `/projects/${projectId}/search`,
    ];

    for (const path of projectPages) {
      const res = await fetchApp(path, { cookie });
      if (res.status === 200) {
        pass(`Page ${path.replace(projectId!, ':id')}`);
      } else {
        fail(`Page ${path.replace(projectId!, ':id')}`, `HTTP ${res.status}`);
      }
    }
  }

  if (!projectId) {
    printSummary();
    process.exit(1);
  }

  // --- Upload .md via API (human: drag or browse) ---
  const fixturesDir = join(process.cwd(), 'scripts/fixtures');
  mkdirSync(fixturesDir, { recursive: true });
  const mdPath = join(fixturesDir, `smoke-${Date.now()}.md`);
  writeFileSync(
    mdPath,
    '# Smoke Test Notes\n\nAcme approved the Denver expansion timeline on March 15.\n\nAction item: Sarah to send revised budget by Friday.\n'
  );

  const uploadForm = new FormData();
  uploadForm.append('project_id', projectId);
  uploadForm.append('file', new Blob([readFileSync(mdPath)], { type: 'text/markdown' }), 'smoke-test.md');

  const uploadRes = await fetchApp('/api/upload', {
    method: 'POST',
    cookie,
    body: uploadForm,
  });

  let fileId: string | null = null;
  if (uploadRes.status === 200) {
    const uploadData = await uploadRes.json();
    fileId = uploadData.data?.id ?? null;
    pass('Upload .md file', fileId ?? 'ok');
  } else {
    const errText = await uploadRes.text();
    fail('Upload .md file', `HTTP ${uploadRes.status}: ${errText.slice(0, 200)}`);
  }

  // Pasted text upload
  const pasteForm = new FormData();
  pasteForm.append('project_id', projectId);
  pasteForm.append('pasted_text', 'Meeting notes: Client confirmed Q3 priorities include vendor consolidation.');
  pasteForm.append('pasted_type', 'meeting');

  const pasteRes = await fetchApp('/api/upload', { method: 'POST', cookie, body: pasteForm });
  pasteRes.status === 200 ? pass('Paste meeting notes upload') : fail('Paste meeting notes upload', String(pasteRes.status));

  // Image upload (PNG) — common human flow for slide photos
  const pngFixture = join(fixturesDir, 'sample-slide.png');
  if (existsSync(pngFixture)) {
    const imgForm = new FormData();
    imgForm.append('project_id', projectId);
    imgForm.append(
      'file',
      new Blob([readFileSync(pngFixture)], { type: 'image/png' }),
      'sample-slide.png'
    );
    const imgRes = await fetchApp('/api/upload', { method: 'POST', cookie, body: imgForm });
    if (imgRes.status === 200) {
      const imgData = await imgRes.json();
      pass('Upload PNG image', imgData.data?.id ?? 'ok');
    } else {
      fail('Upload PNG image', String(imgRes.status));
    }
  } else {
    console.log('⊘ Skipping PNG upload — fixture missing');
  }

  // Poll file processing
  if (fileId) {
    let processed = false;
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const { data: file } = await anon.from('files').select('status, extracted_text').eq('id', fileId).single();
      if (file?.status === 'processed') {
        processed = true;
        pass('File processing completes', `${file.extracted_text?.length ?? 0} chars extracted`);
        break;
      }
      if (file?.status === 'failed') {
        fail('File processing completes', 'status=failed');
        break;
      }
    }
    if (!processed && results.every((r) => r.name !== 'File processing completes' || r.ok)) {
      fail('File processing completes', 'timeout after 3 min');
    }

    const viewRes = await fetchApp(`/api/files/${fileId}/view`, { cookie });
    if (viewRes.status === 200) {
      const view = await viewRes.json();
      view.viewType && (view.url || view.text)
        ? pass('File preview API', view.viewType)
        : fail('File preview API', 'missing url/text');
    } else {
      fail('File preview API', String(viewRes.status));
    }
  }

  const filesListRes = await fetchApp(`/api/projects/${projectId}/files`, { cookie });
  if (filesListRes.status === 200) {
    const { files } = await filesListRes.json();
    pass('List project files', `${files?.length ?? 0} files`);
  } else {
    fail('List project files', String(filesListRes.status));
  }

  // --- Chat sessions ---
  const sessionsRes = await fetchApp(`/api/chat/sessions?type=project&project_id=${projectId}`, { cookie });
  sessionsRes.status === 200 ? pass('List chat sessions') : fail('List chat sessions', String(sessionsRes.status));

  const createSessionRes = await fetchApp('/api/chat/sessions', {
    method: 'POST',
    cookie,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_type: 'project', project_id: projectId, title: 'Smoke test chat' }),
  });

  let sessionId: string | null = null;
  if (createSessionRes.status === 200) {
    const { session } = await createSessionRes.json();
    sessionId = session?.id ?? null;
    pass('Create chat session', sessionId ?? '');
  } else {
    fail('Create chat session', String(createSessionRes.status));
  }

  if (sessionId) {
    const getSessionRes = await fetchApp(`/api/chat/sessions/${sessionId}`, { cookie });
    getSessionRes.status === 200 ? pass('Get chat session') : fail('Get chat session', String(getSessionRes.status));
  }

  // --- AI flows (optional) ---
  if (SKIP_AI) {
    console.log('\n⊘ Skipping AI tests (SMOKE_SKIP_AI=1)\n');
  } else if (!process.env.OPENAI_API_KEY) {
    fail('AI tests', 'OPENAI_API_KEY missing');
  } else {
    // Search API
    const searchRes = await fetchApp('/api/search', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What did we decide about Denver?', project_id: projectId, limit: 5 }),
    });
    if (searchRes.status === 200) {
      const searchData = await searchRes.json();
      searchData.answer?.text || searchData.results?.length
        ? pass('Search API', `${searchData.results?.length ?? 0} results`)
        : fail('Search API', 'empty response');
    } else {
      fail('Search API', String(searchRes.status));
    }

    // Search stream
    const searchStreamRes = await fetchApp('/api/search/stream', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Summarize the latest project updates',
        project_id: projectId,
        session_id: sessionId,
      }),
    });

    if (searchStreamRes.status === 200) {
      const sse = await readSseUntil(
        searchStreamRes,
        (buf) => buf.includes('event: token') || buf.includes('event: done') || buf.includes('event: error'),
        120_000
      );
      if (sse.includes('event: error')) {
        fail('Search stream', sse.match(/event: error[\s\S]*?data: ([^\n]+)/)?.[1] ?? 'error event');
      } else if (sse.includes('event: token') || sse.includes('event: done')) {
        pass('Search stream', 'received SSE tokens');
      } else {
        fail('Search stream', 'no tokens within timeout');
      }
    } else {
      fail('Search stream', String(searchStreamRes.status));
    }

    // Project chat stream
    const chatStreamRes = await fetchApp('/api/chat/stream', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        message: 'What are the open action items?',
        session_id: sessionId,
        model_preference: 'gpt',
      }),
    });

    if (chatStreamRes.status === 200) {
      const sse = await readSseUntil(
        chatStreamRes,
        (buf) => buf.includes('event: token') || buf.includes('event: done') || buf.includes('event: error'),
        120_000
      );
      if (sse.includes('event: error')) {
        fail('Project chat stream', sse.match(/event: error[\s\S]*?data: ([^\n]+)/)?.[1] ?? 'error');
      } else if (sse.includes('event: token') || sse.includes('event: done')) {
        pass('Project chat stream', 'received SSE tokens');
      } else {
        fail('Project chat stream', 'no tokens within timeout');
      }
    } else {
      fail('Project chat stream', String(chatStreamRes.status));
    }

    // Generate brief
    const briefRes = await fetchApp('/api/generate', {
      method: 'POST',
      cookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, type: 'brief' }),
    });
    if (briefRes.status === 200) {
      const brief = await briefRes.json();
      brief.data?.content?.length > 100
        ? pass('Generate brief', `${brief.data.content.length} chars`)
        : fail('Generate brief', 'content too short');
    } else {
      fail('Generate brief', String(briefRes.status));
    }

    // Generate deck (Claude — can be slow)
    if (process.env.ANTHROPIC_API_KEY) {
      const genRes = await fetchApp('/api/generate', {
        method: 'POST',
        cookie,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          type: 'deck',
          instructions: 'Keep it to 3 slides for smoke test.',
        }),
      });

      if (genRes.status === 200) {
        const gen = await genRes.json();
        gen.data?.content?.includes('Slide')
          ? pass('Generate deck', `${gen.data.content.length} chars`)
          : pass('Generate deck', 'content returned');
      } else {
        const err = await genRes.text();
        fail('Generate deck', `HTTP ${genRes.status}: ${err.slice(0, 150)}`);
      }
    } else {
      console.log('⊘ Skipping deck generation — ANTHROPIC_API_KEY missing');
    }
  }

  // Delete test session
  if (sessionId) {
    const delRes = await fetchApp(`/api/chat/sessions/${sessionId}`, { method: 'DELETE', cookie });
    delRes.status === 200 ? pass('Delete chat session') : fail('Delete chat session', String(delRes.status));
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${'='.repeat(48)}`);
  console.log(`${passed}/${total} checks passed`);
  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  • ${f.name}${f.detail ? `: ${f.detail}` : ''}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
