import { Check } from 'lucide-react';
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
            key={`${String(feature)}-${index}`}
            className={`flex items-start gap-2.5 marketing-text ${
              resolved.emphasis === 'models'
                ? 'marketing-pricing-feature-models text-sm'
                : 'text-sm'
            }`}
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
            {resolved.text}
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
