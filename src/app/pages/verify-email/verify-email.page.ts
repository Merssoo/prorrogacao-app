import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error.util';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

@Component({
  standalone: false,
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
})
export class VerifyEmailPage implements OnInit, OnDestroy {
  digits: string[] = new Array(CODE_LENGTH).fill('');
  email = '';
  loading = false;
  resending = false;
  secondsUntilResend = RESEND_COOLDOWN_SECONDS;

  @ViewChildren('digitInput') private digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state as { email?: string } | undefined;
    this.email = state?.email ?? (history.state as { email?: string } | undefined)?.email ?? '';
  }

  ngOnInit(): void {
    if (!this.email) {
      this.router.navigateByUrl('/register');
      return;
    }
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  trackByIndex(index: number): number {
    return index;
  }

  get timeUntilResend(): string {
    const minutes = Math.floor(this.secondsUntilResend / 60);
    const seconds = this.secondsUntilResend % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Teclados virtuais (principalmente Android) não disparam `keydown` de forma
  // confiável — usamos o `inputType` do próprio evento `input`, que é o sinal
  // confiável em qualquer teclado (físico, virtual ou IME).
  onDigitInput(i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputType = (event as InputEvent).inputType;

    if (inputType?.startsWith('delete')) {
      this.digits[i] = '';
      input.value = '';
      if (i > 0) {
        this.focusDigit(i - 1);
      }
      return;
    }

    const raw = input.value.replace(/\D/g, '');

    if (raw.length > 1) {
      // Autofill/one-time-code do sistema jogou o código inteiro numa caixa só.
      this.fillFrom(0, raw);
      return;
    }

    this.digits[i] = raw;
    input.value = raw;
    if (raw && i < this.digits.length - 1) {
      this.focusDigit(i + 1);
    }
  }

  onDigitKeydown(i: number, event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' && i > 0) {
      event.preventDefault();
      this.focusDigit(i - 1);
      return;
    }
    if (event.key === 'ArrowRight' && i < this.digits.length - 1) {
      event.preventDefault();
      this.focusDigit(i + 1);
    }
  }

  onDigitsPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digitsOnly = pasted.replace(/\D/g, '');
    if (!digitsOnly) return;

    event.preventDefault();
    this.fillFrom(0, digitsOnly);
  }

  goBack(): void {
    this.router.navigateByUrl('/register');
  }

  confirm(): void {
    const code = this.digits.join('');
    if (code.length !== CODE_LENGTH || this.loading) return;

    this.loading = true;
    this.authService.verifyEmail({ email: this.email, code }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/login');
      },
      error: (error) => {
        this.loading = false;
        this.showError(getErrorMessage(error, 'Código inválido ou expirado.'));
      },
    });
  }

  resend(): void {
    if (this.secondsUntilResend > 0 || this.resending) return;

    this.resending = true;
    this.authService.resendCode({ email: this.email }).subscribe({
      next: () => {
        this.resending = false;
        this.startCountdown();
      },
      error: (error) => {
        this.resending = false;
        this.showError(getErrorMessage(error, 'Não foi possível reenviar o código.'));
      },
    });
  }

  private fillFrom(startIndex: number, code: string): void {
    const chars = code.split('').slice(0, this.digits.length - startIndex);
    chars.forEach((digit, offset) => {
      this.digits[startIndex + offset] = digit;
    });
    const lastFilledIndex = startIndex + chars.length - 1;
    this.focusDigit(Math.min(lastFilledIndex + 1, this.digits.length - 1));
  }

  // Adiado pro próximo tick: mudar o foco no meio do próprio evento de input
  // pode colidir com a composição do teclado virtual e causar caracteres
  // duplicados/perdidos na caixa seguinte.
  private focusDigit(index: number): void {
    setTimeout(() => {
      const target = this.digitInputs.get(index)?.nativeElement;
      target?.focus();
      target?.select();
    });
  }

  private startCountdown(): void {
    this.secondsUntilResend = RESEND_COOLDOWN_SECONDS;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.secondsUntilResend = Math.max(0, this.secondsUntilResend - 1);
      if (this.secondsUntilResend === 0 && this.intervalId) clearInterval(this.intervalId);
    }, 1000);
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
