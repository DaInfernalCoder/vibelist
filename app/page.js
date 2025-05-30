import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DemoSection from "@/components/DemoSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FeaturesGrid from "@/components/FeaturesGrid";
import Problem from "@/components/Problem";
// import Testimonials11 from "@/components/Testimonials11";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <Problem />
        <FeaturesGrid />
        <DemoSection />
        <Pricing />
        <FAQ />
        {/* <Testimonials11 /> */}
        <CTA />
      </main>
      <Footer />
    </>
  );
}
