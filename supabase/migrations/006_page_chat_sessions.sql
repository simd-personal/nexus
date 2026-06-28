-- Allow saved chat sessions on Sunny Brief and Playbook pages

ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_session_type_check;

ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_session_type_check
  CHECK (session_type IN ('project', 'search', 'brief', 'playbook'));
