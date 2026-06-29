import Link from 'next/link';
import {
  Check,
  FileText,
  Layers,
  MessageSquare,
  Radar,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Product',
  description:
    'Deliver more with AI employees. Hire Sunny for client work. Ingest meetings and files, get briefs, decks, and follow ups with citations. Latest GPT and Claude included.',
  path: '/product',
  keywords: [
    'AI employees',
    'AI employee for consultants',
    'AI executive briefs',
    'client context management',
  ],
});

export default function ProductPage() {
  return (
    <MarketingPageLayout
      eyebrow="Product"
      title="An AI employee for every client project"
      description={`UpperDeck is where you onboard ${AI_EMPLOYEE_NAME}, an AI employee who reads meetings, emails, decks, PDFs, and notes in each client project, then surfaces what matters before your next call. And ${AI_EMPLOYEE_NAME} keeps getting more capable as we ship new features.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <h2 className="marketing-section-title">How your AI employee works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Upload,
                step: '01',
                title: 'Ingest',
                body: 'Upload files or paste content. PDFs, DOCX, decks, audio, transcripts, and email threads all land in the right client project.',
              },
              {
                icon: Sparkles,
                step: '02',
                title: 'Understand',
                body: `${AI_EMPLOYEE_NAME} reads everything and extracts briefs, risks, contradictions, timeline shifts, and open follow ups.`,
              },
              {
                icon: Zap,
                step: '03',
                title: 'Act',
                body: 'Ask questions, generate decks, draft emails, and review critical items with citations back to source material.',
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="marketing-feature-card">
                <div className="flex items-center justify-between">
                  <div className="marketing-feature-icon">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-sm font-medium text-[var(--ud-cloud)]">{step}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--ud-graphite)]">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ud-slate)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <h2 className="marketing-section-title">Built for client operators</h2>
          <p className="marketing-section-body mt-4 max-w-2xl">
            Whether you run one engagement or twenty, your AI employee keeps context out of inboxes
            and slide decks and puts it where you can use it. New integrations and workflows land
            regularly so {AI_EMPLOYEE_NAME} does more for you over time.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { icon: FileText, label: 'Executive briefs on demand' },
              { icon: Radar, label: 'Critical item detection' },
              { icon: MessageSquare, label: `Chat with ${AI_EMPLOYEE_NAME} across projects` },
              { icon: Layers, label: 'Deck and playbook generation' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="marketing-pill-card">
                <Icon className="h-4 w-4 text-[var(--brand-accent)]" strokeWidth={1.75} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="marketing-section-title">An AI employee that cites your sources</h2>
            <p className="marketing-section-body mt-4">
              {AI_EMPLOYEE_NAME} is not a blank chat window. Your AI employee answers from uploaded
              sources like meeting transcripts, decks, emails, and notes, with citations so you can
              verify before you share with a client.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Semantic search across all project files',
                'Timeline and follow up tracking',
                'Audio transcription and PDF processing',
                'Organization tenants with admin controls',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="marketing-seo-callout">
            <p className="text-sm font-medium text-[var(--ud-graphite)]">Explore more</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/client-intelligence" className="marketing-inline-link">
                  What is client intelligence? →
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="marketing-inline-link">
                  Integrations roadmap →
                </Link>
              </li>
              <li>
                <Link href="/for-consultants" className="marketing-inline-link">
                  Built for consultants →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
