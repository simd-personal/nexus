'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Copy, Check, Download, Presentation, LayoutGrid, Maximize2, X,
} from 'lucide-react';
import { parseDeckForViewer } from '@/lib/ai/deck-format';
import type { SunnyChatArtifact } from '@/types/database';
import { cn } from '@/lib/utils';

function SlideCard({
  number,
  total,
  title,
  bullets,
  deckTitle,
  large = false,
}: {
  number: number;
  total: number;
  title: string;
  bullets: string[];
  deckTitle: string | null;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col w-full overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm',
        large ? 'aspect-[16/9]' : 'aspect-[16/9]'
      )}
    >
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
          {deckTitle ?? 'Presentation'}
        </span>
        <span className="text-[11px] font-medium text-gray-400">
          {number} / {total}
        </span>
      </div>

      <div className="px-6 pt-3">
        <h3 className={cn('font-bold text-gray-900', large ? 'text-2xl' : 'text-lg')}>{title}</h3>
        <div className="mt-1 h-1 w-12 rounded-full bg-amber-400" />
      </div>

      <ul className={cn('flex-1 space-y-2.5 overflow-y-auto px-6 py-4', large ? 'text-base' : 'text-sm')}>
        {bullets.map((bullet, i) => (
          <li key={i} className="flex gap-2.5 text-gray-700 leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
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
              <SlideCard
                number={s.number}
                total={slides.length}
                title={s.title}
                bullets={s.bullets}
                deckTitle={deck.title}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <SlideCard
            number={slide.number}
            total={slides.length}
            title={slide.title}
            bullets={slide.bullets}
            deckTitle={deck.title}
          />

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
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95 p-6 backdrop-blur">
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

            <div className="w-full max-w-4xl">
              <SlideCard
                number={slide.number}
                total={slides.length}
                title={slide.title}
                bullets={slide.bullets}
                deckTitle={deck.title}
                large
              />
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
