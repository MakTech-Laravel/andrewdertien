type PondLandscapeProps = {
    className?: string;
    mode?: 'hero' | 'shore';
};

const balls = [
    { src: '/quantum/images/ball-100.png', className: 'pl-ball pl-ball-1', ripple: 'pl-ripple-purple' },
    { src: '/quantum/images/ball-10.png', className: 'pl-ball pl-ball-2', ripple: 'pl-ripple-blue' },
    { src: '/quantum/images/ball-50.png', className: 'pl-ball pl-ball-3', ripple: 'pl-ripple-orange' },
    { src: '/quantum/images/ball-20.png', className: 'pl-ball pl-ball-4', ripple: 'pl-ripple-green' },
    { src: '/quantum/images/ball-5.png', className: 'pl-ball pl-ball-5', ripple: 'pl-ripple-mint' },
    { src: '/quantum/images/ball-500.png', className: 'pl-ball pl-ball-6', ripple: 'pl-ripple-pink' },
];

function Tree({ x, scale = 1 }: { x: number; scale?: number }) {
    const h = 48 * scale;
    const w = 22 * scale;

    return (
        <g transform={`translate(${x} ${210 - h})`}>
            <rect x={w * 0.42} y={h * 0.55} width={w * 0.16} height={h * 0.45} fill="#041526" />
            <ellipse cx={w * 0.5} cy={h * 0.38} rx={w * 0.55} ry={h * 0.42} fill="#061c2e" />
            <ellipse cx={w * 0.35} cy={h * 0.48} rx={w * 0.38} ry={h * 0.3} fill="#0a2740" />
            <ellipse cx={w * 0.65} cy={h * 0.46} rx={w * 0.34} ry={h * 0.28} fill="#082238" />
        </g>
    );
}

