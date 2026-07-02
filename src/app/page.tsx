import {
  AgentHeroSection,
  BookDemoFloatingButton,
  FeatureHighlights,
  LandingFooter,
  LandingNav,
  ProjectGlance,
  ReliabilitySection,
  ServicesSection,
  TestimonialsSection,
  TrustedCompanies,
  WorkflowAutomationSection,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#f7f6ef] text-[#111111]">
      <LandingNav />
      <AgentHeroSection />
      <TrustedCompanies />
      <FeatureHighlights />
      <ServicesSection />
      <WorkflowAutomationSection />
      <ProjectGlance />
      <ReliabilitySection />
      <TestimonialsSection />
      <LandingFooter />
      <BookDemoFloatingButton />
    </main>
  );
}
