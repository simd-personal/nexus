'use client';

import { useState } from 'react';
import { Briefcase, Building2, Check, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Audience = {
  id: string;
  tab: string;
  icon: LucideIcon;
  title: string;
  body: string;
  points: string[];
};

const AUDIENCES: Audience[] = [
  {
    id: 'solo',
    tab: 'Solo consultants',
    icon: UserRound,
    title: 'Your first hire, on client number one',
    body: 'Sunny reads every deck, email, and call so you walk into client work prepared — without hiring an analyst.',
    points: [
      'A brief for every project, refreshed as files land',
      'Catch contradictions before your client does',
      'Draft follow ups in your voice in seconds',
    ],
  },
  {
    id: 'fractional',
    tab: 'Fractional execs',
    icon: Briefcase,
    title: 'A chief-of-staff-level AI employee',
    body: 'Juggling five stakeholders across three companies? Sunny keeps the context straight so you never walk in cold.',
    points: [
      'Per-client memory that never forgets a thread',
      'Risk + decision tracking across engagements',
      'Ask "what changed this week?" and get cited answers',
    ],
  },
  {
    id: 'agency',
    tab: 'Agency leads',
    icon: Building2,
    title: 'Shared client brains for your whole team',
    body: 'Give every delivery lead an AI employee with the same context — before you need heavyweight enterprise software.',
    points: [
      'One source of truth per client project',
      'Onboard new team members in minutes, not weeks',
      'Spot at-risk accounts before they churn',
    ],
  },
];

export function AudienceTabs() {
  const [active, setActive] = useState(AUDIENCES[0].id);
  const current = AUDIENCES.find((a) => a.id === active) ?? AUDIENCES[0];

  return (
    <div className="aud-wrap">
      <div className="aud-tabs" role="tablist" aria-label="Who UpperDeck is for">
        {AUDIENCES.map((a) => {
          const on = a.id === active;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(a.id)}
              className={`aud-tab ${on ? 'aud-tab-on' : ''}`}
            >
              <a.icon className="h-4 w-4" strokeWidth={2} />
              {a.tab}
            </button>
          );
        })}
      </div>

      <div key={current.id} className="aud-panel" role="tabpanel">
        <div className="aud-panel-text">
          <h3 className="aud-panel-title">{current.title}</h3>
          <p className="aud-panel-body">{current.body}</p>
        </div>
        <ul className="aud-panel-points">
          {current.points.map((p) => (
            <li key={p}>
              <span className="aud-check">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
