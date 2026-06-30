export function isDashboardIndexingActive(
  pendingBatches: unknown[],
  processingActive: boolean
): boolean {
  return pendingBatches.length > 0 || processingActive;
}
