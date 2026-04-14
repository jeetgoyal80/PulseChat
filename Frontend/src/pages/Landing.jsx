import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import AISection from '@/components/landing/AISection';
import CallingSection from '@/components/landing/CallingSection';
import PrivacySection from '@/components/landing/PrivacySection';
import Footer from '@/components/landing/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <AISection />
      <CallingSection />
      <PrivacySection />
      <Footer />
    </div>
  );
};

export default Landing;
