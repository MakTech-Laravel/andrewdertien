import { useEffect, useRef, useState } from 'react';
import type { PondScene } from '@/components/pond/three/pond-scene';

/**
 * Animation is a bonus: visitors who ask for less motion, are saving data, or have
 * no WebGL keep the client's static artwork.
 */
function canAnimate(): boolean {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    if (connection?.saveData) {
        return false;
    }

    return !!document.createElement('canvas').getContext('webgl2');
}

/** The hero scene: live water and golf balls in front of the client's sunrise. */
export function PondHeroScene() {
    const stage = useRef<HTMLDivElement>(null);
    const scene = useRef<PondScene | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [hasTossed, setHasTossed] = useState(false);

    useEffect(() => {
        const container = stage.current;

        if (!container || !canAnimate()) {
            return;
        }

        let isCancelled = false;

        import('@/components/pond/three/pond-scene')
            .then(({ mountPondScene }) => {
                if (isCancelled) {
                    return;
                }

                scene.current = mountPondScene(container, {
                    onReady: () => setIsLive(true),
                    onFailure: () => setIsLive(false),
                    onToss: () => setHasTossed(true),
                });
            })
            .catch(() => setIsLive(false));

        return () => {
            isCancelled = true;
            scene.current?.dispose();
            scene.current = null;
        };
    }, []);

    return (
        <div className={`ln-stage ${isLive ? 'is-live' : ''}`}>
            <img className="ln-stage-art" src="/askupon/scene-sunrise.jpg" alt="Colorful golf balls and marbles floating on a pond at sunrise" />
            <img className="ln-stage-sky" src="/askupon/scene-sky.jpg" alt="" aria-hidden="true" />
            <div ref={stage} className="ln-stage-canvas" aria-hidden="true" />
            {isLive && (
                <>
                    <p className={`ln-stage-hint ${hasTossed ? 'is-done' : ''}`} aria-hidden="true">
                        Tap the water to toss a ball
                    </p>
                    <button type="button" className="ln-stage-toss" onClick={() => scene.current?.toss()}>
                        Toss a ball in the pond
                    </button>
                </>
            )}
        </div>
    );
}

/** Golf balls drifting behind a call to action; loads as it nears the screen. */
export function FloatingBallsBackdrop() {
    const stage = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = stage.current;

        if (!container || !canAnimate()) {
            return;
        }

        let isCancelled = false;
        let dispose: (() => void) | undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    return;
                }

                observer.disconnect();
                import('@/components/pond/three/floating-balls')
                    .then(({ mountFloatingBalls }) => {
                        if (!isCancelled) {
                            dispose = mountFloatingBalls(container, () => {
                                container.style.display = 'none';
                            }).dispose;
                        }
                    })
                    .catch(() => undefined);
            },
            { rootMargin: '300px' },
        );

        observer.observe(container);

        return () => {
            isCancelled = true;
            observer.disconnect();
            dispose?.();
        };
    }, []);

    return <div ref={stage} className="ln-cta-balls" aria-hidden="true" />;
}

/** Gently brings sections into view as they scroll in, once each. */
export function useScrollReveal(selector: string): void {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        observer.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
        );

        for (const element of elements) {
            element.classList.add('ln-reveal');
            observer.observe(element);
        }

        return () => observer.disconnect();
    }, [selector]);
}
