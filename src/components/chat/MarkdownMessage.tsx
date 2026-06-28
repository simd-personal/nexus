'use client';

import { memo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') ?? '';

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-100"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-[13px] leading-relaxed text-gray-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-lg font-bold text-gray-900 first:mt-0 dark:text-gray-100">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-base font-bold text-gray-900 first:mt-0 dark:text-gray-100">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-semibold text-gray-900 first:mt-0 dark:text-gray-100">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 ml-1 space-y-1.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1.5 last:mb-0">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2 leading-relaxed [ol_&]:list-item [ol_&]:gap-0">
      <span className="mt-2 hidden h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 [ul_&]:block" />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline underline-offset-2 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-amber-300 pl-3 text-gray-600 italic dark:border-amber-700 dark:text-gray-400">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-gray-200 dark:border-[var(--ud-cloud)]" />,
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-gray-200/70 px-1.5 py-0.5 text-[0.85em] font-mono text-gray-800 dark:bg-[var(--ud-cloud)] dark:text-gray-200" {...props}>
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100 dark:bg-[var(--ud-cloud)]">{children}</thead>,
  th: ({ children }) => <th className="border border-gray-200 px-2.5 py-1.5 text-left font-semibold text-gray-700 dark:border-[var(--ud-cloud)] dark:text-gray-300">{children}</th>,
  td: ({ children }) => <td className="border border-gray-200 px-2.5 py-1.5 text-gray-700 align-top dark:border-[var(--ud-cloud)] dark:text-gray-300">{children}</td>,
};

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn('text-sm text-gray-800 dark:text-gray-200', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
