interface BreadcrumbsProps {
  homeLabel: string;
  currentLabel: string;
  onHome: () => void;
}

// Slim trail shown above the main content on every tab except Home: "Home / <current tab>".
export default function Breadcrumbs({ homeLabel, currentLabel, onHome }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-slate-500">
        <li>
          <button type="button" onClick={onHome} className="cursor-pointer font-semibold text-[#16A34A] hover:underline">
            {homeLabel}
          </button>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-semibold text-[#1E1B4B]">
          {currentLabel}
        </li>
      </ol>
    </nav>
  );
}
