import { prisma } from '../../shared/prisma-client.ts';

// ── HomeContent (singleton) ───────────────────────────────────────────────

export const getHomeContent = () =>
  prisma.homeContent.findFirst();

export const upsertHomeContent = (data: Parameters<typeof prisma.homeContent.upsert>[0]['create']) =>
  prisma.homeContent.upsert({
    where: { id: (data as { id?: string }).id ?? 'singleton' },
    create: data,
    update: data,
  });

// ── AboutContent (singleton) ──────────────────────────────────────────────

export const getAboutContent = () => prisma.aboutContent.findFirst();

export const upsertAboutContent = (data: Parameters<typeof prisma.aboutContent.upsert>[0]['create']) =>
  prisma.aboutContent.upsert({
    where: { id: (data as { id?: string }).id ?? 'singleton' },
    create: data,
    update: data,
  });

// ── Advantages ────────────────────────────────────────────────────────────

export const listAdvantages = () =>
  prisma.advantage.findMany({ orderBy: { position: 'asc' } });

export const createAdvantage = (data: { icon: string; title: string; text: string; position: number }) =>
  prisma.advantage.create({ data: { ...data, active: true } });

export const updateAdvantage = (id: string, data: Partial<{ icon: string; title: string; text: string; position: number; active: boolean }>) =>
  prisma.advantage.update({ where: { id }, data });

export const deleteAdvantage = (id: string) => prisma.advantage.delete({ where: { id } });

// ── Testimonials ──────────────────────────────────────────────────────────

export const listTestimonials = () =>
  prisma.testimonial.findMany({ orderBy: { position: 'asc' } });

export const createTestimonial = (data: {
  authorName: string; initials: string; text: string;
  vehicleLabel: string; photoUrl?: string; position: number;
}) => prisma.testimonial.create({ data: { ...data, active: true } });

export const updateTestimonial = (id: string, data: Partial<{
  authorName: string; initials: string; text: string;
  vehicleLabel: string; photoUrl: string; position: number; active: boolean;
}>) => prisma.testimonial.update({ where: { id }, data });

export const deleteTestimonial = (id: string) => prisma.testimonial.delete({ where: { id } });

// ── QuickFilters ─────────────────────────────────────────────────────────

export const listQuickFilters = () =>
  prisma.quickFilter.findMany({ orderBy: { position: 'asc' } });

export const createQuickFilter = (data: { label: string; filters: object; position: number }) =>
  prisma.quickFilter.create({ data: { ...data, active: true } });

export const updateQuickFilter = (id: string, data: Partial<{ label: string; filters: object; position: number; active: boolean }>) =>
  prisma.quickFilter.update({ where: { id }, data });

export const deleteQuickFilter = (id: string) => prisma.quickFilter.delete({ where: { id } });

// ── SearchExamples ────────────────────────────────────────────────────────

export const listSearchExamples = () =>
  prisma.searchExample.findMany({ orderBy: { position: 'asc' } });

export const createSearchExample = (data: { text: string; position: number }) =>
  prisma.searchExample.create({ data: { ...data, active: true } });

export const updateSearchExample = (id: string, data: Partial<{ text: string; position: number; active: boolean }>) =>
  prisma.searchExample.update({ where: { id }, data });

export const deleteSearchExample = (id: string) => prisma.searchExample.delete({ where: { id } });

// ── NavItems ──────────────────────────────────────────────────────────────

export const listNavItems = () =>
  prisma.navItem.findMany({ orderBy: { position: 'asc' } });

export const createNavItem = (data: { label: string; route?: string; url?: string; position: number }) =>
  prisma.navItem.create({ data: { ...data, active: true } });

export const updateNavItem = (id: string, data: Partial<{ label: string; route: string; url: string; position: number; active: boolean }>) =>
  prisma.navItem.update({ where: { id }, data });

export const deleteNavItem = (id: string) => prisma.navItem.delete({ where: { id } });

// ── LegalPages ────────────────────────────────────────────────────────────

export const listLegalPages = () => prisma.legalPage.findMany();
export const findLegalPageBySlug = (slug: string) => prisma.legalPage.findUnique({ where: { slug } });

export const upsertLegalPage = (slug: string, data: { title: string; body: string }) =>
  prisma.legalPage.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });
