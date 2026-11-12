import { useEffect } from 'react';

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
