import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

// =====================================================================
// PRINTER VIEW DE "OTRAS CONSOLAS"
// Copia independiente de PrinterView.jsx. Diferencia clave: cada lomo se
// imprime con las medidas de SU tipo de caja (campo `format` del JSON),
// en vez de los 10.5 x 161 mm fijos de Switch.
// =====================================================================

const PALETTE = {
  navBg: 'linear-gradient(90deg, #003791 0%, #0070d1 55%, #107c10 100%)',
  primary: '#0070d1',
  primaryDark: '#003791',
  secondary: '#107c10',
  highlight: '#3ddc97',
};

// --- MEDIDAS POR TIPO DE CAJA (mm) ---
// ps y ds: proporción calibrada con las imágenes reales del subreddit (11.4 y 9.75).
// El resto son PROVISIONALES: ajústalas en el panel y pasa los valores buenos aquí.
const FORMAT_PROFILES = {
  'ps':          { label: 'PS3 / PS4 / PS5',   width: 14.0, height: 160 },
  'xbox-modern': { label: 'Xbox One / Series', width: 12.0, height: 160 },
  'dvd':         { label: 'PS2 / Wii / X360',  width: 14.0, height: 183 },
  'xbox-og':     { label: 'Xbox (original)',   width: 13.0, height: 183 },
  'wiiu':        { label: 'Wii U',             width: 14.0, height: 160 },
  'gamecube':    { label: 'GameCube',          width: 14.0, height: 183 },
  'ds':          { label: 'DS / 3DS',          width: 12.5, height: 122 },
  'jewel':       { label: 'PS1 (CD)',          width: 10.0, height: 118 },
  'vita':        { label: 'PS Vita',           width: 10.0, height: 125 },
  'umd':         { label: 'PSP',               width: 14.0, height: 170 },
};
const FALLBACK_FORMAT = 'ps';
const STORAGE_KEY = 'tsa-custom-format-sizes';
const ROW_GAP_MM = 2;

const printerImageCache = {};
const printerPromiseCache = {};

const loadSavedSizes = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.fromEntries(Object.entries(FORMAT_PROFILES).map(([k, v]) => [k, { width: v.width, height: v.height, ...(saved[k] || {}) }]));
  } catch {
    return Object.fromEntries(Object.entries(FORMAT_PROFILES).map(([k, v]) => [k, { width: v.width, height: v.height }]));
  }
};

const formatOf = (spine) => (spine.format && FORMAT_PROFILES[spine.format]) ? spine.format : FALLBACK_FORMAT;

