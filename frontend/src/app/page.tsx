import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Provenance from "@/components/Provenance";
import Network from "@/components/Network";
import SocialProof from "@/components/SocialProof";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <Provenance />
        <Network />
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
