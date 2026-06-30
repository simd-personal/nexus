'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  dismissProductTourPrompt,
  saveProductTourProgress,
} from '@/lib/actions/tour';
import {
  getAllTourSteps,
  getStepById,
  getStepCount,
  getStepIndex,
  getTourStepsForPart,
  resolveTourRoute,
  type TourStep,
} from '@/lib/tour/steps';
import type { ProductTourContext, ProductTourProfileState, TourStepId } from '@/lib/tour/state';
import { TourContinueBanner } from '@/components/tour/TourContinueBanner';
import { TourOverlay } from '@/components/tour/TourOverlay';
import { TourWelcomeModal } from '@/components/tour/TourWelcomeModal';

type TourRunMode = 'full' | 'part1' | 'part2';

type ProductTourApi = {
  startTour: (mode?: TourRunMode) => void;
  dismissWelcome: () => void;
  skipTour: () => void;
  isRunning: boolean;
};

const Ctx = createContext<ProductTourApi | null>(null);

export function useProductTour() {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error('useProductTour must be used within ProductTourProvider');
  }
  return value;
}

function waitForTourTarget(target: string, timeoutMs = 10_000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const selector = `[data-tour="${target}"]`;
    const started = Date.now();

    function check() {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) {
        resolve(el);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(null);
        return;
      }
      window.requestAnimationFrame(check);
    }

    check();
  });
}