const CustomPrinterView = ({ selectedSpines = [], initialSpines = [], onBack }) => {
  const incomingSpines = selectedSpines.length > 0 ? selectedSpines : initialSpines;
  const [images, setImages] = useState(incomingSpines);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrintGuideModal, setShowPrintGuideModal] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

  const [config, setConfig] = useState({
    spineSpacing: 0.1,
    pageWidth: 11.0,
    pageHeight: 8.5,
    marginTop: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5,
  });

  // Medidas por formato, editables y recordadas en este navegador
  const [sizes, setSizes] = useState(loadSavedSizes);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes)); } catch { /* sin almacenamiento */ }
  }, [sizes]);

  useEffect(() => {
    if (incomingSpines && incomingSpines.length > 0) setImages(incomingSpines);
  }, [incomingSpines]);

  // Formatos presentes en la selección actual (solo esos se muestran en el panel)
  const usedFormats = [...new Set(images.map(formatOf))];

  const inchToMm = (inch) => inch * 25.4;

  const updateSize = (fmt, key, value) => {
    setSizes(prev => ({ ...prev, [fmt]: { ...prev[fmt], [key]: parseFloat(value) || 0 } }));
  };
  const resetSize = (fmt) => {
    setSizes(prev => ({ ...prev, [fmt]: { width: FORMAT_PROFILES[fmt].width, height: FORMAT_PROFILES[fmt].height } }));
  };

  const getSafeImageData = (url) => {
    if (!url) return Promise.resolve(null);
    if (printerImageCache[url]) return Promise.resolve(printerImageCache[url]);
    if (printerPromiseCache[url]) return printerPromiseCache[url];

    printerPromiseCache[url] = new Promise((resolve) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = url;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          const base64Data = canvas.toDataURL('image/jpeg', 0.85);
          printerImageCache[url] = base64Data;
          delete printerPromiseCache[url];
          resolve(base64Data);
        } catch {
          delete printerPromiseCache[url];
          resolve(null);
        }
      };
      img.onerror = () => {
        delete printerPromiseCache[url];
        resolve(null);
      };
    });
    return printerPromiseCache[url];
  };

  const generatePreview = useCallback(async () => {
    if (!images || images.length === 0) { setPdfUrl(null); return; }
    setIsGenerating(true);
    try {
      const orientation = config.pageWidth < config.pageHeight ? 'p' : 'l';
      let pdfFormat = [inchToMm(config.pageWidth), inchToMm(config.pageHeight)];
      if (config.pageWidth === 11.0 && config.pageHeight === 8.5) pdfFormat = 'letter';
      else if (config.pageWidth === 11.69 && config.pageHeight === 8.27) pdfFormat = 'a4';

      const pdf = new jsPDF({ orientation, unit: 'mm', format: pdfFormat });
      pdf.setProperties({ subject: JSON.stringify(images) });

      const gap = inchToMm(config.spineSpacing);
      const mLeft = inchToMm(config.marginLeft);
      const mTop = inchToMm(config.marginTop);
      const mRight = inchToMm(config.marginRight);
      const pW = inchToMm(config.pageWidth);
      const pH = inchToMm(config.pageHeight);

      // Lista expandida por COUNT, cada copia con sus medidas
      const items = [];
      images.forEach(imgObj => {
        const url = imgObj.image || imgObj.src;
        if (!url) return;
        const { width, height } = sizes[formatOf(imgObj)];
        for (let i = 0; i < (imgObj.count || 1); i++) items.push({ url, w: width, h: height });
      });
      if (items.length === 0) { setPdfUrl(null); setIsGenerating(false); return; }

      const loaded = await Promise.all(items.map(it => getSafeImageData(it.url)));

      // Colocación por filas: cada fila mide lo que su lomo más alto
      let curX = mLeft;
      let curY = mTop;
      let rowH = 0;

      items.forEach((it, idx) => {
        const imgData = loaded[idx];
        if (!imgData) return;

        if (curX + it.w > pW - mRight && curX > mLeft) {
          curX = mLeft;
          curY += rowH + ROW_GAP_MM;
          rowH = 0;
        }
        if (curY + it.h > pH - 2 && curY > mTop) {
          pdf.addPage([pW, pH], orientation);
          curX = mLeft;
          curY = mTop;
          rowH = 0;
        }
        pdf.addImage(imgData, 'JPEG', curX, curY, it.w, it.h, undefined, 'NONE');
        curX += it.w + gap;
        rowH = Math.max(rowH, it.h);
      });

      setPdfUrl(pdf.output('bloburl'));
    } catch (err) {
      console.error("PDF Generator Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [images, config, sizes]);

  useEffect(() => {
    const timeoutId = setTimeout(() => generatePreview(), 1500);
    return () => clearTimeout(timeoutId);
  }, [generatePreview]);

  const handleDownloadClick = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
    setShowSupportModal(true);
  };

  // DRAG & DROP
  const handleDragStart = (e, index) => { setDraggedItemIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnd = () => { setDraggedItemIndex(null); setDragOverItemIndex(null); };
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) { handleDragEnd(); return; }
    const newImages = [...images];
    const [dragged] = newImages.splice(draggedItemIndex, 1);
    newImages.splice(targetIndex, 0, dragged);
    setImages(newImages);
    handleDragEnd();
  };

  // Bloqueo de móviles (después de los hooks para respetar las reglas de React)
  const isMobileDevice = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  if (isMobileDevice) {
    return (
      <div style={{ padding: '40px', backgroundColor: '#0d1117', color: '#fff', textAlign: 'center', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '15px' }}>🖥️</div>
        <h2 style={{ color: PALETTE.highlight, fontFamily: '"Press Start 2P", monospace', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>PC REQUIRED</h2>
        <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '30px', maxWidth: '400px', lineHeight: '1.6' }}>
          This page cannot be accessed from mobile devices. Please open The Spine Archive on a Desktop or Laptop PC to generate and print your PDFs.
        </p>
        <button onClick={() => onBack(selectedSpines)} style={{ backgroundColor: PALETTE.primary, color: 'white', border: 'none', padding: '12px 25px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          ← Return to Catalog
        </button>
      </div>
    );
  }

  const inputStyle = { width: '55px', color: '#000', border: '1px solid #ccc', background: 'white' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>

      {/* HEADER */}
      <div style={{ height: '50px', background: PALETTE.navBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => onBack(images)} style={{ background: 'black', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            ← BACK TO CATALOG
          </button>
          <div style={{ color: 'white', fontFamily: '"Press Start 2P", monospace', fontSize: '12px', textShadow: '2px 2px 0px #000', letterSpacing: '1px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isGenerating ? "⏳ GENERATING..." : "PRINTING PREVIEW"}
            <button
              onClick={() => setShowPrintGuideModal(true)}
              style={{ backgroundColor: PALETTE.highlight, color: '#000', border: '2px solid #fff', borderRadius: '4px', padding: '4px 10px', fontSize: '9px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '2px 2px 0px #000' }}
            >
              ⚠️ BEFORE PRINTING!
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setImages([])} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>CLEAR ALL</button>
          <button onClick={handleDownloadClick} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: PALETTE.primaryDark }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* PANEL IZQUIERDO CON DRAG & DROP */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', borderRight: '1px solid #999', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {images.map((imgObj, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverItemIndex(i)}
                onDragLeave={() => { if (dragOverItemIndex === i) setDragOverItemIndex(null); }}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  position: 'relative', background: 'white', borderRadius: '8px', overflow: 'hidden',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  border: dragOverItemIndex === i && draggedItemIndex !== i ? `3px dashed ${PALETTE.primary}` : 'none',
                  cursor: 'grab', opacity: draggedItemIndex === i ? 0.5 : 1,
                  transform: dragOverItemIndex === i && draggedItemIndex !== i ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease', boxSizing: 'border-box'
                }}
              >
                <div style={{ backgroundColor: '#444', color: 'white', textAlign: 'center', fontSize: '10px', padding: '3px 0' }}>☰ DRAG</div>
                <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={imgObj.image || imgObj.src} alt="t" style={{ width: '100%', height: '100px', objectFit: 'cover', pointerEvents: 'none' }} />
                </div>
                {/* Etiqueta del formato de caja */}
                <div style={{ backgroundColor: PALETTE.primaryDark, color: '#fff', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '3px 0' }}>
                  {(imgObj.consoles || []).join(' / ') || FORMAT_PROFILES[formatOf(imgObj)].label}
                </div>
                <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>COUNT:</span>
                  <input type="number" value={imgObj.count || 1} onChange={(e) => {
                    const newImgs = [...images];
                    newImgs[i] = { ...newImgs[i], count: Math.max(1, parseInt(e.target.value) || 1) };
                    setImages(newImgs);
                  }} style={{ width: '45px', textAlign: 'center', border: '1px solid #ccc', color: '#000', background: 'white' }} />
                </div>
                <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '22px', right: '5px', backgroundColor: 'rgba(0, 55, 145, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', zIndex: 10 }}> × </button>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA CENTRAL Y CONTROLES */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#525659' }}>
          <div style={{
            position: 'absolute', top: '15px', right: '15px', zIndex: 10, backgroundColor: 'white', padding: '15px',
            borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
            gap: '12px', color: '#000', maxHeight: 'calc(100% - 30px)', overflowY: 'auto', width: '300px', boxSizing: 'border-box'
          }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', color: '#333', marginBottom: '4px' }}>PAPER SIZE</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Letter') setConfig({ ...config, pageWidth: 11.0, pageHeight: 8.5, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1 });
                  if (val === 'A4') setConfig({ ...config, pageWidth: 11.69, pageHeight: 8.27, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1 });
                }}
                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', color: 'black', fontSize: '12px' }}
              >
                <option value="Letter">Letter (recommended) - 11" x 8.5"</option>
                <option value="A4">A4 (EU) - 297 x 210mm</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Spacing', key: 'spineSpacing' },
                { label: 'Page W', key: 'pageWidth' },
                { label: 'Page H', key: 'pageHeight' },
                { label: 'M. Top', key: 'marginTop' },
                { label: 'M. Left', key: 'marginLeft' },
                { label: 'M. Right', key: 'marginRight' }
              ].map(item => (
                <div key={item.key}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', color: '#333' }}>{item.label}</label>
                  <input type="number" step="0.01" value={config[item.key]}
                    onChange={e => setConfig({ ...config, [item.key]: parseFloat(e.target.value) || 0 })}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            {/* MEDIDAS POR TIPO DE CAJA (solo los formatos de la selección) */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: PALETTE.primaryDark, marginBottom: '8px' }}>SPINE SIZE BY CASE (mm)</div>
              {usedFormats.map(fmt => (
                <div key={fmt} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{FORMAT_PROFILES[fmt].label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#555' }}>W</label>
                    <input type="number" step="0.1" value={sizes[fmt].width} onChange={e => updateSize(fmt, 'width', e.target.value)} style={inputStyle} />
                    <label style={{ fontSize: '10px', color: '#555' }}>H</label>
                    <input type="number" step="0.5" value={sizes[fmt].height} onChange={e => updateSize(fmt, 'height', e.target.value)} style={inputStyle} />
                    <button onClick={() => resetSize(fmt)} style={{ backgroundColor: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: '3px', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>RESET</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <p>{isGenerating ? "📥 Downloading from Cloudflare..." : "Generating preview..."}</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DESCARGA Y DONACIÓN */}
      {showSupportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#161b22', padding: '40px', borderRadius: '12px', width: '500px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', border: `2px solid ${PALETTE.primary}` }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>📄</div>
            <h2 style={{ color: PALETTE.highlight, marginBottom: '10px', fontFamily: '"Press Start 2P", monospace', fontSize: '14px', lineHeight: '1.5' }}>PDF DOWNLOADED!</h2>
            <div style={{ backgroundColor: '#0d1117', padding: '20px', borderRadius: '8px', marginTop: '25px', marginBottom: '25px', border: '1px solid #333' }}>
              <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Maintaining <b>The Spine Archive</b> is completely free for the community, but as a student, I cannot afford the server and database costs alone.
                <br /><br />
                If this tool has been useful for your collection, <b>consider helping me pay the server bill</b> so the project can keep growing. ❤️
              </p>
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '25px' }}>
              <a href="https://ko-fi.com/martineo" target="_blank" rel="noreferrer" style={{ background: '#FF5E5B', color: 'white', padding: '15px 25px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', flex: 1 }}>
                ☕ Support on Ko-fi
              </a>
            </div>
            <button onClick={() => setShowSupportModal(false)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
              Close and return to the application
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONSEJOS DE IMPRESIÓN */}
      {showPrintGuideModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#161b22', padding: '30px', borderRadius: '12px', width: '650px', textAlign: 'left', border: `2px solid ${PALETTE.highlight}`, color: '#fff', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: PALETTE.highlight, fontFamily: '"Press Start 2P", monospace', fontSize: '13px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
              ⚠️ PRINT TROUBLESHOOTING & TIPS
            </h2>
            <div style={{ backgroundColor: '#0d1117', padding: '15px', borderRadius: '6px', borderLeft: `4px solid ${PALETTE.primary}`, marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#ddd', lineHeight: '1.5' }}>
                <b>Each spine is printed at the size of its own case type</b> (PlayStation, Xbox, DS/3DS...). You can fine-tune the width and height of each case type in the panel on the right; your values are remembered in this browser.
              </p>
            </div>
            <ul style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '20px' }}>
              <li>Always print at exactly <b>100%</b> / <b>"Actual Size"</b>, and disable <i>"Fit to page"</i> options.</li>
              <li>Print one test spine on plain paper and slide it into a real case before your final run.</li>
              <li>Case sizes can vary by region (e.g. European 3DS cases are thicker than North American ones).</li>
            </ul>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setShowPrintGuideModal(false)} style={{ background: PALETTE.highlight, color: '#000', border: '2px solid #fff', padding: '12px 30px', fontFamily: '"Press Start 2P", monospace', fontSize: '11px', cursor: 'pointer', boxShadow: '3px 3px 0px #000' }}>
                GOT IT, THANKS!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomPrinterView;
