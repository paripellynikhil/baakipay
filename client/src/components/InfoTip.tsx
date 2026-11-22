import { useEffect, useId, useRef, useState } from 'react';

interface InfoTipProps {
  text: string;
  label?: string;
}

// Circular "?" help button that toggles a brand-coloured popover with the given text.
export default function InfoTip({ text, label = 'Help' }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#F59E0B] bg-[#1E1B4B] text-xs font-bold text-white hover:bg-[#F59E0B] hover:text-[#1E1B4B]"
      >
        ?
      </button>
      {open && (
        <span
          id={popId}
          role="tooltip"
          className="absolute left-1/2 top-full z-40 mt-2 block w-56 -translate-x-1/2 rounded-xl border border-[#1E1B4B] border-l-4 border-l-[#F59E0B] bg-white p-3 text-left text-xs leading-snug text-[#1E1B4B] shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
