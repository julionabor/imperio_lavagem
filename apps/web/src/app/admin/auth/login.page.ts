import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthStore } from './auth.store';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmInput } from '../../shared/ui/pm-input/pm-input';

@Component({
  selector: 'pm-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PmButton, PmInput],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
          <h1 class="font-display text-h1 font-semibold text-ink-100">Private Motors</h1>
          <p class="mt-1 text-sm text-ink-400">Backoffice</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          @if (store.error()) {
            <div class="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-sm text-error">
              {{ store.error() }}
            </div>
          }

          <pm-input
            label="Email"
            type="email"
            placeholder="admin@privatemotors.pt"
            formControlName="email"
            [error]="emailError()"
          />
          <pm-input
            label="Password"
            type="password"
            placeholder="••••••••"
            formControlName="password"
            [error]="passwordError()"
          />

          <pm-button
            type="submit"
            size="lg"
            [loading]="store.loading()"
            [disabled]="form.invalid"
          >
            Entrar
          </pm-button>

          <a routerLink="/admin/recuperar-password" class="text-center text-sm text-ink-400 hover:text-red-400 transition-colors">
            Esqueceu a password?
          </a>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected emailError() {
    const c = this.form.get('email');
    if (c?.touched && c.hasError('required')) return 'Campo obrigatório.';
    if (c?.touched && c.hasError('email')) return 'Email inválido.';
    return '';
  }

  protected passwordError() {
    const c = this.form.get('password');
    if (c?.touched && c.hasError('required')) return 'Campo obrigatório.';
    if (c?.touched && c.hasError('minlength')) return 'Mínimo 8 caracteres.';
    return '';
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, password } = this.form.getRawValue();
    const ok = await this.store.login(email, password);
    if (ok) this.router.navigate(['/admin']);
  }
}
