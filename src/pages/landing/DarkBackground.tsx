import React from 'react';
import { motion } from 'motion/react';

/* Shared RetroGrid */
const RetroGrid: React.FC = () => {
  const gridStyles = {
    '--grid-angle': '65deg',
    '--cell-size': '50px',
    '--opacity': 0.5,
    '--dark-line': 'rgba(56,182,255,0.2)',
  } as React.CSSProperties;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]"
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          style={{
            backgroundRepeat: 'repeat',
            backgroundSize: 'var(--cell-size) var(--cell-size)',
            backgroundImage: `linear-gradient(to right, var(--dark-line) 1px, transparent 0), linear-gradient(to bottom, var(--dark-line) 1px, transparent 0)`,
            height: '300vh',
            inset: '-200% 0px',
            marginLeft: '-200%',
            opacity: 'var(--opacity)',
            position: 'absolute',
            width: '600vw',
            animation: 'grid-scroll 20s linear infinite',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cofound-blue-dark via-cofound-blue-dark/60 to-transparent to-90%" />
    </div>
  );
};

/* Floating decorative shapes */
const floatingElements = [
  { size: 90, top: '8%', left: '6%', delay: 0, duration: 6, shape: 'circle' as const },
  { size: 60, top: '18%', right: '8%', delay: 1, duration: 8, shape: 'hexagon' as const },
  { size: 40, top: '55%', left: '4%', delay: 2, duration: 7, shape: 'square' as const },
  { size: 70, top: '65%', right: '5%', delay: 0.5, duration: 9, shape: 'circle' as const },
  { size: 30, top: '35%', left: '12%', delay: 3, duration: 5, shape: 'diamond' as const },
  { size: 50, top: '10%', right: '16%', delay: 1.5, duration: 7, shape: 'square' as const },
  { size: 45, top: '45%', right: '12%', delay: 2.5, duration: 6.5, shape: 'circle' as const },
  { size: 55, top: '75%', left: '10%', delay: 0.8, duration: 8, shape: 'hexagon' as const },
  { size: 35, top: '28%', left: '20%', delay: 1.2, duration: 5.5, shape: 'diamond' as const },
  { size: 65, top: '80%', right: '15%', delay: 3.5, duration: 7, shape: 'square' as const },
];

const FloatingShape: React.FC<{ el: (typeof floatingElements)[0] }> = ({ el }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: el.size,
    height: el.size,
    top: el.top,
    left: (el as any).left,
    right: (el as any).right,
  };

  const borderRadius =
    el.shape === 'circle' ? '50%' :
    el.shape === 'diamond' ? '4px' :
    el.shape === 'hexagon' ? '30%' : '8px';

  const rotation = el.shape === 'diamond' ? 45 : 0;

  return (
    <motion.div
      style={{ ...style, borderRadius, rotate: rotation }}
      className="border border-cofound-green/20 bg-cofound-green/[0.08]"
      animate={{
        y: [0, -25, 0],
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: el.duration,
        delay: el.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

interface DarkBackgroundProps {
  children: React.ReactNode;
  as?: 'section' | 'footer' | 'div';
  className?: string;
}

export const DarkBackground: React.FC<DarkBackgroundProps> = ({
  children,
  as: Tag = 'section',
  className = '',
}) => (
  <Tag className={`relative overflow-hidden bg-cofound-blue-dark ${className}`}>
    <RetroGrid />
    {floatingElements.map((el, i) => (
      <FloatingShape key={i} el={el} />
    ))}
    <div className="relative z-10">
      {children}
    </div>
  </Tag>
);
