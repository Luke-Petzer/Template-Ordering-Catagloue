"use client";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
}: QuantityStepperProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };
  const increment = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white w-fit">
      <button
        type="button"
        onClick={decrement}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-slate-900 hover:bg-gray-50 transition-colors"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min) onChange(max !== undefined ? Math.min(n, max) : n);
        }}
        className="w-12 text-center text-[13px] font-medium border-x border-gray-100 outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={increment}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-slate-900 hover:bg-gray-50 transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
