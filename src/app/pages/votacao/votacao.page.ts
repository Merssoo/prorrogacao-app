import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-votacao',
  templateUrl: './votacao.page.html',
  styleUrls: ['./votacao.page.scss'],
})
export class VotacaoPage {
  readonly opts1 = ['Marcão', 'Caco', 'Léo', 'Júnior'];
  readonly opts2 = ['Bill', 'Nando', 'Kadu', 'Rafa'];
  readonly opts3 = ['Ótimo', 'Bom', 'Regular', 'Ruim'];

  q1 = 'Caco';
  q2 = 'Bill';
  q3 = 'Bom';

  constructor(private readonly router: Router) {}

  voltar(): void {
    this.router.navigateByUrl('/home');
  }
}
