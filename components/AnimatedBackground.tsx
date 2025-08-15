import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-20 w-full h-full bg-slate-950">
      <style>{`
        @keyframes move-stars {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100vh); }
        }
        
        @keyframes subtle-pan {
          0%, 100% { transform: translateX(-5%) translateY(2%) rotateZ(0deg); }
          50% { transform: translateX(5%) translateY(-2%) rotateZ(2deg); }
        }

        @keyframes color-cycle {
          0% { filter: hue-rotate(0deg) brightness(1); }
          50% { filter: hue-rotate(360deg) brightness(1.2); }
          100% { filter: hue-rotate(0deg) brightness(1); }
        }

        @keyframes background-pan {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .stars {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 200vh; /* Taller to allow for vertical movement */
          background-image: 
            radial-gradient(1px 1px at 25% 15%, white, transparent),
            radial-gradient(1px 1px at 75% 35%, white, transparent),
            radial-gradient(1.5px 1.5px at 50% 55%, white, transparent),
            radial-gradient(1px 1px at 90% 75%, white, transparent),
            radial-gradient(1.5px 1.5px at 10% 85%, white, transparent),
            radial-gradient(0.5px 0.5px at 35% 95%, white, transparent),
            radial-gradient(0.5px 0.5px at 65% 5%, white, transparent);
          animation: move-stars 120s linear infinite;
        }
        
        @keyframes shooting-star {
            0% { transform: translateX(150vw) translateY(-50vh) scale(0); opacity: 1; }
            70% { transform: translateX(-50vw) translateY(50vh) scale(1); opacity: 1; }
            100% { transform: translateX(-100vw) translateY(70vh) scale(1); opacity: 0; }
        }

        .shooting-star {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2px;
            height: 150px;
            background: linear-gradient(to top, rgba(255, 255, 255, 0.7), transparent);
            border-radius: 50%;
            transform-origin: top left;
            animation: shooting-star 8s ease-in-out infinite;
        }
        
        .shooting-star:nth-child(2) {
            top: 20%;
            left: 0;
            animation-delay: 3s;
            animation-duration: 6s;
        }

        .aurora-container {
            position: absolute;
            inset: 0;
            overflow: hidden;
            opacity: 0.7;
            animation: color-cycle 40s linear infinite;
        }

        .aurora-layer {
          position: absolute;
          inset: -200%; /* Make layer much larger than viewport */
          animation: subtle-pan 50s ease-in-out infinite alternate;
          will-change: transform;
        }

        .aurora-layer:nth-child(1) {
          background: radial-gradient(circle at 10% 20%, rgba(28, 100, 242, 0.5), transparent 35%),
                      radial-gradient(circle at 90% 80%, rgba(132, 59, 215, 0.5), transparent 35%);
          animation-duration: 45s;
        }

        .aurora-layer:nth-child(2) {
          background: radial-gradient(circle at 80% 30%, rgba(0, 212, 255, 0.45), transparent 30%),
                      radial-gradient(circle at 20% 70%, rgba(219, 64, 219, 0.45), transparent 30%);
          animation-duration: 35s;
          animation-delay: -10s;
        }

        .aurora-layer:nth-child(3) {
          background: radial-gradient(circle at 50% 50%, rgba(255, 75, 227, 0.4), transparent 25%),
                      radial-gradient(circle at 30% 90%, rgba(80, 227, 194, 0.4), transparent 25%);
          animation-duration: 25s;
          animation-delay: -5s;
        }

        .color-shift-background {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              60deg,
              hsl(224, 80%, 10%),
              hsl(269, 80%, 15%),
              hsl(314, 80%, 15%),
              hsl(269, 80%, 15%),
              hsl(224, 80%, 10%)
            );
            background-size: 300% 300%;
            animation: background-pan 30s ease-in-out infinite;
            opacity: 0.5;
        }
      `}</style>
      <div className="color-shift-background"></div>
      <div className="stars"></div>
      <div className="aurora-container">
        <div className="aurora-layer"></div>
        <div className="aurora-layer"></div>
        <div className="aurora-layer"></div>
      </div>
      <div className="shooting-star-container fixed inset-0 w-full h-full -z-10 overflow-hidden">
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>
    </div>
  );
};

export default AnimatedBackground;