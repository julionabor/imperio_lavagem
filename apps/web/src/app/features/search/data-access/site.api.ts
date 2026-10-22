import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { FinancingProduct } from '@pm/libs/contracts';
import type { VehicleListItem } from './vehicles.api';

// ── DTOs do endpoint /public/site ─────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  route: string | null;
  url: string | null;
  position: number;
}

export interface QuickFilter {
  id: string;
  label: string;
  filters: Record<string, unknown>;
  position: number;
}

export interface SearchExample {
  id: string;
  text: string;
  position: number;
}

export interface Advantage {
  id: string;
  icon: string;
  title: string;
  text: string;
  position: number;
}

export interface Testimonial {
  id: string;
  authorName: string;
  initials: string;
  text: string;
  vehicleLabel: string;
  position: number;
}

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  stockTagline: string;
  searchPlaceholder: string;
  modeCarLabel: string;
  modeBudgetLabel: string;
  featuredTitle: string;
  featuredSubtitle: string;
  advantagesTitle: string;
  testimonialsTitle: string;
  assistantCtaTitle: string;
  assistantCtaText: string;
  assistantCtaButton: string;
}

export interface SiteSettings {
  companyName: string;
  address: string;
  postalCode: string;
  locality: string;
  phones: string[];
  email: string;
  whatsapp: string | null;
  openingHours: Record<string, unknown>;
  googleRating: number | null;
  googleReviewCount: number | null;
  googleReviewsUrl: string | null;
  complaintsBookUrl: string | null;
  logoUrl: string | null;
  newBadgeDays: number;
  creditIntermediaryText: string | null;
}

export interface ParserDictionary {
  brands: Array<{ name: string; slug: string; aliases: string[] }>;
  models: Array<{ brandSlug: string; name: string; slug: string; aliases: string[] }>;
  synonyms: Array<{ term: string; maps: string; category: string }>;
}

export interface AssistantStepOption {
  label: string;
  value: string;
  [k: string]: unknown;
}

export interface AssistantStep {
  id: string;
  key: string;
  question: string;
  position: number;
  options: AssistantStepOption[];
}

export interface AssistantSettings {
  id: string;
  active: boolean;
  botName: string | null;
  welcomeMessage: string | null;
  budgetTransitionMessage: string | null;
  confirmationTemplate: string | null;
  steps: AssistantStep[];
}

export interface SiteData {
  settings: SiteSettings;
  homeContent: HomeContent;
  nav: NavItem[];
  advantages: Advantage[];
  testimonials: Testimonial[];
  quickFilters: QuickFilter[];
  searchExamples: SearchExample[];
  stockCount: number;
  financingProduct: FinancingProduct | null;
  parserDictionary: ParserDictionary;
  assistantSettings: AssistantSettings | null;
}

@Injectable({ providedIn: 'root' })
export class SiteApi {
  private readonly http = inject(HttpClient);

  getSiteData() {
    return this.http.get<SiteData>('/api/v1/public/site');
  }

  getFeatured(placement: string) {
    return this.http.get<VehicleListItem[]>(
      `/api/v1/public/featured?placement=${placement}`,
    );
  }
}
