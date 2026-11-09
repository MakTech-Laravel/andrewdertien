import { useEffect } from 'react';

function golfBall(color: string): string {
    return `/askupon/balls/golf-${color}.svg`;
}

/** Where the water meets each ball in the client's artwork: x, y and ripple width, as percentages. */
const sceneRipples = [
    { x: 30.3, y: 59, width: 25 },
    { x: 67, y: 55, width: 22 },
    { x: 50.2, y: 81, width: 26 },
    { x: 80.6, y: 75, width: 24 },
    { x: 15.4, y: 81, width: 22 },
];

/** The hero: the client's pond artwork, with the water and sun gently alive. */
export function PondHeroScene() {
    return (
        <div className="ln-stage">
            <img className="ln-stage-art" src="/askupon/scene-sunrise.jpg" alt="Colorful golf balls and marbles floating on a pond at sunrise" />
            <span className="ln-stage-sun" aria-hidden="true" />
            <span className="ln-stage-shimmer" aria-hidden="true" />
            {sceneRipples.map((ripple, index) => (
                <span
                    key={ripple.x}
                    className="ln-stage-ripple"
                    style={{ left: `${ripple.x}%`, top: `${ripple.y}%`, width: `${ripple.width}%`, animationDelay: `${index * -1.3}s` }}
                    aria-hidden="true"
                />
            ))}
        </div>
    );
}

const lawnBalls = [
    { color: 'white', side: 'left', x: 5, size: 66 },
    { color: 'gold', side: 'left', x: 12.5, size: 56 },
    { color: 'blue', side: 'left', x: 18.5, size: 76 },
    { color: 'purple', side: 'right', x: 18.5, size: 76 },
    { color: 'green', side: 'right', x: 12.5, size: 56 },
    { color: 'red', side: 'right', x: 5, size: 66 },
];

/** Golf balls resting on the grass either side of the call to action. */
export function LawnBalls() {
    return (
        <div className="ln-lawn" aria-hidden="true">
            {lawnBalls.map((ball) => (
                <img key={ball.color} src={golfBall(ball.color)} alt="" style={{ [ball.side]: `${ball.x}%`, width: ball.size, height: ball.size }} />
            ))}
        </div>
    );
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
