import React, { useEffect, useState } from 'react';
import { useScrollReveal } from './useScrollReveal';

interface Props {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
}

export const AnimatedCounter: React.FC<Props> = ({ end, suffix = '', prefix = '', duration = 2000, label }) => {
  const { ref, isVisible } = useScrollReveal(0.3);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-display font-bold text-cofound-blue-dark">
        {prefix}{count}{suffix}
      </p>
      <p className="text-sm text-cofound-blue-dark/60 font-sans mt-2">{label}</p>
    </div>
  );
};
