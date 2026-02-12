import React from 'react';

const LiquidGlassFilter: React.FC = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
    <defs>
      <filter id="liquid-glass-distortion">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="glass-specular">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="1" specularExponent="20" lightingColor="#ffffff" result="specularOut">
          <fePointLight x="-5000" y="-10000" z="20000" />
        </feSpecularLighting>
        <feComposite in="specularOut" in2="SourceAlpha" operator="in" result="specularOut" />
        <feComposite in="SourceGraphic" in2="specularOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
      </filter>
    </defs>
  </svg>
);

export default LiquidGlassFilter;
