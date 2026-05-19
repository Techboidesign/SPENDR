import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowsOut } from '@phosphor-icons/react';
import { ModalActionBar } from './ModalActionBar';

const CANVAS_SIZE = 290;
const CROP_RADIUS = 118; // circle crop radius in canvas pixels
const MAX_SCALE = 5;

interface Props {
  imageSrc: string;
  onSave: (base64: string) => void;
  onCancel: () => void;
}

export function AvatarCropModal({ imageSrc, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);

  // Drag state
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOx: 0, startOy: 0 });
  // Pinch state
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1, startOx: 0, startOy: 0, cx: 0, cy: 0 });

  /* ── Clamp offset so image always covers the crop circle ── */
  const clamp = useCallback((ox: number, oy: number, s: number, img: HTMLImageElement) => {
    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const cropLeft = CANVAS_SIZE / 2 - CROP_RADIUS;
    const cropTop = CANVAS_SIZE / 2 - CROP_RADIUS;
    const cropRight = CANVAS_SIZE / 2 + CROP_RADIUS;
    const cropBottom = CANVAS_SIZE / 2 + CROP_RADIUS;

    const clampedX = Math.min(cropLeft, Math.max(cropRight - iw, ox));
    const clampedY = Math.min(cropTop, Math.max(cropBottom - ih, oy));
    return { x: clampedX, y: clampedY };
  }, []);

  /* ── Load image and set initial fit ── */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fitScale = Math.max(
        (CROP_RADIUS * 2) / img.naturalWidth,
        (CROP_RADIUS * 2) / img.naturalHeight,
      );
      const s = fitScale * 1.05; // slight zoom-in so image fills the circle
      setMinScale(fitScale);
      setScale(s);
      // Center the image over the crop circle
      const initOffset = {
        x: CANVAS_SIZE / 2 - (img.naturalWidth * s) / 2,
        y: CANVAS_SIZE / 2 - (img.naturalHeight * s) / 2,
      };
      const clamped = clamp(initOffset.x, initOffset.y, s, img);
      setOffset(clamped);
    };
    img.src = imageSrc;
  }, [imageSrc, clamp]);

  /* ── Draw canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * scale, img.naturalHeight * scale);

    // Dark overlay outside crop circle using evenodd fill rule
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);                               // outer (CW)
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2, true); // inner hole (CCW)
    ctx.fill('evenodd');
    ctx.restore();

    // Crop circle border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Rule-of-thirds grid lines inside the circle (subtle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.75;
    for (let i = 1; i <= 2; i++) {
      const x = CANVAS_SIZE / 2 - CROP_RADIUS + (CROP_RADIUS * 2 / 3) * i;
      const y = CANVAS_SIZE / 2 - CROP_RADIUS + (CROP_RADIUS * 2 / 3) * i;
      ctx.beginPath(); ctx.moveTo(x, CANVAS_SIZE / 2 - CROP_RADIUS); ctx.lineTo(x, CANVAS_SIZE / 2 + CROP_RADIUS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_SIZE / 2 - CROP_RADIUS, y); ctx.lineTo(CANVAS_SIZE / 2 + CROP_RADIUS, y); ctx.stroke();
    }
    ctx.restore();
  }, [offset, scale]);

  /* ── Export ── */
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const exportSize = 200;
    const exp = document.createElement('canvas');
    exp.width = exportSize;
    exp.height = exportSize;
    const ctx = exp.getContext('2d');
    if (!ctx) return;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Map crop circle region → image pixel coordinates
    const cropLeft = CANVAS_SIZE / 2 - CROP_RADIUS;
    const cropTop = CANVAS_SIZE / 2 - CROP_RADIUS;
    const cropDiam = CROP_RADIUS * 2;

    const imgX = (cropLeft - offset.x) / scale;
    const imgY = (cropTop - offset.y) / scale;
    const imgW = cropDiam / scale;
    const imgH = cropDiam / scale;

    ctx.drawImage(img, imgX, imgY, imgW, imgH, 0, 0, exportSize, exportSize);

    onSave(exp.toDataURL('image/jpeg', 0.92));
  };

  /* ── Mouse events ── */
  const onMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    dragRef.current = {
      active: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startOx: offset.x,
      startOy: offset.y,
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active || !imgRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - dragRef.current.startX;
    const dy = my - dragRef.current.startY;
    const next = clamp(dragRef.current.startOx + dx, dragRef.current.startOy + dy, scale, imgRef.current);
    setOffset(next);
  };

  const onMouseUp = () => { dragRef.current.active = false; };

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    const newScale = Math.min(MAX_SCALE, Math.max(minScale, scale * factor));
    const scaleRatio = newScale / scale;

    const newOx = mx - scaleRatio * (mx - offset.x);
    const newOy = my - scaleRatio * (my - offset.y);
    const clamped = clamp(newOx, newOy, newScale, img);

    setScale(newScale);
    setOffset(clamped);
  }, [scale, minScale, offset, clamp]);

  /* ── Touch events ── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const rect = canvasRef.current!.getBoundingClientRect();
      dragRef.current = {
        active: true,
        startX: t.clientX - rect.left,
        startY: t.clientY - rect.top,
        startOx: offset.x,
        startOy: offset.y,
      };
      pinchRef.current.active = false;
    } else if (e.touches.length === 2) {
      dragRef.current.active = false;
      const rect = canvasRef.current!.getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = ((t1.clientX + t2.clientX) / 2) - rect.left;
      const cy = ((t1.clientY + t2.clientY) / 2) - rect.top;
      pinchRef.current = { active: true, startDist: dist, startScale: scale, startOx: offset.x, startOy: offset.y, cx, cy };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;

    if (e.touches.length === 1 && dragRef.current.active) {
      const t = e.touches[0];
      const rect = canvasRef.current!.getBoundingClientRect();
      const dx = (t.clientX - rect.left) - dragRef.current.startX;
      const dy = (t.clientY - rect.top) - dragRef.current.startY;
      const next = clamp(dragRef.current.startOx + dx, dragRef.current.startOy + dy, scale, img);
      setOffset(next);
    } else if (e.touches.length === 2 && pinchRef.current.active) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const { startDist, startScale, startOx, startOy, cx, cy } = pinchRef.current;
      const newScale = Math.min(MAX_SCALE, Math.max(minScale, startScale * (dist / startDist)));
      const scaleRatio = newScale / startScale;
      const newOx = cx - scaleRatio * (cx - startOx);
      const newOy = cy - scaleRatio * (cy - startOy);
      const clamped = clamp(newOx, newOy, newScale, img);
      setScale(newScale);
      setOffset(clamped);
    }
  };

  const onTouchEnd = () => {
    dragRef.current.active = false;
    pinchRef.current.active = false;
  };

  return (
    /* Full-screen overlay inside the phone frame */
    <div style={{
      position: 'absolute', inset: 0, zIndex: 400,
      backgroundColor: '#000000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '14px 20px',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          Move & Scale
        </p>
      </div>

      {/* Canvas crop area */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: '0 0 16px',
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            cursor: 'grab',
            borderRadius: 12,
            display: 'block',
            touchAction: 'none',
          }}
        />

        {/* Hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowsOut size={14} weight="light" color="rgba(255,255,255,0.4)" />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Drag to reposition · Pinch or scroll to zoom
          </p>
        </div>

        {/* Zoom slider */}
        <div style={{
          width: CANVAS_SIZE, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', width: 16, textAlign: 'center' }}>−</span>
          <input
            type="range"
            min={minScale}
            max={MAX_SCALE}
            step={0.01}
            value={scale}
            onChange={e => {
              const img = imgRef.current;
              if (!img) return;
              const newScale = parseFloat(e.target.value);
              // Zoom toward center of crop circle
              const cx = CANVAS_SIZE / 2;
              const cy = CANVAS_SIZE / 2;
              const ratio = newScale / scale;
              const newOx = cx - ratio * (cx - offset.x);
              const newOy = cy - ratio * (cy - offset.y);
              const clamped = clamp(newOx, newOy, newScale, img);
              setScale(newScale);
              setOffset(clamped);
            }}
            style={{
              flex: 1, height: 4, accentColor: '#3E37FF',
              cursor: 'pointer', background: 'transparent',
            }}
          />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', width: 16, textAlign: 'center' }}>+</span>
        </div>
      </div>

      <ModalActionBar
        dark
        onLeft={onCancel}
        leftLabel="CANCEL"
        onSave={handleConfirm}
        saveLabel="SAVE"
      />
    </div>
  );
}
