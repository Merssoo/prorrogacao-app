import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  presencaConfirmada = false;

  readonly avatares = ['MG', 'TÔ', 'JR', 'PH', 'CA'];

  constructor(private readonly router: Router) {}

  irParaEvento(): void {
    this.router.navigateByUrl('/evento');
  }

  irParaCriarEvento(): void {
    this.router.navigateByUrl('/criar-evento');
  }

  irParaNotas(): void {
    this.router.navigateByUrl('/notas');
  }

  irParaVotacao(): void {
    this.router.navigateByUrl('/votacao');
  }

  irParaSorteio(): void {
    this.router.navigateByUrl('/sorteio');
  }

  irParaFinanceiro(): void {
    this.router.navigateByUrl('/financeiro');
  }

  alternarPresenca(event: Event): void {
    event.stopPropagation();
    this.presencaConfirmada = !this.presencaConfirmada;
  }
}
