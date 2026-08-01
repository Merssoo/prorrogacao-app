import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error.util';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
  ) {}

  login(): void {
    if (!this.email || !this.password || this.loading) return;

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigateByUrl(response.profileCreated ? '/home' : '/profile');
      },
      error: (error) => {
        this.loading = false;
        this.showError(getErrorMessage(error, 'Não foi possível entrar. Verifique seus dados e tente novamente.'));
      },
    });
  }

  goToRegister(): void {
    this.router.navigateByUrl('/register');
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
