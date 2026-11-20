import React, { useState, useEffect } from 'react';
import CookieBanner from './components/CookieBanner';

// =====================================================================
// LANDING / SELECTOR DE PLATAFORMA — estilo pantalla de selección arcade
// Todo es CSS puro: sin imágenes extra ni peticiones de red adicionales.
// =====================================================================

const SECTIONS = [
  {
    key: 'switch',
    player: '1P',
    label: 'NINTENDO SWITCH',
    tagline: 'THE ORIGINAL ARCHIVE',
    source: 'r/SwitchSpines',
    background: 'linear-gradient(160deg, #e60012 0%, #b30000 55%, #4d0000 100%)',
    border: '#ff4d4d',
    glow: 'rgba(230, 0, 18, 0.55)',
    caps: ['#e60012'],               // "tapón" rojo superior de los lomos de Switch
  },
  {
    key: 'custom',
    player: '2P',
    label: 'OTHER CONSOLES',
    tagline: 'PLAYSTATION · XBOX · 3DS · MORE',
    source: 'r/CustomGameSpines',
    background: 'linear-gradient(160deg, #0070d1 0%, #003791 50%, #107c10 100%)',
    border: '#3ddc97',
    glow: 'rgba(0, 112, 209, 0.55)',
    caps: ['#0070d1', '#107c10', '#f2f2f2'],
  },
];

// Colores "de portada" para los lomos decorativos
const SPINE_BODIES = ['#f4d35e', '#2b2d42', '#ee964b', '#5fa8d3', '#f95738', '#9b5de5', '#00bbf9', '#f15bb5', '#e9ecef', '#3a5a40', '#ff006e', '#8338ec'];

// Mini estantería de lomos dentro de cada tarjeta
const MiniShelf = ({ caps, seed = 0, count = 9 }) => (
  <div className="tsa-shelf">
    {Array.from({ length: count }).map((_, i) => {
      const body = SPINE_BODIES[(i * 5 + seed) % SPINE_BODIES.length];
      const cap = caps[i % caps.length];
      const height = 64 + ((i * 37 + seed * 11) % 26);
      return (
        <div
          key={i}
          className="tsa-mini-spine"
          style={{
            height: `${height}px`,
            background: `linear-gradient(to bottom, ${cap} 0 18%, ${body} 18% 100%)`,
            animationDelay: `${i * 0.06}s`
          }}
        />
      );
    })}
  </div>
);

// Estantería infinita decorativa del pie (se duplica para el bucle sin saltos)
const MARQUEE_CAPS = ['#e60012', '#0070d1', '#107c10', '#e60012', '#f2f2f2'];
const MARQUEE_SPINES = Array.from({ length: 36 }).map((_, i) => ({
  cap: MARQUEE_CAPS[i % MARQUEE_CAPS.length],
  body: SPINE_BODIES[(i * 7) % SPINE_BODIES.length],
  height: 46 + ((i * 29) % 22),
}));

