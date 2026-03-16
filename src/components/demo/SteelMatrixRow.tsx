"use client";

import { useState, useRef } from "react";
import { ShoppingCart, CheckCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Static data model — Equal Angle Grade Mild Steel
// ---------------------------------------------------------------------------

const steelData = {
  name: "Equal Angle Grade Mild Steel",
  pricePerKg: 18.5, // ZAR per Kg
  dimensions: {
    "25 x 25": { "2mm": 0.777, "2.5mm": 0.954, "3mm": 1.114, "4mm": 1.773 },
    "30 x 30": { "2.5mm": 0.953, "3mm": 1.171, "4mm": 1.363, "5mm": 2.18 },
    "40 x 40": { "3mm": 1.285, "4mm": 1.582, "5mm": 1.874, "6mm": 2.417 },
  } as Record<string, Record<string, number>>,
};

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// Hover-to-zoom image
// ---------------------------------------------------------------------------

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left + 16, y: e.clientY - rect.top - 150 });
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-16 h-16 flex-shrink-0 cursor-zoom-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
      />

      {/* Zoom panel */}
      {hovered && (
        <div
          className="absolute z-50 pointer-events-none rounded-xl overflow-hidden border-2 border-slate-300 shadow-2xl"
          style={{ left: pos.x, top: pos.y, width: 300, height: 300 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <CheckCircle className="w-4 h-4" />
      Added to cart!
    </div>
  );
}

// ---------------------------------------------------------------------------
// SteelMatrixRow — the main component
// ---------------------------------------------------------------------------

export default function SteelMatrixRow() {
  const dimensionKeys = Object.keys(steelData.dimensions);
  const [dimension, setDimension] = useState(dimensionKeys[0]);
  const thicknessKeys = Object.keys(steelData.dimensions[dimension]);
  const [thickness, setThickness] = useState(thicknessKeys[0]);
  const [length, setLength] = useState(6);
  const [toastVisible, setToastVisible] = useState(false);

  // When dimension changes, reset thickness to first available option
  const handleDimensionChange = (dim: string) => {
    setDimension(dim);
    const firstThickness = Object.keys(steelData.dimensions[dim])[0];
    setThickness(firstThickness);
  };

  // Live calculations
  const kgPerMeter = steelData.dimensions[dimension]?.[thickness] ?? 0;
  const totalWeight = parseFloat((length * kgPerMeter).toFixed(3));
  const totalPrice = parseFloat((totalWeight * steelData.pricePerKg).toFixed(2));

  const handleAddToCart = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const placeholderImage =
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&auto=format";

  return (
    <div className="relative group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 p-5">
      <div className="flex items-center gap-5 flex-wrap lg:flex-nowrap">

        {/* ── Thumbnail with hover zoom ── */}
        <ZoomableImage src={placeholderImage} alt={steelData.name} />

        {/* ── Product Title ── */}
        <div className="min-w-[180px] flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            Structural Steel
          </p>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            {steelData.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {ZAR.format(steelData.pricePerKg)}/kg
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="hidden lg:block h-12 w-px bg-slate-100 flex-shrink-0" />

        {/* ── Dropdown 1: Dimension ── */}
        <div className="space-y-1 flex-shrink-0">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Dimension (mm)
          </label>
          <select
            value={dimension}
            onChange={(e) => handleDimensionChange(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 cursor-pointer transition-all"
          >
            {dimensionKeys.map((dim) => (
              <option key={dim} value={dim}>
                {dim} mm
              </option>
            ))}
          </select>
        </div>

        {/* ── Dropdown 2: Thickness (cascades from Dimension) ── */}
        <div className="space-y-1 flex-shrink-0">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Thickness
          </label>
          <select
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 cursor-pointer transition-all"
          >
            {thicknessKeys.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* ── Input: Length ── */}
        <div className="space-y-1 flex-shrink-0">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Length (m)
          </label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={length}
            onChange={(e) => setLength(Math.max(0, parseFloat(e.target.value) || 0))}
            className="h-9 w-24 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
        </div>

        {/* ── Divider ── */}
        <div className="hidden lg:block h-12 w-px bg-slate-100 flex-shrink-0" />

        {/* ── Live Calculations ── */}
        <div className="flex-1 min-w-[160px]">
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <div className="flex justify-between items-baseline gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Weight
                </p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {totalWeight.toFixed(2)}
                  <span className="text-xs font-semibold text-slate-500 ml-1">kg</span>
                </p>
              </div>
              <div className="text-slate-300 text-lg font-light">×</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Rate
                </p>
                <p className="text-sm font-semibold text-slate-600 tabular-nums">
                  {ZAR.format(steelData.pricePerKg)}/kg
                </p>
              </div>
              <div className="text-slate-300 text-lg font-light">=</div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                  Total
                </p>
                <p className="text-xl font-black text-emerald-700 tabular-nums">
                  {ZAR.format(totalPrice)}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {kgPerMeter} kg/m · {dimension} mm · {thickness} · {length}m
            </p>
          </div>
        </div>

        {/* ── Add to Cart ── */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="h-11 px-5 bg-slate-900 hover:bg-slate-700 active:scale-[0.97] text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all duration-150"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
          <Toast visible={toastVisible} />
        </div>
      </div>
    </div>
  );
}
