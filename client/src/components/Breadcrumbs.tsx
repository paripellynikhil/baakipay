interface BreadcrumbsProps {
  homeLabel: string;
  middleLabel?: string;
  currentLabel: string;
  onHome: () => void;
}

// Slim trail shown above the main content on every tab except Home: "Home / <current tab>".
// Optional middleLabel adds a plain-text segment: "Home / <middle> / <current>".
export default function Breadcrumbs({ homeLabel, middleLabel, currentLabel, onHome }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-slate-500">
        <li>
          <button type="button" onClick={onHome} className="cursor-pointer font-semibold text-[#16A34A] hover:underline">
            {homeLabel}
          </button>
        </li>
        <li aria-hidden="true">/</li>
        {middleLabel && (
          <>
            <li className="font-semibold text-slate-600">{middleLabel}</li>
            <li aria-hidden="true">/</li>
          </>
        )}
        <li aria-current="page" className="font-semibold text-[#1E1B4B]">
          {currentLabel}
        </li>
      </ol>
    </nav>
  );
}
