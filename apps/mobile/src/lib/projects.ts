import { splitProjectsByPortfolio as splitProjectsByPortfolioShared } from '@upperdeck/shared/chat-scope';
import type { ProjectWithStats } from '@/lib/types';

export function splitProjectsByPortfolio(projects: ProjectWithStats[]) {
  return splitProjectsByPortfolioShared(projects);
}

export function portfolioLabel(portfolio: ProjectWithStats['portfolio']): string {
  return portfolio === 'personal' ? 'Personal' : 'Work';
}
