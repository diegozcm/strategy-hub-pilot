import React from 'react';

interface ProcessStepProps {
  number: string;
  phase: string;
  title: string;
  description: string;
  isLast?: boolean;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({
  number,
  phase,
  title,
  description,
  isLast = false
}) => {
  return (
    <div className="flex flex-col items-center text-center relative">
      <div className="w-24 h-24 rounded-full bg-cofound-cyan flex items-center justify-center mb-4 relative z-10">
        <span className="text-3xl font-bold text-cofound-white">{number}</span>
      </div>
      
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-cofound-cyan/30" 
             style={{ transform: 'translateX(50%)' }} />
      )}
      
      <div className="space-y-2 max-w-xs">
        <p className="text-xs font-semibold text-cofound-lime uppercase tracking-wider">
          {phase}
        </p>
        <h4 className="text-lg font-bold text-cofound-navy">{title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
