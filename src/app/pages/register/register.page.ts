import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonModal, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error.util';
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from '../../shared/validation.util';

interface IonScrollEvent {
  detail: { scrollTop: number };
  target: HTMLIonContentElement;
}

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;

  acceptedTerms = false;
  hasReadTermsToBottom = false;

  nameTouched = false;
  emailTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
  ) {}

  get nameError(): string | null {
    if (!this.nameTouched) return null;
    return this.name.trim() ? null : 'Informe seu nome.';
  }

  get emailError(): string | null {
    if (!this.emailTouched) return null;
    if (!this.email) return 'Informe seu e-mail.';
    return EMAIL_PATTERN.test(this.email) ? null : 'E-mail inválido.';
  }

  get passwordError(): string | null {
    if (!this.passwordTouched) return null;
    if (!this.password) return 'Informe uma senha.';
    return this.password.length >= MIN_PASSWORD_LENGTH
      ? null
      : `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  get confirmPasswordError(): string | null {
    if (!this.confirmPasswordTouched) return null;
    if (!this.confirmPassword) return 'Confirme sua senha.';
    return this.confirmPassword === this.password ? null : 'As senhas não coincidem.';
  }

  get isFormValid(): boolean {
    return (
      this.name.trim().length > 0 &&
      EMAIL_PATTERN.test(this.email) &&
      this.password.length >= MIN_PASSWORD_LENGTH &&
      this.confirmPassword === this.password &&
      this.acceptedTerms
    );
  }

  goBack(): void {
    this.router.navigateByUrl('/login');
  }

  onTermsScroll(event: IonScrollEvent): void {
    const scrollTop = event.detail.scrollTop;
    event.target.getScrollElement().then((el) => {
      const reachedBottom = el.scrollHeight - scrollTop <= el.clientHeight + 20;
      if (reachedBottom) {
        this.hasReadTermsToBottom = true;
      }
    });
  }

  resetTermsScroll(): void {
    this.hasReadTermsToBottom = false;
  }

  acceptTerms(modal: IonModal): void {
    this.acceptedTerms = true;
    modal.dismiss();
  }

  submit(): void {
    if (this.loading || !this.isFormValid) return;

    this.loading = true;
    this.authService
      .register({
        name: this.name,
        email: this.email,
        password: this.password,
        acceptedTerms: this.acceptedTerms,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/verify-email', { state: { email: this.email } });
        },
        error: (error) => {
          this.loading = false;
          this.showError(getErrorMessage(error, 'Não foi possível criar a conta. Tente novamente.'));
        },
      });
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
