export const landingNavLinks = [
  ["Home", "#home"],
  ["About", "#about"],
  ["Services", "#services"],
  ["Contact", "#contact"],
] as const;

export const logos = [
  { src: "/figma/flutterwave.svg", alt: "Flutterwave", width: 165, height: 32 },
  { src: "/figma/relume.svg", alt: "Relume", width: 140, height: 56 },
  { src: "/figma/piggyvest.svg", alt: "Piggyvest", width: 160, height: 31 },
  { src: "/figma/relume.svg", alt: "Relume", width: 140, height: 56 },
  { src: "/figma/google-pay.svg", alt: "Google Pay", width: 85, height: 34 },
  { src: "/figma/relume.svg", alt: "Relume", width: 140, height: 56 },
] as const;

export const avatars = ["/figma/avatar-1.png", "/figma/avatar-2.png", "/figma/avatar-3.png", "/figma/avatar-4.png"] as const;

export const projectCards = [
  {
    priority: "Medium",
    title: "Design Systems & Components",
    body: "Create design systems and components for website and mobile.",
    tone: "blue",
  },
  {
    priority: "Low",
    title: "User Flow Diagram",
    body: "Create and analyze user flow for both mobile and website.",
    tone: "green",
  },
  {
    priority: "High",
    title: "NFT Illustrations",
    body: "Create NFT illustrations based on the mood board given.",
    tone: "orange",
  },
  {
    priority: "Low",
    title: "Branding for Meta",
    body: "Create full presentation for career coach app.",
    tone: "green",
  },
] as const;

export const footerLinks = ["About Us", "Contact", "Services", "Careers", "Associates"] as const;

export type ProjectCard = (typeof projectCards)[number];
