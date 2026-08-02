import { Component, OnDestroy, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error.util';
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, isValidPassword } from '../../shared/validation.util';
import { CodeInputComponent } from '../../shared/components/code-input/code-input.component';

type Step = 'email' | 'code' | 'password';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

@Component({
  standalone: false,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnDestroy {
  step: Step = 'email';

  email = '';
  emailTouched = false;

  code = '';

  newPassword = '';
  confirmPassword = '';
  newPasswordTouched = false;
  confirmPasswordTouched = false;

  loading = false;
  resending = false;
  secondsUntilResend = RESEND_COOLDOWN_SECONDS;

  @ViewChild(CodeInputComponent) private codeInput?: CodeInputComponent;

  private resetToken = '';
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
  ) {}

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  get stepTitle(): string {
    if (this.step === 'code') return 'CONFIRMAR CÓDIGO';
    if (this.step === 'password') return 'NOVA SENHA';
    return 'ESQUECI A SENHA';
  }

  get emailError(): string | null {
    if (!this.emailTouched) return null;
    if (!this.email) return 'Informe seu e-mail.';
    return EMAIL_PATTERN.test(this.email) ? null : 'E-mail inválido.';
  }

  get newPasswordError(): string | null {
    if (!this.newPasswordTouched) return null;
    if (!this.newPassword) return 'Informe uma senha.';
    return isValidPassword(this.newPassword)
      ? null
      : `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  get confirmPasswordError(): string | null {
    if (!this.confirmPasswordTouched) return null;
    if (!this.confirmPassword) return 'Confirme sua nova senha.';
    return this.confirmPassword === this.newPassword ? null : 'As senhas não coincidem.';
  }

  get isEmailStepValid(): boolean {
    return EMAIL_PATTERN.test(this.email);
  }

  get isPasswordStepValid(): boolean {
    return isValidPassword(this.newPassword) && this.confirmPassword === this.newPassword;
  }

  get timeUntilResend(): string {
    const minutes = Math.floor(this.secondsUntilResend / 60);
    const seconds = this.secondsUntilResend % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    if (this.step === 'code') {
      this.backToEmailStep();
      return;
    }
    if (this.step === 'password') {
      this.backToCodeStep();
      return;
    }
    this.router.navigateByUrl('/login');
  }

  submitEmail(): void {
    if (this.loading || !this.isEmailStepValid) return;

    this.loading = true;
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'code';
        this.startCountdown();
        setTimeout(() => this.codeInput?.focusFirst());
      },
      error: (error) => {
        this.loading = false;
        this.showError(getErrorMessage(error, 'Não foi possível enviar o código. Tente novamente.'));
      },
    });
  }

  confirmCode(): void {
    if (this.code.length !== CODE_LENGTH || this.loading) return;

    this.loading = true;
    this.authService.verifyForgotPasswordCode({ email: this.email, code: this.code }).subscribe({
      next: (response) => {
        this.loading = false;
        this.resetToken = response.resetToken;
        this.step = 'password';
      },
      error: (error) => {
        this.loading = false;
        this.codeInput?.clear();
        this.showError(getErrorMessage(error, 'Código inválido ou expirado.'));
      },
    });
  }

  resend(): void {
    if (this.secondsUntilResend > 0 || this.resending) return;

    this.resending = true;
    this.authService.resendForgotPasswordCode({ email: this.email }).subscribe({
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

  submitNewPassword(): void {
    if (this.loading || !this.isPasswordStepValid) return;

    this.loading = true;
    this.authService.resetPassword({ resetToken: this.resetToken, newPassword: this.newPassword }).subscribe({
      next: async () => {
        this.loading = false;
        await this.showToast('Senha redefinida com sucesso. Faça login com sua nova senha.', 'success');
        this.router.navigateByUrl('/login');
      },
      error: (error) => {
        this.loading = false;
        this.showError(getErrorMessage(error, 'Não foi possível redefinir sua senha. Tente novamente.'));
        if (this.isResetTokenRejected(error)) {
          this.backToCodeStep();
        }
      },
    });
  }

  private isResetTokenRejected(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private backToEmailStep(): void {
    this.step = 'email';
    this.code = '';
    this.resending = false;
    this.stopCountdown();
  }

  private backToCodeStep(): void {
    this.step = 'code';
    this.resetToken = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.newPasswordTouched = false;
    this.confirmPasswordTouched = false;
    this.codeInput?.clear();
  }

  private startCountdown(): void {
    this.secondsUntilResend = RESEND_COOLDOWN_SECONDS;
    this.stopCountdown();
    this.intervalId = setInterval(() => {
      this.secondsUntilResend = Math.max(0, this.secondsUntilResend - 1);
      if (this.secondsUntilResend === 0) this.stopCountdown();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  private async showError(message: string): Promise<void> {
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: 'danger' | 'success'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}
