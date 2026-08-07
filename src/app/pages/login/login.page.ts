import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import { take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { getErrorCode, getErrorMessage } from '../../shared/http-error.util';

const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements ViewWillEnter {
  email = '';
  password = '';
  loading = false;
  checkingSession = true;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
    this.checkingSession = true;
    this.authService
      .isAuthenticated()
      .pipe(take(1))
      .subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          this.checkingSession = false;
          return;
        }
        this.profileService.getMyProfile().subscribe({
          next: (profile) => this.router.navigateByUrl(profile ? '/home' : '/profile'),
          error: () => {
            this.checkingSession = false;
          },
        });
      });
  }

  login(): void {
    if (!this.email || !this.password || this.loading) return;

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigateByUrl(response.profileCreated ? '/hub' : '/profile');
      },
      error: (error) => {
        this.loading = false;
        if (this.isEmailNotVerified(error)) {
          this.router.navigateByUrl('/verify-email', { state: { email: this.email } });
          return;
        }
        this.showError(getErrorMessage(error, 'Não foi possível entrar. Verifique seus dados e tente novamente.'));
      },
    });
  }

  goToRegister(): void {
    this.router.navigateByUrl('/register');
  }

  goToForgotPassword(): void {
    this.router.navigateByUrl('/forgot-password');
  }

  private isEmailNotVerified(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 403 && getErrorCode(error) === EMAIL_NOT_VERIFIED_CODE;
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
