import SteelMatrixRow from "@/components/demo/SteelMatrixRow";

export const metadata = {
  title: "Steel Matrix Demo | B2B Portal",
  description: "Cascading matrix order flow prototype for complex steel products.",
};

// ---------------------------------------------------------------------------
// Additional static products to demonstrate the "matrix" multi-row concept
// ---------------------------------------------------------------------------

const DEMO_PRODUCTS = [
  { id: 1, label: "Equal Angle — Grade Mild Steel" },
  { id: 2, label: "Flat Bar — Grade 300WA" },
  { id: 3, label: "Round Bar — Grade EN8" },
];

export default function DemoSteelPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Top Banner ── */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            PROTOTYPE · READ ONLY
          </p>
          <h1 className="text-xl font-black tracking-tight mt-0.5">
            Cascading Matrix Order Flow
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Demo Mode — No DB Connection
        </span>
      </div>

      {/* ── Page Header ── */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-4">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Structural Steel</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select dimension, thickness, and cut length. Pricing updates live.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Price basis
            </p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">Per kg · Excl. VAT</p>
          </div>
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div className="max-w-7xl mx-auto px-6 mb-2">
        <div className="hidden lg:grid grid-cols-[64px_180px_1px_120px_100px_96px_1px_1fr_160px] gap-5 items-center px-5 py-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Image
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Product
          </span>
          <span />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Dimension
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Thickness
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Length
          </span>
          <span />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Live Pricing
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
            Action
          </span>
        </div>
      </div>

      {/* ── Matrix Rows ── */}
      <div className="max-w-7xl mx-auto px-6 pb-16 space-y-3">
        {/* Currently this prototype shows the Equal Angle product. */}
        {/* In production, map over your products array fetched from Supabase. */}
        <SteelMatrixRow />

        {/* ── Placeholder rows for visual context ── */}
        {DEMO_PRODUCTS.slice(1).map((p) => (
          <div
            key={p.id}
            className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 flex items-center gap-4 opacity-40 select-none"
          >
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3 w-40 bg-slate-200 rounded-full" />
              <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="h-9 w-24 bg-slate-100 rounded-lg" />
              <div className="h-9 w-20 bg-slate-100 rounded-lg" />
              <div className="h-9 w-20 bg-slate-100 rounded-lg" />
              <div className="h-9 w-32 bg-slate-100 rounded-lg" />
            </div>
            <p className="text-xs text-slate-400 font-medium absolute ml-24">{p.label}</p>
          </div>
        ))}
      </div>

      {/* ── Footer note ── */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Prototype · Static data only · Not connected to live database
          </p>
          <p className="text-xs text-slate-400">
            Equal Angle data: SANS 50025 / EN 10025 Grade S235 / S275
          </p>
        </div>
      </div>
    </main>
  );
}
