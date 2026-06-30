import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('middleware config', () => {
  it('excludes API routes from middleware to preserve multipart uploads', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/middleware.ts'), 'utf8');
    expect(source).toContain('api/');
    expect(source).toMatch(/skip multipart upload\/replace paths/);
  });
});
