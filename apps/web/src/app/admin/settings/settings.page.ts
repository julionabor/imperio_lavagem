import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface SiteSettingsAdmin {
  id: string;
  companyName: string | null;
  email: string | null;
  phones: string[];
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  mondayHours: string | null;
  saturdayHours: string | null;
  sundayHours: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  newBadgeDays: number;
}

@Component({
  selector: 'pm-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-h2 font-display font-bold mb-6">Definições do site</h1>

    @if (loading()) {
      <div class="space-y-3 max-w-2xl">
        @for (i of [1,2,3,4,5]; track i) {
          <div class="h-10 rounded-lg bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else if (data()) {
      <form (submit)="save($event)" class="max-w-2xl flex flex-col gap-6">
        <!-- Empresa -->
        <section>
          <h2 class="text-label font-semibold text-ink-400 uppercase tracking-[.08em] mb-3">Empresa</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Nome da empresa</label>
              <input name="companyName" [value]="data()!.companyName ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Email</label>
              <input name="email" type="email" [value]="data()!.email ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Telefone principal</label>
              <input name="phone" [value]="data()!.phones[0] ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">WhatsApp (número E.164)</label>
              <input name="whatsapp" [value]="data()!.whatsapp ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
          </div>
        </section>

        <!-- Morada -->
        <section>
          <h2 class="text-label font-semibold text-ink-400 uppercase tracking-[.08em] mb-3">Morada</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-caption text-ink-500">Morada</label>
              <input name="address" [value]="data()!.address ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Cidade</label>
              <input name="city" [value]="data()!.city ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Código postal</label>
              <input name="postalCode" [value]="data()!.postalCode ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Latitude</label>
              <input name="lat" type="number" step="any" [value]="data()!.lat ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Longitude</label>
              <input name="lng" type="number" step="any" [value]="data()!.lng ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
          </div>
        </section>

        <!-- Horário -->
        <section>
          <h2 class="text-label font-semibold text-ink-400 uppercase tracking-[.08em] mb-3">Horário</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Seg–Sex</label>
              <input name="mondayHours" placeholder="09:00–18:00" [value]="data()!.mondayHours ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Sábado</label>
              <input name="saturdayHours" placeholder="09:00–13:00" [value]="data()!.saturdayHours ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Domingo</label>
              <input name="sundayHours" placeholder="Fechado" [value]="data()!.sundayHours ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
          </div>
        </section>

        <!-- SEO -->
        <section>
          <h2 class="text-label font-semibold text-ink-400 uppercase tracking-[.08em] mb-3">SEO por defeito</h2>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Título SEO</label>
              <input name="seoTitle" [value]="data()!.seoTitle ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Descrição SEO</label>
              <textarea name="seoDescription" rows="2" [value]="data()!.seoDescription ?? ''"
                        class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                               resize-none focus:outline-none focus:border-red-500 transition-colors"></textarea>
            </div>
          </div>
        </section>

        <!-- Redes sociais -->
        <section>
          <h2 class="text-label font-semibold text-ink-400 uppercase tracking-[.08em] mb-3">Redes sociais</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Facebook</label>
              <input name="facebook" [value]="data()!.facebook ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">Instagram</label>
              <input name="instagram" [value]="data()!.instagram ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-caption text-ink-500">YouTube</label>
              <input name="youtube" [value]="data()!.youtube ?? ''"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors w-full"/>
            </div>
          </div>
        </section>

        <div class="flex gap-3">
          <button type="submit"
                  [disabled]="saving()"
                  class="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-label
                         hover:bg-red-600 disabled:opacity-50 transition-all">
            {{ saving() ? 'A guardar…' : 'Guardar' }}
          </button>
          @if (saved()) {
            <span class="flex items-center text-green-400 text-label">Guardado!</span>
          }
        </div>
      </form>
    }
  `,
})
export class SettingsPage implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly data = signal<SiteSettingsAdmin | null>(null);

  ngOnInit() {
    this.http.get<SiteSettingsAdmin>('/api/v1/admin/settings').subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected save(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? '';

    const payload: Record<string, unknown> = {
      companyName: get('companyName') || null,
      email: get('email') || null,
      phones: [get('phone')].filter(Boolean),
      whatsapp: get('whatsapp') || null,
      address: get('address') || null,
      city: get('city') || null,
      postalCode: get('postalCode') || null,
      lat: get('lat') ? parseFloat(get('lat')) : null,
      lng: get('lng') ? parseFloat(get('lng')) : null,
      mondayHours: get('mondayHours') || null,
      saturdayHours: get('saturdayHours') || null,
      sundayHours: get('sundayHours') || null,
      seoTitle: get('seoTitle') || null,
      seoDescription: get('seoDescription') || null,
      facebook: get('facebook') || null,
      instagram: get('instagram') || null,
      youtube: get('youtube') || null,
    };

    this.saving.set(true);
    this.http.put<SiteSettingsAdmin>('/api/v1/admin/settings', payload).subscribe({
      next: (d) => {
        this.data.set(d);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
      error: () => this.saving.set(false),
    });
  }
}
