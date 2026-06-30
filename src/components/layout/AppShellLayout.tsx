import { getAccountSummary } from '@/lib/account/summary';
import { AppShell } from '@/components/layout/AppShell';

export async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const account = await getAccountSummary();
  return <AppShell account={account}>{children}</AppShell>;
}
