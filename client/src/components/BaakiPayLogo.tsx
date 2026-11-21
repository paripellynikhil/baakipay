type BaakiPayLogoProps = {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  className?: string;
};

export function BaakiPayLogo({
  variant = 'light',
  showWordmark = true,
  className = '',
}: BaakiPayLogoProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <svg
        viewBox="0 0 100 100"
        width="32"
        height="32"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="20"
          fill={isDark ? '#2E2A6B' : '#1E1B4B'}
          stroke={isDark ? '#F59E0B' : 'none'}
          strokeOpacity={isDark ? 0.4 : 0}
          strokeWidth={isDark ? 2 : 0}
        />
        <text
          x="48"
          y="70"
          textAnchor="middle"
          fontSize="60"
          fontWeight="700"
          fill="#FFFFFF"
          fontFamily="Plus Jakarta Sans, Arial, sans-serif"
        >
          ₹
        </text>
        <path d="M62 76 H74 V69 L87 79 L74 89 V82 H62 Z" fill="#F59E0B" />
      </svg>
      {showWordmark && (
        <span className="text-lg font-bold">
          Baaki
          <span className="text-[#F59E0B]">Pay</span>
        </span>
      )}
    </div>
  );
}

export default BaakiPayLogo;
