import React from 'react';
import Boolean4GlassCanvas from './Boolean4GlassCanvas';

export const Hero3DCanvas = ({ className = '' }) => {
  return (
    <div
      className={`hero-3d-fullbleed-backdrop ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none', // Strictly non-blocking: allows smooth native page scrolling
      }}
    >
      {/* Native WebGL Boolean 4 Chromatic Glass Engine */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <Boolean4GlassCanvas
          interactive={false}
          standalone={false}
          defaultGeometry="castle"
        />
      </div>

      {/* Atmospheric Vignette Masks for Seamless Landing Page Blending */}
      <div
        className="hero-3d-vignette-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          background:
            'radial-gradient(circle at 62% 48%, transparent 22%, rgba(11, 15, 13, 0.45) 65%, rgba(11, 15, 13, 0.96) 100%), linear-gradient(to bottom, rgba(11, 15, 13, 0.4) 0%, transparent 20%, transparent 75%, rgba(11, 15, 13, 1) 100%)',
        }}
      />
    </div>
  );
};

export default Hero3DCanvas;