function stepsForMode(mode: TourRunMode, ctx: ProductTourContext): TourStep[] {
  if (mode === 'part1') return getTourStepsForPart(1, ctx);
  if (mode === 'part2') return getTourStepsForPart(2, ctx);
  return getAllTourSteps(ctx);
}

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [state, setState] = useState<ProductTourProfileState | null>(null);
  const [context, setContext] = useState<ProductTourContext>({ hasProjects: false, projectId: null });
  const [showWelcome, setShowWelcome] = useState(false);
  const [showContinueBanner, setShowContinueBanner] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runMode, setRunMode] = useState<TourRunMode>('full');
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetReady, setTargetReady] = useState(false);

  const refreshBootstrap = useCallback(async () => {
    const res = await fetch('/api/me/tour', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      state: ProductTourProfileState;
      context: ProductTourContext;
      showWelcomePrompt: boolean;
      showContinueBanner: boolean;
    };
    setState(data.state);
    setContext(data.context);
    setShowWelcome(data.showWelcomePrompt);
    setShowContinueBanner(data.showContinueBanner);
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    void refreshBootstrap();
  }, [refreshBootstrap]);

  useEffect(() => {
    function onRestart() {
      void refreshBootstrap().then(() => {
        setShowWelcome(true);
      });
    }
    window.addEventListener('product-tour-restart', onRestart);
    return () => window.removeEventListener('product-tour-restart', onRestart);
  }, [refreshBootstrap]);

  const activeSteps = useMemo(() => stepsForMode(runMode, context), [runMode, context]);
  const activeStep = activeSteps[stepIndex] ?? null;

  const syncTarget = useCallback(async (step: TourStep | null) => {
    setTargetReady(false);
    setTargetRect(null);
    if (!step?.target) {
      setTargetReady(true);
      return;
    }
    const el = await waitForTourTarget(step.target);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTargetRect(el.getBoundingClientRect());
    }
    setTargetReady(true);
  }, []);

  const goToStep = useCallback(
    async (index: number, steps: TourStep[]) => {
      const step = steps[index];
      if (!step) return;
      const route = resolveTourRoute(step, context);
      if (pathname !== route) {
        router.push(route);
      }
      setStepIndex(index);
      await new Promise((r) => window.setTimeout(r, pathname === route ? 0 : 450));
      await syncTarget(step);
      void saveProductTourProgress({ stepId: step.id });
    },
    [context, pathname, router, syncTarget]
  );

  const startTour = useCallback(
    (mode: TourRunMode = 'full') => {
      const resolvedMode =
        mode === 'full' && !context.projectId ? ('part1' as TourRunMode) : mode;
      setRunMode(resolvedMode);
      setShowWelcome(false);
      setShowContinueBanner(false);
      setIsRunning(true);
      const steps = stepsForMode(resolvedMode, context);
      void goToStep(0, steps);
    },
    [context, goToStep]
  );

  const dismissWelcome = useCallback(async () => {
    setShowWelcome(false);
    await dismissProductTourPrompt();
    setState((prev) =>
      prev
        ? { ...prev, product_tour_prompt_dismissed_at: new Date().toISOString() }
        : prev
    );
  }, []);

  const finishTour = useCallback(
    async (part1Only = false) => {
      setIsRunning(false);
      setTargetRect(null);
      if (part1Only) {
        await saveProductTourProgress({
          stepId: 'part1-complete',
          part1Completed: true,
        });
        setState((prev) =>
          prev
            ? {
                ...prev,
                product_tour_part1_completed_at: new Date().toISOString(),
                product_tour_last_step: 'part1-complete',
              }
            : prev
        );
        if (context.hasProjects) {
          setShowContinueBanner(true);
        }
      } else {
        await saveProductTourProgress({
          stepId: 'finish',
          part1Completed: true,
          completed: true,
        });
        setState((prev) =>
          prev
            ? {
                ...prev,
                product_tour_part1_completed_at: prev.product_tour_part1_completed_at ?? new Date().toISOString(),
                product_tour_completed_at: new Date().toISOString(),
                product_tour_last_step: 'finish',
              }
            : prev
        );
        setShowContinueBanner(false);
      }
    },
    [context.hasProjects]
  );

  const skipTour = useCallback(async () => {
    setIsRunning(false);
    setTargetRect(null);
    await dismissProductTourPrompt();
    setShowWelcome(false);
    setState((prev) =>
      prev
        ? { ...prev, product_tour_prompt_dismissed_at: new Date().toISOString() }
        : prev
    );
  }, []);

  const nextStep = useCallback(async () => {
    const steps = activeSteps;
    const step = steps[stepIndex];
    if (!step) return;

    if (step.id === 'part1-complete' && runMode !== 'part2') {
      if (context.projectId && runMode === 'full') {
        setRunMode('full');
        const allSteps = getAllTourSteps(context);
        const nextIndex = allSteps.findIndex((s) => s.id === 'project-overview');
        if (nextIndex >= 0) {
          await saveProductTourProgress({ stepId: 'part1-complete', part1Completed: true });
          await goToStep(nextIndex, allSteps);
          return;
        }
      }
      await finishTour(true);
      return;
    }

    if (stepIndex >= steps.length - 1) {
      await finishTour(false);
      return;
    }

    await goToStep(stepIndex + 1, steps);
  }, [activeSteps, stepIndex, runMode, context, goToStep, finishTour]);

  const prevStep = useCallback(async () => {
    if (stepIndex <= 0) return;
    await goToStep(stepIndex - 1, activeSteps);
  }, [stepIndex, activeSteps, goToStep]);

  useEffect(() => {
    if (!isRunning || !activeStep?.target) return;
    function updateRect() {
      const el = document.querySelector(`[data-tour="${activeStep.target}"]`);
      if (el instanceof HTMLElement) {
        setTargetRect(el.getBoundingClientRect());
      }
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isRunning, activeStep, pathname]);

  const api = useMemo(
    () => ({
      startTour,
      dismissWelcome,
      skipTour,
      isRunning,
    }),
    [startTour, dismissWelcome, skipTour, isRunning]
  );

  const progressLabel =
    activeStep && bootstrapped
      ? `${stepIndex + 1} / ${activeSteps.length}`
      : undefined;

  return (
    <Ctx.Provider value={api}>
      {children}
      {bootstrapped && showWelcome && !isRunning && (
        <TourWelcomeModal
          onStart={() => startTour('full')}
          onDismiss={() => void dismissWelcome()}
        />
      )}
      {bootstrapped && showContinueBanner && !isRunning && !showWelcome && (
        <TourContinueBanner
          onContinue={() => startTour('part2')}
          onDismiss={() => setShowContinueBanner(false)}
        />
      )}
      {isRunning && activeStep && targetReady && (
        <TourOverlay
          step={activeStep}
          targetRect={targetRect}
          progressLabel={progressLabel}
          onNext={() => void nextStep()}
          onBack={() => void prevStep()}
          onSkip={() => void skipTour()}
          canGoBack={stepIndex > 0}
          isLast={stepIndex >= activeSteps.length - 1}
        />
      )}
    </Ctx.Provider>
  );
}

export function getTourProgressForStep(
  stepId: TourStepId,
  ctx: ProductTourContext,
  mode: TourRunMode
): { index: number; total: number } {
  const steps = stepsForMode(mode, ctx);
  const index = steps.findIndex((step) => step.id === stepId);
  return { index: Math.max(index, 0), total: steps.length };
}

export { getStepById, getStepCount, getStepIndex };
