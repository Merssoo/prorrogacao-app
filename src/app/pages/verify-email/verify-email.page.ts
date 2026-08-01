import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error.util';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  standalone: false,
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
})
export class VerifyEmailPage implements OnInit, OnDestroy {
  digits: string[] = ['', '', '', '', '', ''];
  email = '';
  loading = false;
  secondsUntilResend = RESEND_COOLDOWN_SECONDS;

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

  get timeUntilResend(): string {
    const minutes = Math.floor(this.secondsUntilResend / 60);
    const seconds = this.secondsUntilResend % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  setDigit(i: number, raw: string): void {
    this.digits[i] = raw.slice(-1);
  }

  goBack(): void {
    this.router.navigateByUrl('/register');
  }

  confirm(): void {
    const code = this.digits.join('');
    if (code.length !== 6 || this.loading) return;

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
    if (this.secondsUntilResend > 0) return;

    this.authService.resendCode({ email: this.email }).subscribe({
      next: () => this.startCountdown(),
      error: (error) => this.showError(getErrorMessage(error, 'Não foi possível reenviar o código.')),
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
