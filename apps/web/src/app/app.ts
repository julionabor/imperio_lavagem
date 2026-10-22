import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { PmAssistant } from './features/assistant/pm-assistant/pm-assistant';
import { PmCookieBanner } from './shared/ui/pm-cookie-banner/pm-cookie-banner';

@Component({
  selector: 'pm-root',
  standalone: true,
  imports: [RouterOutlet, PmAssistant, PmCookieBanner],
  template: `
    <router-outlet />
    @if (!isAdmin()) {
      <pm-assistant />
      <pm-cookie-banner />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);

  protected readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.startsWith('/admin')),
      startWith(false),
    ),
    { initialValue: false },
  );
}
