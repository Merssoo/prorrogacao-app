import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error.util';

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

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
  ) {}

  goBack(): void {
    this.router.navigateByUrl('/login');
  }

  submit(): void {
    if (this.loading) return;

    if (!this.name || !this.email || !this.password) {
      this.showError('Preencha todos os campos.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.showError('As senhas não coincidem.');
      return;
    }

    this.loading = true;
    this.authService.register({ name: this.name, email: this.email, password: this.password }).subscribe({
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