const LandingView = ({ onSelect }) => {
  const [active, setActive] = useState(0);

  // Navegación con teclado: ← → para elegir, ENTER / ESPACIO para entrar
  useEffect(() => {
    const onKey = (e) => {
      // No interferir con botones/campos (p. ej. el banner de cookies)
      if (e.target.closest && e.target.closest('button, input, textarea, select')) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setActive(prev => (prev === 0 ? 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(SECTIONS[active].key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onSelect]);

  return (
    <div className="tsa-landing">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

          .tsa-landing {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
            background-color: #07070c;
            color: #fff;
            font-family: "Press Start 2P", monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
            padding: 24px 20px 150px 20px;
          }

          /* --- FONDO: CAMPO DE ESTRELLAS PIXELADAS EN MOVIMIENTO --- */
          .tsa-stars, .tsa-stars-2 {
            position: absolute; inset: -200px 0 0 0;
            pointer-events: none; z-index: 0;
            background-repeat: repeat;
          }
          .tsa-stars {
            background-image:
              radial-gradient(1px 1px at 20px 30px, #fff 100%, transparent),
              radial-gradient(1px 1px at 120px 80px, #9ad 100%, transparent),
              radial-gradient(1px 1px at 200px 160px, #fff 100%, transparent),
              radial-gradient(1px 1px at 60px 190px, #fc6 100%, transparent);
            background-size: 240px 220px;
            animation: tsa-stars-move 40s linear infinite;
            opacity: 0.6;
          }
          .tsa-stars-2 {
            background-image:
              radial-gradient(2px 2px at 80px 40px, #fff 100%, transparent),
              radial-gradient(2px 2px at 260px 210px, #3ddc97 100%, transparent),
              radial-gradient(2px 2px at 330px 90px, #ff4d4d 100%, transparent);
            background-size: 380px 300px;
            animation: tsa-stars-move 22s linear infinite;
            opacity: 0.5;
          }
          @keyframes tsa-stars-move { from { transform: translateY(0); } to { transform: translateY(220px); } }

          /* --- REJILLA DE SUELO TIPO SYNTHWAVE --- */
          .tsa-grid {
            position: absolute; left: -50%; right: -50%; bottom: 0; height: 45vh;
            pointer-events: none; z-index: 0;
            background-image:
              linear-gradient(rgba(61, 220, 151, 0.25) 2px, transparent 2px),
              linear-gradient(90deg, rgba(230, 0, 18, 0.25) 2px, transparent 2px);
            background-size: 60px 60px;
            transform: perspective(400px) rotateX(60deg);
            transform-origin: bottom;
            mask-image: linear-gradient(to top, #000 10%, transparent 90%);
            -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 90%);
            animation: tsa-grid-move 3s linear infinite;
          }
          @keyframes tsa-grid-move { from { background-position: 0 0; } to { background-position: 0 60px; } }

          /* --- CAPA CRT: SCANLINES + VIÑETA --- */
          .tsa-crt {
            position: fixed; inset: 0; pointer-events: none; z-index: 50;
            background:
              repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px),
              radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%);
          }

          .tsa-content { position: relative; z-index: 2; width: 100%; display: flex; flex-direction: column; align-items: center; }

          /* --- HUD SUPERIOR ESTILO ARCADE --- */
          .tsa-hud {
            width: 100%; max-width: 900px;
            display: flex; justify-content: space-between;
            font-size: 10px; letter-spacing: 1px; margin-bottom: 26px;
          }
          .tsa-hud .p1 { color: #ff4d4d; }
          .tsa-hud .p2 { color: #3ddc97; }
          .tsa-hud .mid { color: #ffcc00; }

          .tsa-logo {
            height: 96px; image-rendering: pixelated;
            border: 4px solid #fff; box-shadow: 6px 6px 0 #000;
            margin-bottom: 26px;
            animation: tsa-float 3s ease-in-out infinite;
          }
          @keyframes tsa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

          /* --- TÍTULO CON ABERRACIÓN CROMÁTICA (ROJO SWITCH / AZUL PS) --- */
          .tsa-title {
            font-size: clamp(18px, 4.2vw, 42px);
            text-align: center; line-height: 1.35; margin: 0 0 14px 0;
            color: #fff;
            text-shadow: -3px 0 0 #e60012, 3px 0 0 #0070d1, 6px 6px 0 #000;
            animation: tsa-flicker 6s infinite;
          }
          @keyframes tsa-flicker {
            0%, 92%, 100% { opacity: 1; }
            93% { opacity: 0.75; } 94% { opacity: 1; } 96% { opacity: 0.85; }
          }

          .tsa-subtitle {
            font-size: clamp(9px, 1.4vw, 13px);
            color: #ffcc00; text-shadow: 2px 2px 0 #000;
            margin: 0 0 8px 0; text-align: center; letter-spacing: 2px;
          }
          .tsa-desc {
            font-family: sans-serif; font-size: 13px; color: #aaa;
            text-align: center; max-width: 620px; line-height: 1.6; margin: 0 0 36px 0;
          }

          /* --- TARJETAS DE SELECCIÓN --- */
          .tsa-cards { display: flex; flex-wrap: wrap; justify-content: center; gap: 36px; width: 100%; }

          .tsa-card {
            position: relative; overflow: hidden;
            width: min(100%, 360px); min-height: 330px;
            display: flex; flex-direction: column; align-items: center; justify-content: space-between;
            gap: 14px; padding: 22px 20px 20px 20px; box-sizing: border-box;
            color: #fff; text-decoration: none; text-align: center; cursor: pointer;
            border: 4px solid #fff;
            box-shadow: 8px 8px 0 #000;
            transition: transform 0.15s steps(3), box-shadow 0.15s steps(3);
          }
          .tsa-card.is-active {
            transform: translate(-4px, -4px);
            box-shadow: 12px 12px 0 #000, 0 0 40px var(--tsa-glow);
            border-color: var(--tsa-border);
          }
          .tsa-card:active { transform: translate(4px, 4px); box-shadow: 2px 2px 0 #000; }

          /* Brillo que barre la tarjeta al seleccionarla */
          .tsa-card::after {
            content: ''; position: absolute; top: 0; left: -120%; width: 60%; height: 100%;
            background: linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent);
            transform: skewX(-20deg); pointer-events: none;
          }
          .tsa-card.is-active::after { animation: tsa-shine 0.9s ease-out; }
          @keyframes tsa-shine { to { left: 160%; } }

          .tsa-player {
            align-self: flex-start;
            background: #000; border: 2px solid #fff; padding: 5px 8px; font-size: 9px;
          }
          .tsa-card-label { font-size: clamp(12px, 1.6vw, 16px); line-height: 1.6; text-shadow: 3px 3px 0 #000; }
          .tsa-card-tagline { font-size: 8px; line-height: 1.8; color: rgba(255,255,255,0.9); text-shadow: 2px 2px 0 #000; }
          .tsa-card-source { font-family: sans-serif; font-size: 12px; color: rgba(255,255,255,0.8); }

          .tsa-start {
            font-size: 9px; color: #ffcc00; text-shadow: 2px 2px 0 #000;
            visibility: hidden;
          }
          .tsa-card.is-active .tsa-start { visibility: visible; animation: tsa-blink 0.9s steps(1) infinite; }
          @keyframes tsa-blink { 50% { opacity: 0; } }

          /* Mini estantería dentro de la tarjeta */
          .tsa-shelf {
            display: flex; align-items: flex-end; gap: 4px; height: 92px;
            padding: 0 8px; border-bottom: 4px solid rgba(0,0,0,0.6);
          }
          .tsa-mini-spine { width: 14px; border: 2px solid #000; box-sizing: border-box; }
          .tsa-card.is-active .tsa-mini-spine { animation: tsa-wave 0.5s ease-out both; }
          @keyframes tsa-wave { 0% { transform: translateY(0); } 40% { transform: translateY(-12px); } 100% { transform: translateY(0); } }

          .tsa-help { margin-top: 34px; font-size: 9px; color: #888; letter-spacing: 1px; text-align: center; line-height: 2; }
          .tsa-help b { color: #fff; }

          /* --- ESTANTERÍA INFINITA DEL PIE --- */
          .tsa-marquee {
            position: absolute; left: 0; right: 0; bottom: 34px; z-index: 2;
            overflow: hidden; border-bottom: 6px solid #3a2a1a; padding-top: 10px;
          }
          .tsa-marquee-track { display: flex; align-items: flex-end; gap: 4px; width: max-content; animation: tsa-scroll 40s linear infinite; }
          .tsa-marquee .tsa-mini-spine { width: 16px; }
          @keyframes tsa-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

          @media (max-width: 600px) {
            .tsa-hud { font-size: 8px; }
            .tsa-help .keys { display: none; }
          }

          @media (prefers-reduced-motion: reduce) {
            .tsa-landing *, .tsa-landing *::after { animation: none !important; transition: none !important; }
          }
        `}
      </style>

      {/* Capas decorativas de fondo */}
      <div className="tsa-stars" />
      <div className="tsa-stars-2" />
      <div className="tsa-grid" />
      <div className="tsa-crt" />

      <div className="tsa-content">
        {/* HUD superior */}
        <div className="tsa-hud">
          <span className="p1">1P SWITCH</span>
          <span className="mid">SELECT PLAYER</span>
          <span className="p2">2P OTHERS</span>
        </div>

        <img src="/logo.jpg" alt="The Spine Archive" className="tsa-logo" />

        <h1 className="tsa-title">THE SPINE ARCHIVE</h1>
        <p className="tsa-subtitle">▶ CHOOSE YOUR PLATFORM ◀</p>
        <p className="tsa-desc">
          Browse thousands of community-made custom game spines, build your sheet and print 1:1 PDFs.
        </p>

        <div className="tsa-cards">
          {SECTIONS.map((s, idx) => (
            // <a> real con href para que Google/AdSense puedan seguir el enlace
            <a
              key={s.key}
              href={`?section=${s.key}`}
              className={`tsa-card ${active === idx ? 'is-active' : ''}`}
              style={{ background: s.background, '--tsa-glow': s.glow, '--tsa-border': s.border }}
              onMouseEnter={() => setActive(idx)}
              onFocus={() => setActive(idx)}
              onClick={(e) => { e.preventDefault(); onSelect(s.key); }}
            >
              <span className="tsa-player">{s.player}</span>
              <MiniShelf caps={s.caps} seed={idx * 3} />
              <span className="tsa-card-label">{s.label}</span>
              <span className="tsa-card-tagline">{s.tagline}</span>
              <span className="tsa-card-source">{s.source}</span>
              <span className="tsa-start">PRESS START</span>
            </a>
          ))}
        </div>

        <div className="tsa-help">
          <span className="keys"><b>◀ ▶</b> SELECT &nbsp;·&nbsp; <b>ENTER</b> START &nbsp;·&nbsp; </span>
          FREE FOREVER · MADE BY THE COMMUNITY
        </div>
      </div>

      {/* Estantería infinita */}
      <div className="tsa-marquee" aria-hidden="true">
        <div className="tsa-marquee-track">
          {[...MARQUEE_SPINES, ...MARQUEE_SPINES].map((sp, i) => (
            <div
              key={i}
              className="tsa-mini-spine"
              style={{ height: `${sp.height}px`, background: `linear-gradient(to bottom, ${sp.cap} 0 18%, ${sp.body} 18% 100%)` }}
            />
          ))}
        </div>
      </div>

      <CookieBanner />
    </div>
  );
};

export default LandingView;
