import { Check, Clock } from 'lucide-react';
import {
  LATEST_MODELS_PRICING_DISCLAIMER,
  resolvePricingFeature,
  type PricingFeature,
} from '@/lib/marketing/model-lineup';

export function PricingFeatureList({ features }: { features: PricingFeature[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {features.map((feature, index) => {
        const resolved = resolvePricingFeature(feature);
        return (
          <li
            key={`${resolved.text}-${index}`}
            className="flex items-start gap-2.5 marketing-text text-sm"
          >
            {resolved.comingSoon ? (
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ud-graphite)]/40" strokeWidth={2.5} />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
            )}
            <span>
              {resolved.text}
              {resolved.comingSoon && (
                <span className="ml-2 inline-flex items-center rounded-full bg-[var(--ud-graphite)]/8 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-[var(--ud-graphite)]/60">
                  Soon
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function PricingModelsDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed marketing-text-muted ${className}`}>
      {LATEST_MODELS_PRICING_DISCLAIMER}
    </p>
  );
}
