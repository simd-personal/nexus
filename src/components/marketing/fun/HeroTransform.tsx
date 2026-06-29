'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, FileText, Mail, Sparkles } from 'lucide-react';

const MESSY = `ok so on the call sarah said launch maybe slips to Q3?? budget review thing. but the march timeline plan still says Q2 launch. also someone needs to own the data migration nobody confirmed. follow up w/ finance before fri. they were kinda annoyed about the last invoice too lol`;

type BriefLine = { text: string; cite: string };

const BRIEF: BriefLine[] = [
  { text: 'Launch likely slipping to Q3 pending budget review', cite: 'Mar 12 call' },
  { text: 'Conflict: March strategy deck still shows a Q2 launch date', cite: 'Strategy deck p.4' },
  { text: 'Ownership gap: data migration has no confirmed owner', cite: 'Mar 12 call' },
  { text: 'Follow up with finance before Friday (invoice friction)', cite: 'Email thread' },
];

type Phase = 'typing' | 'thinking' | 'reveal' | 'hold';

export function HeroTransform() {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const [revealed, setRevealed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setTyped(MESSY);
      setPhase('reveal');
      setRevealed(BRIEF.length);
      return;
    }

    let active = true;
    const push = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (active) fn();
      }, ms);
      timers.current.push(t);
    };

    const run = () => {
      // reset
      setTyped('');
      setRevealed(0);
      setPhase('typing');

      // type the messy notes
      let i = 0;
      const typeNext = () => {
        if (!active) return;
        i += 2;
        setTyped(MESSY.slice(0, i));
        if (i < MESSY.length) {
          push(typeNext, 22);
        } else {
          push(() => setPhase('thinking'), 500);
          push(() => setPhase('reveal'), 1700);
          // reveal brief lines one by one
          BRIEF.forEach((_, idx) => {
            push(() => setRevealed(idx + 1), 1900 + idx * 320);
          });
          push(() => setPhase('hold'), 1900 + BRIEF.length * 320 + 400);
          push(run, 1900 + BRIEF.length * 320 + 3800);
        }
      };
      push(typeNext, 350);
    };

    run();

    return () => {
      active = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div className="hx-wrap" aria-hidden>
      <div className="hx-glow" />

      {/* Input: messy raw notes */}
      <div className="hx-card hx-input">
        <div className="hx-card-head">
          <span className="hx-chip hx-chip-mail">
            <Mail className="h-3.5 w-3.5" /> call notes
          </span>
        </div>
        <p className="hx-messy">
          {typed}
          {phase === 'typing' && <span className="hx-caret" />}
        </p>
      </div>

      {/* Sunny working */}
      <div className={`hx-bridge ${phase === 'thinking' ? 'hx-bridge-active' : ''}`}>
        <span className="hx-bridge-orb">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="hx-bridge-label">
          {phase === 'thinking' ? 'Sunny is reading…' : 'Sunny'}
        </span>
        <ArrowRight className="hx-bridge-arrow h-4 w-4" />
      </div>

      {/* Output: clean brief */}
      <div className={`hx-card hx-output ${phase === 'reveal' || phase === 'hold' ? 'hx-output-on' : ''}`}>
        <div className="hx-card-head">
          <span className="hx-chip hx-chip-brief">
            <FileText className="h-3.5 w-3.5" /> Client brief
          </span>
          <span className="hx-badge-live">auto-generated</span>
        </div>
        <ul className="hx-brief">
          {BRIEF.map((line, idx) => (
            <li
              key={line.text}
              className={`hx-brief-line ${idx < revealed ? 'hx-brief-line-in' : ''}`}
            >
              <span className="hx-tick" />
              <span className="hx-brief-text">{line.text}</span>
              <span className="hx-brief-cite">{line.cite}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
