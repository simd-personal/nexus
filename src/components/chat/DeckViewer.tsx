'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Copy, Check, Download, Presentation, LayoutGrid, Maximize2, X,
} from 'lucide-react';
import { parseDeckForViewer, type DeckViewSlide } from '@/lib/ai/deck-format';
import type { SunnyChatArtifact } from '@/types/database';
import { cn } from '@/lib/utils';

function SlideChrome({
  number,
  total,
  deckTitle,
  dark = false,
}: {
  number: number;
  total: number;
  deckTitle: string | null;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-5">
      <span
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.2em]',
          dark ? 'text-amber-300/90' : 'text-amber-600'
        )}
      >
        {deckTitle ?? 'Presentation'}
      </span>
      <span className={cn('text-[11px] font-medium', dark ? 'text-slate-400' : 'text-gray-400')}>
        {number} / {total}
      </span>
    </div>
  );
}

function HeroSlide({
  slide,
  total,
  deckTitle,
  subtitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  subtitle: string | null;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col overflow-hidden rounded-xl aspect-[16/9]',
        'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl'
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} dark />

      <div className="relative flex flex-1 flex-col justify-center px-8 pb-8">
        {subtitle && slide.number === 1 && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-amber-300/80">
            {subtitle}
          </p>
        )}
        <h3 className={cn('font-semibold tracking-tight text-white', large ? 'text-3xl' : 'text-xl')}>
          {slide.title}
        </h3>
        {slide.highlight && (
          <p
            className={cn(
              'mt-4 max-w-3xl font-medium leading-snug text-amber-200',
              large ? 'text-2xl' : 'text-lg'
            )}
          >
            {slide.highlight}
          </p>
        )}
        {slide.bullets.length > 0 && (
          <ul className={cn('mt-5 space-y-2', large ? 'text-base' : 'text-sm')}>
            {slide.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3 text-slate-200">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MetricsSlide({
  slide,
  total,
  deckTitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  large?: boolean;
}) {
  const metrics = slide.metrics ?? [];
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 aspect-[16/9] shadow-sm">
      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} />
      <div className="px-6 pt-2">
        <h3 className={cn('font-bold text-slate-900', large ? 'text-2xl' : 'text-lg')}>{slide.title}</h3>
        <div className="mt-1 h-1 w-14 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
      </div>
      <div className={cn('grid flex-1 gap-3 px-6 py-5', metrics.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
        {metrics.map((metric, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <p className={cn('font-bold tracking-tight text-slate-900', large ? 'text-3xl' : 'text-2xl')}>
              {metric.value}
            </p>
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
              {metric.note && <p className="mt-1 text-xs text-slate-500">{metric.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardsSlide({
  slide,
  total,
  deckTitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  large?: boolean;
}) {
  const cards = slide.cards ?? [];
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white aspect-[16/9] shadow-sm">
      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} />
      <div className="px-6 pt-2">
        <h3 className={cn('font-bold text-slate-900', large ? 'text-2xl' : 'text-lg')}>{slide.title}</h3>
        <div className="mt-1 h-1 w-14 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
          >
            <div className="mb-3 h-1 w-8 rounded-full bg-amber-500" />
            <p className={cn('font-semibold text-slate-900', large ? 'text-base' : 'text-sm')}>{card.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
            {card.owner && (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-amber-700">
                Owner: {card.owner}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteSlide({
  slide,
  total,
  deckTitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  large?: boolean;
}) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 aspect-[16/9] border border-amber-100 shadow-sm">
      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} />
      <div className="flex flex-1 flex-col justify-center px-10 pb-8">
        <p className="text-5xl font-serif leading-none text-amber-300/80">&ldquo;</p>
        <p className={cn('-mt-2 font-medium leading-relaxed text-slate-800', large ? 'text-2xl' : 'text-lg')}>
          {slide.quote?.text}
        </p>
        {slide.quote?.attribution && (
          <p className="mt-4 text-sm font-semibold text-amber-800">{slide.quote.attribution}</p>
        )}
      </div>
    </div>
  );
}

function SectionSlide({
  slide,
  total,
  deckTitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  large?: boolean;
}) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl bg-gradient-to-r from-slate-950 to-slate-800 aspect-[16/9] shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.15),transparent_50%)]" />
      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} dark />
      <div className="relative flex flex-1 flex-col justify-center px-10 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">Section</p>
        <h3 className={cn('mt-3 font-semibold text-white', large ? 'text-4xl' : 'text-2xl')}>
          {slide.sectionLabel ?? slide.title}
        </h3>
      </div>
    </div>
  );
}

function TwoColumnSlide({
  slide,
  total,
  deckTitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  large?: boolean;
}) {
  const left = slide.columns?.left ?? [];
  const right = slide.columns?.right ?? [];
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white aspect-[16/9] shadow-sm">
      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} />
      <div className="px-6 pt-2">
        <h3 className={cn('font-bold text-slate-900', large ? 'text-2xl' : 'text-lg')}>{slide.title}</h3>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-4 px-6 py-4">
        {[left, right].map((col, idx) => (
          <div key={idx} className="rounded-xl bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {idx === 0 ? 'Current State' : 'Target State'}
            </p>
            <ul className={cn('space-y-2', large ? 'text-base' : 'text-sm')}>
              {col.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulletsSlide({
  slide,
  total,
  deckTitle,
  large,
}: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  large?: boolean;
}) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 aspect-[16/9] shadow-sm">
      <SlideChrome number={slide.number} total={total} deckTitle={deckTitle} />
      <div className="px-6 pt-2">
        <h3 className={cn('font-bold text-slate-900', large ? 'text-2xl' : 'text-lg')}>{slide.title}</h3>
        <div className="mt-1 h-1 w-14 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
      </div>
      {slide.highlight && (
        <p className="mx-6 mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
          {slide.highlight}
        </p>
      )}
      <ul className={cn('flex-1 space-y-3 overflow-y-auto px-6 py-4', large ? 'text-base' : 'text-sm')}>
        {slide.bullets.map((bullet, i) => (
          <li key={i} className="flex gap-3 text-slate-700 leading-relaxed">
            <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
              {i + 1}
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RenderSlide(props: {
  slide: DeckViewSlide;
  total: number;
  deckTitle: string | null;
  subtitle: string | null;
  large?: boolean;
}) {
  const { slide } = props;
  switch (slide.layout) {
    case 'hero':
      return <HeroSlide {...props} />;
    case 'metrics':
      return <MetricsSlide {...props} />;
    case 'cards':
      return <CardsSlide {...props} />;
    case 'quote':
      return <QuoteSlide {...props} />;
    case 'section':
      return <SectionSlide {...props} />;
    case 'two-column':
      return <TwoColumnSlide {...props} />;
    default:
      return <BulletsSlide {...props} />;
  }
}

export function DeckViewer({ artifact }: { artifact: SunnyChatArtifact }) {
  const deck = useMemo(() => parseDeckForViewer(artifact.content), [artifact.content]);
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [gridView, setGridView] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const slides = deck.slides;
  if (slides.length === 0) return null;

  const safeIndex = Math.min(current, slides.length - 1);
  const slide = slides[safeIndex];

  const go = (dir: number) =>
    setCurrent((c) => Math.max(0, Math.min(slides.length - 1, c + dir)));

  const slug = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function copy() {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'presentation-deck'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const slideProps = {
    slide,
    total: slides.length,
    deckTitle: deck.title,
    subtitle: deck.subtitle,
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setGridView((g) => !g)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        title={gridView ? 'Slide view' : 'Grid view'}
      >
        {gridView ? <Presentation className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
        {gridView ? 'Slides' : 'Grid'}
      </button>
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        title="Present fullscreen"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Present
      </button>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={download}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </button>
    </div>
  );

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-gray-700">
            {deck.title ?? artifact.title}
          </span>
          <span className="text-[11px] text-gray-400">· {slides.length} slides</span>
        </div>
        {toolbar}
      </div>

      {gridView ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {slides.map((s, i) => (
            <button
              key={s.number}
              type="button"
              onClick={() => {
                setCurrent(i);
                setGridView(false);
              }}
              className="text-left transition-transform hover:scale-[1.01]"
            >
              <RenderSlide {...slideProps} slide={s} />
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <RenderSlide {...slideProps} />

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={safeIndex === 0}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            <div className="flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${s.number}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === safeIndex ? 'w-5 bg-amber-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              disabled={safeIndex === slides.length - 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 p-6 backdrop-blur">
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-medium">{deck.title ?? artifact.title}</span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Close presentation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={safeIndex === 0}
              className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="w-full max-w-5xl">
              <RenderSlide {...slideProps} large />
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              disabled={safeIndex === slides.length - 1}
              className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center text-xs text-white/60">
            Slide {slide.number} of {slides.length}
          </div>
        </div>
      )}
    </div>
  );
}