export function PondLandscape({ className = '', mode = 'hero' }: PondLandscapeProps) {
    const viewBox = mode === 'shore' ? '0 100 900 320' : '0 0 900 420';

    return (
        <div className={`pond-landscape pond-landscape-${mode} ${className}`} aria-hidden="true">
            <svg className="pond-landscape-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="plSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0b4f84" />
                        <stop offset="48%" stopColor="#083560" />
                        <stop offset="100%" stopColor="#062744" />
                    </linearGradient>
                    <linearGradient id="plWater" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1c75b8" />
                        <stop offset="40%" stopColor="#0e568a" />
                        <stop offset="100%" stopColor="#041c33" />
                    </linearGradient>
                    <radialGradient id="plSunGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fff8c8" />
                        <stop offset="40%" stopColor="#ffe27a" />
                        <stop offset="100%" stopColor="#f0a800" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="plGrass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffe27a" />
                        <stop offset="100%" stopColor="#d4a017" />
                    </linearGradient>
                </defs>

                <rect width="900" height="420" fill="url(#plSky)" />

                {/* Soft night haze */}
                <ellipse cx="450" cy="120" rx="280" ry="70" fill="#1a6cab" opacity="0.18" />

                {/* Sun rays */}
                <g opacity="0.4" stroke="#ffe27a" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="450" y1="88" x2="450" y2="18" />
                    <line x1="450" y1="95" x2="520" y2="38" />
                    <line x1="450" y1="95" x2="380" y2="38" />
                    <line x1="450" y1="100" x2="555" y2="72" />
                    <line x1="450" y1="100" x2="345" y2="72" />
                    <line x1="450" y1="112" x2="540" y2="130" />
                    <line x1="450" y1="112" x2="360" y2="130" />
                </g>
                <circle cx="450" cy="118" r="62" fill="url(#plSunGlow)" />
                <circle cx="450" cy="118" r="36" fill="#ffe27a" />
                <circle cx="450" cy="118" r="28" fill="#fff1a0" />

                {/* Far tree line / shore silhouette */}
                <path
                    fill="#041526"
                    d="M0 205 C35 188 55 175 90 190 C120 160 155 150 195 175 C230 155 265 145 305 168 C345 148 385 155 430 172 C475 152 520 145 565 168 C610 150 655 155 700 172 C745 155 790 160 835 178 C870 168 890 180 900 188 L900 230 L0 230 Z"
                />

                <Tree x={28} scale={1.15} />
                <Tree x={78} scale={0.9} />
                <Tree x={130} scale={1.25} />
                <Tree x={195} scale={0.85} />
                <Tree x={250} scale={1.1} />
                <Tree x={620} scale={1.05} />
                <Tree x={680} scale={1.3} />
                <Tree x={745} scale={0.95} />
                <Tree x={800} scale={1.2} />
                <Tree x={855} scale={0.88} />

                {/* Near shore bank */}
                <path
                    fill="#0a2b45"
                    d="M0 218 C70 205 130 198 190 212 C270 195 340 200 420 214 C510 198 590 195 670 210 C760 195 840 205 900 215 L900 248 L0 248 Z"
                />

                {/* Pond water body — clear oval so it reads as a pond */}
                <ellipse cx="450" cy="318" rx="470" ry="138" fill="url(#plWater)" />
                <ellipse cx="450" cy="300" rx="430" ry="100" fill="#1b6fa8" opacity="0.28" />

                {/* Rectangular sun reflection (client mockup style) */}
                <rect x="422" y="248" width="56" height="78" rx="4" fill="#ffe27a" opacity="0.42" />
                <rect x="430" y="255" width="40" height="58" rx="3" fill="#fff1a0" opacity="0.35" />
                <ellipse cx="450" cy="275" rx="48" ry="10" fill="#ffe27a" opacity="0.3" />

                {/* Strong horizontal ripple lines */}
                <g fill="none" stroke="#9ad4ff" strokeLinecap="round">
                    <path d="M70 262 Q225 248 370 262 Q520 276 670 258 Q790 248 860 264" strokeWidth="2" strokeOpacity="0.55" />
                    <path d="M50 288 Q210 272 380 288 Q545 304 710 286 Q810 276 880 292" strokeWidth="2.2" strokeOpacity="0.5" />
                    <path d="M80 314 Q250 300 420 316 Q590 332 760 312 Q840 304 885 320" strokeWidth="2" strokeOpacity="0.45" />
                    <path d="M110 340 Q280 326 450 342 Q620 358 790 338" strokeWidth="1.8" strokeOpacity="0.35" />
                    <path d="M150 366 Q300 354 470 368 Q640 382 780 360" strokeWidth="1.5" strokeOpacity="0.25" />
                </g>

                {/* Left dark reeds / cattails */}
                <g>
                    <path d="M58 230 L66 360 L50 360 Z" fill="#061c2e" />
                    <path d="M82 220 L88 365 L74 365 Z" fill="#0a2b45" />
                    <path d="M105 235 L112 358 L96 358 Z" fill="#061c2e" />
                    <path d="M128 228 L134 362 L120 362 Z" fill="#0a2b45" />
                    <ellipse cx="62" cy="222" rx="7" ry="15" fill="#1a3d55" />
                    <ellipse cx="85" cy="212" rx="7" ry="15" fill="#1a3d55" />
                    <ellipse cx="109" cy="228" rx="6" ry="13" fill="#1a3d55" />
                    <ellipse cx="131" cy="220" rx="6" ry="13" fill="#1a3d55" />
                </g>

                {/* Right dark reeds */}
                <g>
                    <path d="M790 225 L798 365 L780 365 Z" fill="#061c2e" />
                    <path d="M815 215 L822 370 L806 370 Z" fill="#0a2b45" />
                    <path d="M840 230 L846 360 L832 360 Z" fill="#061c2e" />
                    <path d="M862 222 L868 362 L854 362 Z" fill="#0a2b45" />
                    <ellipse cx="794" cy="218" rx="7" ry="15" fill="#1a3d55" />
                    <ellipse cx="818" cy="208" rx="7" ry="15" fill="#1a3d55" />
                    <ellipse cx="843" cy="224" rx="6" ry="13" fill="#1a3d55" />
                    <ellipse cx="865" cy="216" rx="6" ry="13" fill="#1a3d55" />
                </g>

                {/* Lily pads */}
                <ellipse cx="200" cy="308" rx="42" ry="15" fill="#1f6b4a" opacity="0.9" />
                <path d="M200 308 L230 300" stroke="#0d3d2a" strokeWidth="1.5" opacity="0.6" />
                <ellipse cx="245" cy="328" rx="30" ry="12" fill="#258556" opacity="0.85" />
                <ellipse cx="690" cy="302" rx="38" ry="14" fill="#1f6b4a" opacity="0.9" />
                <path d="M690 302 L718 294" stroke="#0d3d2a" strokeWidth="1.5" opacity="0.6" />
                <ellipse cx="730" cy="324" rx="28" ry="11" fill="#258556" opacity="0.85" />
                <ellipse cx="400" cy="352" rx="32" ry="12" fill="#1f6b4a" opacity="0.8" />
                <ellipse cx="520" cy="358" rx="26" ry="10" fill="#258556" opacity="0.75" />

                {/* Lotus on pad */}
                <g transform="translate(245 298)">
                    <ellipse cx="0" cy="22" rx="24" ry="8" fill="#4fc3f7" opacity="0.4" />
                    <path d="M0 -20 C9 -4 11 8 0 18 C-11 8 -9 -4 0 -20 Z" fill="#ff6bb5" />
                    <path d="M-16 -6 C-2 0 4 10 -4 20 C-18 8 -22 -2 -16 -6 Z" fill="#ff8dc8" />
                    <path d="M16 -6 C2 0 -4 10 4 20 C18 8 22 -2 16 -6 Z" fill="#ff8dc8" />
                    <circle cx="0" cy="4" r="5.5" fill="#ffd54a" />
                </g>

                {/* Bright yellow foreground grass (client mockup) */}
                <g fill="url(#plGrass)">
                    <path d="M0 420 L0 340 Q18 300 28 250 Q36 300 42 340 Q50 290 62 240 Q72 300 78 350 Q88 310 98 270 Q108 320 112 360 Q122 300 138 255 Q148 320 152 370 L160 420 Z" opacity="0.95" />
                    <path d="M12 420 Q22 330 34 280 Q44 340 48 390 Q56 340 70 290 Q80 350 84 400 Q94 350 108 300 Q116 360 120 420 Z" opacity="0.75" />
                    <path d="M760 420 Q770 350 782 300 Q792 360 798 400 Q808 340 822 290 Q832 360 838 420 Z" opacity="0.55" />
                    <path d="M820 420 Q832 330 848 270 Q858 340 864 390 Q874 330 890 280 Q898 350 900 420 Z" opacity="0.85" />
                </g>
            </svg>

            {mode === 'hero' &&
                balls.map((ball) => (
                    <div key={ball.className} className={`pl-ball-wrap ${ball.className}`}>
                        <span className={`pl-ripple ${ball.ripple}`} />
                        <span className={`pl-ripple pl-ripple-delay ${ball.ripple}`} />
                        <img src={ball.src} alt="" />
                    </div>
                ))}
        </div>
    );
}
