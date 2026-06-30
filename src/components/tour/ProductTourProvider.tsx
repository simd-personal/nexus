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
import { saveProductTourProgress } from '@/lib/actions/tour';
import {
  getActiveTourSteps,
  getStepById,
  getStepCount,
  getStepIndex,
  resolveTourRoute,
  type TourStep,
} from '@/lib/tour/steps';
import type { ProductTourContext, ProductTourProfileState, TourStepId } from '@/lib/tour/state';
import { TourOverlay } from '@/components/tour/TourOverlay';

type ProductTourApi = {
  startTour: () => void;
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

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [context, setContext] = useState<ProductTourContext>({ hasProjects: false, projectId: null });
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetReady, setTargetReady] = useState(false);

  const refreshBootstrap = useCallback(async () => {
    const res = await fetch('/api/me/tour', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      state: ProductTourProfileState;
      context: ProductTourContext;
    };
    setContext(data.context);
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    void refreshBootstrap();
  }, [refreshBootstrap]);

  const activeSteps = useMemo(() => getActiveTourSteps(context), [context]);
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

  const startTour = useCallback(() => {
    setIsRunning(true);
    const steps = getActiveTourSteps(context);
    void goToStep(0, steps);
  }, [context, goToStep]);

  const finishTour = useCallback(async () => {
    setIsRunning(false);
    setTargetRect(null);
    await saveProductTourProgress({
      stepId: 'finish',
      completed: true,
    });
  }, []);

  const skipTour = useCallback(async () => {
    setIsRunning(false);
    setTargetRect(null);
    await saveProductTourProgress({
      stepId: 'finish',
      completed: true,
    });
  }, []);

  const nextStep = useCallback(async () => {
    if (stepIndex >= activeSteps.length - 1) {
      await finishTour();
      return;
    }
    await goToStep(stepIndex + 1, activeSteps);
  }, [activeSteps, stepIndex, goToStep, finishTour]);

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
      skipTour,
      isRunning,
    }),
    [startTour, skipTour, isRunning]
  );

  const progressLabel =
    activeStep && bootstrapped ? `${stepIndex + 1} / ${activeSteps.length}` : undefined;

  return (
    <Ctx.Provider value={api}>
      {children}
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
  ctx: ProductTourContext
): { index: number; total: number } {
  const steps = getActiveTourSteps(ctx);
  const index = steps.findIndex((step) => step.id === stepId);
  return { index: Math.max(index, 0), total: steps.length };
}

export { getStepById, getStepCount, getStepIndex };
