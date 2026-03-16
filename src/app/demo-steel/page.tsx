import SteelMatrixRow from "@/components/demo/SteelMatrixRow";

export const metadata = {
  title: "Steel Matrix Demo | B2B Portal",
  description: "Cascading matrix order flow prototype for complex steel products.",
};

const DEMO_PRODUCTS = [
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
          <p className="text-sm font-bold text-slate-700">Per kg · Excl. VAT</p>
        </div>
      </div>

      {/* ── Column Headers — same grid as SteelMatrixRow ── */}
      <div className="max-w-7xl mx-auto px-6 mb-2">
        <div className="grid grid-cols-12 gap-4 items-center px-4 py-1.5">
          {/* col-span-1 */}
          <div className="col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Image
            </span>
          </div>
          {/* col-span-3 */}
          <div className="col-span-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Product
            </span>
          </div>
          {/* col-span-2 */}
          <div className="col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Dimension (mm)
            </span>
          </div>
          {/* col-span-2 */}
          <div className="col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Thickness
            </span>
          </div>
          {/* col-span-2 */}
          <div className="col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Length (m)
            </span>
          </div>
          {/* col-span-2 */}
          <div className="col-span-2 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Price &amp; Action
            </span>
          </div>
        </div>
      </div>

      {/* ── Matrix Rows ── */}
      <div className="max-w-7xl mx-auto px-6 pb-16 space-y-3">
        <SteelMatrixRow />

        {/* Placeholder skeleton rows */}
        {DEMO_PRODUCTS.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-dashed border-slate-200 rounded-2xl px-4 py-3 opacity-40 select-none"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <div className="w-12 h-12 rounded-lg bg-slate-100" />
              </div>
              <div className="col-span-3 space-y-1.5">
                <div className="h-2.5 w-24 bg-slate-200 rounded-full" />
                <div className="h-3 w-40 bg-slate-100 rounded-full" />
              </div>
              <div className="col-span-2">
                <div className="h-9 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="col-span-2">
                <div className="h-9 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="col-span-2">
                <div className="h-9 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="col-span-2 flex flex-col items-end gap-1.5">
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
                <div className="h-8 w-16 bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Prototype · Static data · Not connected to live database
          </p>
          <p className="text-xs text-slate-400">
            SANS 50025 / EN 10025 Grade S235 / S275
          </p>
        </div>
      </div>
    </main>
  );
}
