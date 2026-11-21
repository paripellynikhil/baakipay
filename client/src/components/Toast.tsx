import { useEffect } from 'react';

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (message === null) return undefined;
    const timer = window.setTimeout(onDone, 2500);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (message === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
