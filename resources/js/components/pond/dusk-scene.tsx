/** Towers of the skyline: x, width, height. The tall one with the rounded top is the landmark. */
const towers = [
    { x: 700, w: 46, h: 70 },
    { x: 752, w: 38, h: 110 },
    { x: 796, w: 52, h: 84 },
    { x: 856, w: 34, h: 140 },
    { x: 896, w: 60, h: 96 },
    { x: 962, w: 44, h: 128 },
    { x: 1012, w: 40, h: 74 },
    { x: 1138, w: 48, h: 108 },
    { x: 1192, w: 56, h: 82 },
    { x: 1254, w: 40, h: 126 },
    { x: 1300, w: 54, h: 90 },
    { x: 1360, w: 46, h: 112 },
    { x: 1410, w: 60, h: 76 },
];

const horizon = 372;

/** Deterministic lit windows, so the server and browser always draw the same skyline. */
function windowsFor(tower: { x: number; w: number; h: number }, seed: number) {
    const lit: { x: number; y: number }[] = [];

    for (let row = 0; row < Math.floor(tower.h / 14); row++) {
        for (let column = 0; column < Math.floor(tower.w / 12); column++) {
            if ((row * 7 + column * 13 + seed * 5) % 3 !== 0) {
                lit.push({ x: tower.x + 5 + column * 12, y: horizon - tower.h + 8 + row * 14 });
            }
        }
    }

    return lit;
}

function Skyline({ flipped = false }: { flipped?: boolean }) {
    return (
        <g transform={flipped ? `translate(0 ${horizon * 2}) scale(1 -1)` : undefined}>
            {towers.map((tower) => (
                <rect key={tower.x} x={tower.x} y={horizon - tower.h} width={tower.w} height={tower.h} fill="#1b1550" />
            ))}
            <path d="M1052 372V190c0-34 14-62 32-84 18 22 32 50 32 84v182z" fill="#1b1550" />
            <path d="M1084 106v-26" stroke="#1b1550" strokeWidth="3" />
            {!flipped &&
                towers.flatMap((tower, index) =>
                    windowsFor(tower, index).map((lit) => <rect key={`${tower.x}-${lit.x}-${lit.y}`} x={lit.x} y={lit.y} width="5" height="7" rx="1" fill="#ffd36e" opacity=".85" />),
                )}
        </g>
    );
}

