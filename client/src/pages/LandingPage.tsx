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
        <LandingHero onLogin={onLogin} onStartTrial={onStartTrial} />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingPricing onStartTrial={onStartTrial} />
        <LandingAbout />
      </main>
    </div>
  );
}

