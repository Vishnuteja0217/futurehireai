import { ComingSoon } from "@/components/landing/ComingSoon";
import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { FeedbackButton } from "@/components/landing/FeedbackButton";
import { Footer } from "@/components/landing/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MarketingHero } from "@/components/landing/MarketingHero";
import { MarketingNavbar } from "@/components/landing/MarketingNavbar";
import { Stats } from "@/components/landing/Stats";

// The landing page at "/" — marketing only. No upload, no analysis.
// The actual product lives at "/app".
export default function Home() {
  return (
    <>
      <MarketingNavbar />

      <main>
        <MarketingHero />
        <Stats />
        <Features />
        <HowItWorks />
        <ComingSoon />
        <CTA />
      </main>

      <Footer />
      <FeedbackButton />
    </>
  );
}