import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';

/** Project ids in the selected portfolio, or null when scope is "all". */
export async function getProjectIdsForPortfolioScope(
  supabase: SupabaseClient,
  scope: DashboardPortfolioScope
): Promise<string[] | null> {
  if (scope === 'all') return null;

  const { data } = await supabase.from('projects').select('id').eq('portfolio', scope);
  return (data ?? []).map((row) => row.id);
}