/** The hero artwork: a pond at dusk with the city across the water and a golf ball resting on the ripples. */
export function DuskPondScene() {
    return (
        <svg className="hm-scene" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="dusk-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1a1670" />
                    <stop offset=".38" stopColor="#4a2fa6" />
                    <stop offset=".72" stopColor="#d04c9c" />
                    <stop offset="1" stopColor="#ffa35c" />
                </linearGradient>
                <linearGradient id="dusk-water" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#7a3fa8" />
                    <stop offset=".45" stopColor="#3b2a8f" />
                    <stop offset="1" stopColor="#150f5c" />
                </linearGradient>
                <radialGradient id="dusk-glow" cx=".5" cy=".5" r=".5">
                    <stop offset="0" stopColor="#ffd98a" stopOpacity=".95" />
                    <stop offset=".5" stopColor="#ff9a6a" stopOpacity=".35" />
                    <stop offset="1" stopColor="#ff9a6a" stopOpacity="0" />
                </radialGradient>
                <filter id="dusk-blur" x="-5%" y="-5%" width="110%" height="110%">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
            </defs>

            <rect width="1440" height={horizon} fill="url(#dusk-sky)" />
            <ellipse cx="900" cy={horizon} rx="520" ry="190" fill="url(#dusk-glow)" />
            <g fill="#ffffff" opacity=".7">
                <circle cx="120" cy="60" r="1.6" />
                <circle cx="310" cy="110" r="1.2" />
                <circle cx="520" cy="46" r="1.5" />
                <circle cx="700" cy="90" r="1.1" />
                <circle cx="880" cy="40" r="1.4" />
                <circle cx="1240" cy="70" r="1.3" />
            </g>

            <path d="M0 372c60-26 110-30 160-12 40-24 96-28 140-6 30-10 60-6 90 18H0z" fill="#171150" />
            <path d="M1410 372c20-34 36-52 60-60v60z" fill="#171150" />
            <Skyline />

            <rect y={horizon} width="1440" height={640 - horizon} fill="url(#dusk-water)" />
            <g opacity=".3" filter="url(#dusk-blur)">
                <Skyline flipped />
            </g>
            <g stroke="#ffb36b" strokeLinecap="round" opacity=".5">
                <path d="M860 396h120M820 414h220M880 434h160M840 456h200" strokeWidth="2" />
            </g>

            <g className="hm-ripples" fill="none" stroke="#bfe9ff" strokeWidth="2">
                <ellipse className="hm-ripple hm-ripple-a" cx="900" cy="500" rx="110" ry="22" />
                <ellipse className="hm-ripple hm-ripple-b" cx="900" cy="500" rx="70" ry="14" />
                <ellipse className="hm-ripple hm-ripple-c" cx="900" cy="500" rx="150" ry="30" />
            </g>
            <ellipse cx="900" cy="508" rx="46" ry="9" fill="#150f5c" opacity=".55" />
            <image className="hm-scene-ball" href="/askupon/balls/golf-white.svg" x="858" y="440" width="84" height="84" />

            <g fill="#10104a">
                <path d="M0 640V560c14-38 22-70 26-110 8 40 6 74 16 110 6-30 14-52 26-72 0 28 4 48 4 72z" />
                <path d="M96 640c2-34 10-66 22-92 2 34 0 62 8 92z" />
                <path d="M1330 640c-2-40-12-72-24-100-2 38 2 70-8 100z" />
                <path d="M1390 640V580c10-26 20-46 28-70 6 28 4 46 22 76v54z" />
            </g>
            <g fill="#a85bd8" opacity=".9">
                <circle cx="46" cy="520" r="7" />
                <circle cx="62" cy="510" r="6" />
                <circle cx="28" cy="534" r="6" />
            </g>
        </svg>
    );
}

/** The Friendswood, Texas road sign from the client's mockup, drawn so it stays crisp at any size. */
export function FriendswoodSign() {
    return (
        <svg className="hm-sign" viewBox="0 0 360 200" role="img" aria-label="Friendswood, Texas road sign">
            <defs>
                <linearGradient id="sign-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffd9b0" />
                    <stop offset=".6" stopColor="#f5b0c6" />
                    <stop offset="1" stopColor="#b9a4e6" />
                </linearGradient>
            </defs>
            <rect width="360" height="200" fill="url(#sign-sky)" />
            <ellipse cx="300" cy="130" rx="120" ry="60" fill="#ffe7b8" opacity=".55" />
            <rect x="70" y="120" width="8" height="70" fill="#3b4a44" />
            <rect x="196" y="120" width="8" height="70" fill="#3b4a44" />
            <g transform="rotate(-4 140 85)">
                <rect x="20" y="40" width="230" height="86" rx="8" fill="#0f5a46" stroke="#fff" strokeWidth="5" />
                <text x="135" y="72" textAnchor="middle" fill="#fff" fontFamily="Georgia, serif" fontSize="21" fontWeight="700" letterSpacing="1">
                    FRIENDSWOOD
                </text>
                <line x1="46" y1="92" x2="88" y2="92" stroke="#fff" strokeWidth="2" />
                <text x="135" y="106" textAnchor="middle" fill="#fff" fontFamily="Georgia, serif" fontSize="18" letterSpacing="3">
                    ★ TEXAS ★
                </text>
                <line x1="182" y1="92" x2="224" y2="92" stroke="#fff" strokeWidth="2" />
            </g>
            <path d="M0 200V176c20-18 30-26 44-30 4 18 8 34 14 54zM250 200c4-26 10-44 20-56 6 20 8 38 20 56zM330 200c-2-24 2-40 8-56 10 18 14 36 22 56z" fill="#3a5c2c" />
        </svg>
    );
}
