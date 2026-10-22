import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';
import { SiteStore } from '../search/data-access/site.store';
import { SeoService } from '../../core/services/seo.service';
import { PmHeader } from '../../core/layout/pm-header/pm-header';
import { PmFooter } from '../../core/layout/pm-footer/pm-footer';

interface LegalPageData {
  slug: string;
  title: string;
  body: string;
  bodyHtml: string;
  updatedAt: string;
}

@Component({
  selector: 'pm-legal-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PmHeader, PmFooter],
  template: `
    <pm-header [nav]="siteStore.nav()" [settings]="siteStore.settings()" />

    <main class="min-h-screen bg-ink-950 text-white">
      <div class="max-w-3xl mx-auto px-6 py-12 pb-20">

        @if (loading()) {
          <div class="animate-pulse space-y-4">
            <div class="h-10 bg-ink-800 rounded w-2/5"></div>
            <div class="h-4 bg-ink-800 rounded w-full"></div>
            <div class="h-4 bg-ink-800 rounded w-4/5"></div>
            <div class="h-4 bg-ink-800 rounded w-full"></div>
          </div>
        } @else if (page()) {
          <h1 class="text-h1 font-display font-black mb-8 text-balance">
            {{ page()!.title }}
          </h1>
          <div
            class="text-ink-300 text-[16px] leading-relaxed
                   [&_h2]:text-white [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3
                   [&_h3]:text-white [&_h3]:font-medium [&_h3]:text-[17px] [&_h3]:mt-6 [&_h3]:mb-2
                   [&_p]:mb-4
                   [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                   [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                   [&_li]:mb-1
                   [&_a]:text-red-400 [&_a]:underline [&_a:hover]:text-red-300
                   [&_strong]:text-white [&_strong]:font-semibold
                   [&_hr]:border-ink-800 [&_hr]:my-8"
            [innerHTML]="safeHtml()"
          ></div>
          <p class="mt-12 text-[13px] text-ink-600 border-t border-ink-800 pt-6">
            Última atualização: {{ formatDate(page()!.updatedAt) }}
          </p>
        } @else {
          <p class="text-ink-400">Conteúdo não disponível.</p>
        }

      </div>
    </main>

    <pm-footer [nav]="siteStore.nav()" [settings]="siteStore.settings()" />
  `,
})
export class LegalPage implements OnInit {
  protected readonly siteStore = inject(SiteStore);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly loading = signal(true);
  protected readonly page = signal<LegalPageData | null>(null);

  protected readonly safeHtml = computed((): SafeHtml => {
    const html = this.page()?.bodyHtml ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  ngOnInit() {
    this.siteStore.load();
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    this.http.get<LegalPageData>(`/api/v1/public/pages/${slug}`)
      .pipe(catchError(() => EMPTY))
      .subscribe((data) => {
        this.page.set(data);
        this.loading.set(false);
        this.seo.set({
          title: `${data.title} | Private Motors`,
          description: `${data.title} da Private Motors.`,
          path: `/${slug}`,
        });
      });

    if (!this.page()) {
      this.loading.set(false);
    }
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long' }).format(new Date(iso));
  }
}
