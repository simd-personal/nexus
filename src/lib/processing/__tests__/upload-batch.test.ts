import { describe, expect, it } from 'vitest';
import {
  buildUploadBatchMetadata,
  getUploadBatchInfo,
  isLowSignalSummary,
  isMultiFileBatch,
} from '@/lib/processing/upload-batch';

describe('upload batch helpers', () => {
  it('detects multi-file batches from metadata', () => {
    expect(
      isMultiFileBatch({
        upload_batch_id: 'batch-1',
        upload_batch_total: 4,
      })
    ).toBe(true);
    expect(isMultiFileBatch({ upload_batch_id: 'batch-1', upload_batch_total: 1 })).toBe(false);
    expect(isMultiFileBatch({})).toBe(false);
  });

  it('builds batch metadata only for multi-file uploads', () => {
    expect(
      buildUploadBatchMetadata({ uploadBatchId: 'abc', uploadBatchTotal: 3 })
    ).toEqual({
      upload_batch_id: 'abc',
      upload_batch_total: 3,
    });
    expect(buildUploadBatchMetadata({ uploadBatchId: 'abc', uploadBatchTotal: 1 })).toEqual({});
  });

  it('parses batch info from file metadata', () => {
    expect(
      getUploadBatchInfo({
        upload_batch_id: 'abc',
        upload_batch_total: 5,
      })
    ).toEqual({ batchId: 'abc', batchTotal: 5 });
  });

  it('flags boilerplate summaries as low signal', () => {
    expect(
      isLowSignalSummary(
        'New project material has been added and indexed. Review the uploaded content for any follow-up needed.'
      )
    ).toBe(true);
    expect(
      isLowSignalSummary(
        'The invoice is missing a due date and client email, which may delay payment reconciliation for the Mercedes claim.'
      )
    ).toBe(false);
  });
});
