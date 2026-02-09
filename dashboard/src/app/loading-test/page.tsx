'use client';

export default function LoadingTestPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">

            {/* Main Loading Container - Positioned lower to simulate floor */}
            <div className="relative mt-32">

                {/* Floor Perspective Container */}
                <div
                    className="relative"
                    style={{
                        transform: 'perspective(800px) rotateX(65deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >

                    {/* Outer Ring Container - The rotating arcs */}
                    <div className="relative w-[300px] h-[300px] flex items-center justify-center">

                        {/* Arc 1 - Top Left Golden Arc */}
                        <div
                            className="absolute w-full h-full animate-[spin_8s_linear_infinite]"
                            style={{ animationDirection: 'reverse' }}
                        >
                            <div
                                className="absolute top-0 left-0 w-1/2 h-1/2"
                                style={{
                                    borderTop: '2px solid rgba(255, 220, 150, 0.6)',
                                    borderRadius: '100% 0 0 0',
                                    boxShadow: '0 0 8px rgba(255, 220, 150, 0.4)',
                                    transformOrigin: 'bottom right'
                                }}
                            ></div>
                        </div>

                        {/* Arc 2 - Bottom Right Golden Arc */}
                        <div
                            className="absolute w-full h-full animate-[spin_8s_linear_infinite]"
                        >
                            <div
                                className="absolute bottom-0 right-0 w-1/2 h-1/2"
                                style={{
                                    borderBottom: '2px solid rgba(255, 220, 150, 0.6)',
                                    borderRadius: '0 0 100% 0',
                                    boxShadow: '0 0 8px rgba(255, 220, 150, 0.4)',
                                    transformOrigin: 'top left'
                                }}
                            ></div>
                        </div>

                        {/* Arc 3 - Smaller inner arc - Left */}
                        <div
                            className="absolute w-[60%] h-[60%] animate-[spin_6s_linear_infinite_reverse]"
                        >
                            <div
                                className="absolute top-0 right-0 w-1/2 h-1/2"
                                style={{
                                    borderTop: '1.5px solid rgba(200, 220, 255, 0.4)',
                                    borderRadius: '0 100% 0 0',
                                    boxShadow: '0 0 6px rgba(200, 220, 255, 0.3)',
                                }}
                            ></div>
                        </div>

                        {/* Arc 4 - Smaller inner arc - Right */}
                        <div
                            className="absolute w-[60%] h-[60%] animate-[spin_6s_linear_infinite]"
                        >
                            <div
                                className="absolute bottom-0 left-0 w-1/2 h-1/2"
                                style={{
                                    borderBottom: '1.5px solid rgba(200, 220, 255, 0.4)',
                                    borderRadius: '0 0 0 100%',
                                    boxShadow: '0 0 6px rgba(200, 220, 255, 0.3)',
                                }}
                            ></div>
                        </div>

                        {/* Center Element Container */}
                        <div className="absolute inset-0 flex items-center justify-center">

                            {/* Blue Glow Background */}
                            <div
                                className="absolute w-20 h-20 bg-cyan-400 rounded-full blur-xl opacity-60 animate-pulse"
                            ></div>

                            {/* Secondary Glow */}
                            <div
                                className="absolute w-16 h-16 bg-blue-400 rounded-full blur-lg opacity-70"
                            ></div>

                            {/* Diamond/Crystal Symbol */}
                            <div className="relative z-10">
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="drop-shadow-[0_0_10px_rgba(96,180,255,0.9)]"
                                >
                                    {/* Diamond shape */}
                                    <path
                                        d="M12 2 L22 12 L12 22 L2 12 Z"
                                        fill="rgba(180, 220, 255, 0.9)"
                                        stroke="rgba(255, 255, 255, 0.8)"
                                        strokeWidth="0.5"
                                    />
                                    {/* Inner highlight */}
                                    <path
                                        d="M12 6 L18 12 L12 18 L6 12 Z"
                                        fill="rgba(220, 240, 255, 0.6)"
                                    />
                                </svg>
                            </div>

                        </div>
                    </div>

                    {/* Floor Reflection/Shadow */}
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 bg-cyan-500/20 blur-xl rounded-[100%]"
                    ></div>

                </div>
            </div>

            {/* UID Watermark */}
            <div className="absolute bottom-4 right-4 text-white/30 font-mono text-xs tracking-wider">
                UID: 802228840
            </div>

        </div>
    );
}
