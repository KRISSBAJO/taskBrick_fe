import { apiRequest } from "@/lib/api";

export type MarketingLeadResponse = {
  id: string;
  type: "CONTACT" | "DEMO";
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED" | "ARCHIVED";
  createdAt: string;
  mailSent: boolean;
};

export type ContactRequestInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
  pageUrl?: string;
};

export type DemoRequestInput = {
  name: string;
  email: string;
  company: string;
  phone?: string;
  jobTitle?: string;
  teamSize?: string;
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
  message?: string;
  source?: string;
  pageUrl?: string;
};

export function submitContactRequest(input: ContactRequestInput) {
  return apiRequest<MarketingLeadResponse>("/marketing/contact", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
}

export function submitDemoRequest(input: DemoRequestInput) {
  return apiRequest<MarketingLeadResponse>("/marketing/demo", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
}
