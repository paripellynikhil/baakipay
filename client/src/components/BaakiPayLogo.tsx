type BaakiPayLogoProps = {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
};

export function BaakiPayLogo({
  variant = 'light',
  showWordmark = true,
  size = 'sm',
  className = '',
}: BaakiPayLogoProps) {
  const sizeClass = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <img
        src="/baakipay-logo.png"
        alt="BaakiPay"
        className={`${sizeClass} rounded-xl ring-1 ring-amber-400/60 object-cover`}
      />
      {showWordmark && (
        <span className={`${size === 'lg' ? 'text-xl' : 'text-lg'} font-bold`}>
          Baaki
          <span className="text-[#F59E0B]">Pay</span>
        </span>
      )}
    </div>
  );
}

export default BaakiPayLogo;
