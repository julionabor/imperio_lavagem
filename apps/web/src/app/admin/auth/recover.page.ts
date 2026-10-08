import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthStore } from './auth.store';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmInput } from '../../shared/ui/pm-input/pm-input';

@Component({
  selector: 'pm-recover-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PmButton, PmInput],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div class="w-full max-w-sm">
        <div class="mb-8">
          <a routerLink="/admin/login" class="text-sm text-ink-400 hover:text-ink-200">← Voltar ao login</a>
          <h1 class="mt-4 font-display text-h2 font-semibold text-ink-100">
            {{ token() ? 'Nova password' : 'Recuperar password' }}
          </h1>
        </div>

        @if (!sent()) {
          @if (!token()) {
            <!-- Pedir email -->
            <form [formGroup]="emailForm" (ngSubmit)="onForgot()" class="flex flex-col gap-4">
              <p class="text-sm text-ink-400">Indique o email da sua conta e enviaremos um link para repor a password.</p>
              <pm-input label="Email" type="email" placeholder="admin@privatemotors.pt" formControlName="email" />
              <pm-button type="submit" [loading]="store.loading()">Enviar link</pm-button>
            </form>
          } @else {
            <!-- Definir nova password -->
            <form [formGroup]="resetForm" (ngSubmit)="onReset()" class="flex flex-col gap-4">
              @if (store.error()) {
                <div class="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-sm text-error">
                  {{ store.error() }}
                </div>
              }
              <pm-input label="Nova password" type="password" placeholder="••••••••" formControlName="password" />
              <pm-input label="Confirmar password" type="password" placeholder="••••••••" formControlName="confirm" />
              <pm-button type="submit" [loading]="store.loading()">Guardar password</pm-button>
            </form>
          }
        } @else {
          <div class="rounded-xl border border-success/30 bg-success-bg px-4 py-4 text-sm text-success">
            Email enviado. Verifique a sua caixa de entrada.
          </div>
          <a routerLink="/admin/login" class="mt-4 block text-center text-sm text-red-400 hover:text-red-300">
            Voltar ao login
          </a>
        }
      </div>
    </div>
  `,
})
export class RecoverPage {
  protected readonly store = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  protected readonly sent = signal(false);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly resetForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  protected async onForgot(): Promise<void> {
    if (this.emailForm.invalid) return;
    await this.store.forgotPassword(this.emailForm.getRawValue().email);
    this.sent.set(true);
  }

  protected async onReset(): Promise<void> {
    if (this.resetForm.invalid) return;
    const { password, confirm } = this.resetForm.getRawValue();
    if (password !== confirm) return;
    const ok = await this.store.resetPassword(this.token(), password);
    if (ok) this.sent.set(true);
  }
}
