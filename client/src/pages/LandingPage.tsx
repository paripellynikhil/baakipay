import BaakiPayLogo from '../components/BaakiPayLogo';
import LandingAbout from '../components/landing/LandingAbout';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingHero from '../components/landing/LandingHero';
import LandingHowItWorks from '../components/landing/LandingHowItWorks';
import LandingPricing from '../components/landing/LandingPricing';
import LandingTopBar from '../components/landing/LandingTopBar';

interface LandingPageProps {
  onLogin: () => void;
  onStartTrial: () => void;
}

// Commercial landing page shown to logged-out visitors. Composes the small sections in components/landing.
export default function LandingPage({ onLogin, onStartTrial }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E1B4B]">
      <LandingTopBar onLogin={onLogin} onStartTrial={onStartTrial} />
      <main>
        <div className="border-t border-[#1E1B4B]/10 bg-[#FFFBF2] py-12 md:py-16">
          <LandingHero onLogin={onLogin} onStartTrial={onStartTrial} />
        </div>
        <div className="border-t border-[#1E1B4B]/10 bg-white py-12 md:py-16">
          <LandingHowItWorks />
        </div>
        <div className="border-t border-[#1E1B4B]/10 bg-[#F4F3FF] py-12 md:py-16">
          <LandingFeatures />
        </div>
        <div className="border-t border-[#1E1B4B]/10 bg-white py-12 md:py-16">
          <LandingPricing onStartTrial={onStartTrial} />
        </div>
        <div className="border-t border-[#1E1B4B]/10 bg-[#FFFBF2] py-12 md:py-16">
          <LandingAbout />
        </div>
      </main>
      <footer className="bg-[#1E1B4B] text-white py-12 md:py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
          <BaakiPayLogo variant="dark" />
          <p className="text-white/80">Every rupee, right on time.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="#how-it-works" className="hover:underline">How it works</a>
            <a href="#features" className="hover:underline">Features</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <a href="#about" className="hover:underline">About</a>
            <button type="button" onClick={onLogin} className="hover:underline">Login</button>
          </nav>
          <p className="text-sm text-white/60">© 2026 BaakiPay • Built for Indian neighborhood shops.</p>
        </div>
      </footer>
    </div>
  );
}

