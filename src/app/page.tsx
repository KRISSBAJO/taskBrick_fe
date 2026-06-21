import {
  AgentHeroSection,
  AgentUseCasesSection,
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
    <main className="min-h-dvh overflow-hidden bg-[#fffdf3] text-[#111111]">
      <LandingNav />
      <AgentHeroSection />
      <TrustedCompanies />
      <FeatureHighlights />
      <ServicesSection />
      <WorkflowAutomationSection />
      <AgentUseCasesSection />
      <ProjectGlance />
      <ReliabilitySection />
      <TestimonialsSection />
      <LandingFooter />
    </main>
  );
}
