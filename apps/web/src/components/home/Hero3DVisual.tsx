'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, GraduationCap, Sprout, HeartPulse, Sparkles, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';

interface Hero3DVisualProps {
  language: 'en' | 'gu';
}

export const Hero3DVisual: React.FC<Hero3DVisualProps> = ({ language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Canvas Particle Network Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes with chromatic colors
    const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'];
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.18 * (1 - dist / 110)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Mouse tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 14;

    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => setIsHovered(true);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-lg lg:max-w-xl mx-auto h-[460px] sm:h-[500px] perspective-1400 flex items-center justify-center select-none"
    >
      {/* 3D Background Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 z-0"
      />

      {/* 3D Kinetic Multi-Layered Stage */}
      <div
        className="w-full h-full relative transform-style-3d transition-transform duration-300 ease-out flex items-center justify-center z-10"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* Prismatic Radial Auroral Backdrops */}
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-primary/30 via-radiant-fuchsia/20 to-radiant-cyan/25 blur-[70px] -z-10 animate-pulse-glow pointer-events-none" />

        {/* Card 1: Education (Top Left) - Electric Indigo & Cyan */}
        <div
          className="absolute w-[260px] sm:w-[290px] p-4 sm:p-5 rounded-3xl glass-panel border border-white shadow-2xl transition-all duration-300 transform-style-3d cursor-pointer hover:border-radiant-indigo hover:shadow-hologram"
          style={{
            transform: `translate3d(-55px, -80px, 45px) rotateZ(-5deg) ${
              isHovered ? 'scale(1.04)' : 'scale(1)'
            }`,
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{language === 'gu' ? 'ઉચ્ચ શિક્ષણ' : 'Education'}</span>
            </span>
            <span className="text-[10px] font-bold text-status-success bg-status-success-soft px-2.5 py-0.5 rounded-full border border-status-success/25">
              100% Waiver
            </span>
          </div>

          <h4 className="text-sm font-bold font-display text-ink line-clamp-1">
            {language === 'gu' ? 'ડિજિટલ ગુજરાત શિષ્યવૃત્તિ' : 'Digital Gujarat Post-Matric'}
          </h4>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            {language === 'gu' ? 'ટ્યુશન ફી માફી + વાર્ષિક નિર્વાહ ભથ્થું' : 'Full tuition fee reimbursement + monthly allowance'}
          </p>

          <div className="mt-3.5 pt-2.5 border-t border-editorial-border/60 flex items-center justify-between text-[11px]">
            <span className="font-bold text-radiant-indigo">Gujarat Domicile</span>
            <span className="text-ink-muted flex items-center gap-1 text-[10px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
              Rule Grounded
            </span>
          </div>
        </div>

        {/* Card 2: Healthcare (Top Right) - Emerald & Turquoise */}
        <div
          className="absolute w-[270px] sm:w-[300px] p-4 sm:p-5 rounded-3xl glass-panel border border-white shadow-2xl transition-all duration-300 transform-style-3d cursor-pointer hover:border-radiant-emerald hover:shadow-2xl"
          style={{
            transform: `translate3d(65px, -15px, 80px) rotateZ(3deg) ${
              isHovered ? 'scale(1.05)' : 'scale(1)'
            }`,
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{language === 'gu' ? 'આરોગ્ય કવચ' : 'Healthcare'}</span>
            </span>
            <span className="text-[10px] font-extrabold text-white bg-gradient-to-r from-primary to-indigo-600 px-2.5 py-0.5 rounded-full shadow-xs">
              ₹10,00,000 / yr
            </span>
          </div>

          <h4 className="text-sm font-bold font-display text-ink line-clamp-1">
            {language === 'gu' ? 'આયુષ્માન ભારત PM-JAY & MA' : 'Ayushman Bharat PM-JAY'}
          </h4>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            {language === 'gu' ? '૧૦૦% કેશલેસ હોસ્પિટલાઈઝેશન' : '100% Cashless secondary & tertiary cover in empaneled hospitals'}
          </p>

          <div className="mt-3.5 pt-2.5 border-t border-editorial-border/60 flex items-center justify-between text-[11px]">
            <span className="font-bold text-secondary">Low Income / 70+ Age</span>
            <span className="text-ink-muted flex items-center gap-0.5 text-[10px] font-semibold">
              pmjay.gov.in <ArrowUpRight className="w-3 h-3 text-secondary" />
            </span>
          </div>
        </div>

        {/* Card 3: Agriculture (Bottom Center) - Saffron Amber & Rose */}
        <div
          className="absolute w-[290px] sm:w-[330px] p-5 sm:p-6 rounded-3xl bg-white border border-editorial-border shadow-paper-hover transition-all duration-300 transform-style-3d cursor-pointer hover:border-radiant-amber hover:shadow-2xl"
          style={{
            transform: `translate3d(-10px, 90px, 115px) rotateZ(-1.5deg) ${
              isHovered ? 'scale(1.07)' : 'scale(1)'
            }`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-xs">
              <Sprout className="w-3.5 h-3.5" />
              <span>{language === 'gu' ? 'ખેડૂત આવક સહાય' : 'Farmer Support'}</span>
            </span>
            <span className="text-[11px] font-extrabold text-ink bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200">
              ₹6,000 DBT / year
            </span>
          </div>

          <h4 className="text-base font-extrabold font-display text-ink line-clamp-1">
            {language === 'gu' ? 'પીએમ કિસાન સન્માન નિધિ' : 'PM Kisan Samman Nidhi'}
          </h4>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            {language === 'gu'
              ? 'દર ૪ મહિને ₹૨,૦૦૦ ના ત્રણ સમાન હપ્તામાં DBT દ્વારા સીધા બેંક ખાતામાં.'
              : 'Direct Benefit Transfer into Aadhaar-linked accounts in 3 equal installments.'}
          </p>

          <div className="mt-4 pt-3 border-t border-editorial-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-status-success">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              <span>{language === 'gu' ? 'સત્તાવાર સ્ત્રોત ચકાસાયેલ' : 'Verified Central Portal'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary-soft">
              pmkisan.gov.in
            </span>
          </div>
        </div>

        {/* Orbiting Holographic Capsule 1 */}
        <div
          className="absolute -top-7 -right-2 px-3.5 py-1.5 rounded-full glass-panel text-[11px] font-bold text-radiant-indigo flex items-center gap-2 shadow-xl transform-style-3d pointer-events-none animate-float-slow glow-pill-primary"
          style={{ transform: 'translate3d(130px, -95px, 140px)' }}
        >
          <Sparkles className="w-4 h-4 text-radiant-amber animate-spin" style={{ animationDuration: '6s' }} />
          <span>Zero AI Hallucinations</span>
        </div>

        {/* Orbiting Holographic Capsule 2 */}
        <div
          className="absolute -bottom-6 -left-6 px-3.5 py-1.5 rounded-full glass-panel text-[11px] font-bold text-ink flex items-center gap-2 shadow-xl transform-style-3d pointer-events-none animate-float-medium glow-pill-emerald"
          style={{ transform: 'translate3d(-110px, 150px, 145px)' }}
        >
          <Zap className="w-4 h-4 text-status-success" />
          <span>Deterministic Eligibility Rules</span>
        </div>
      </div>
    </div>
  );
};
