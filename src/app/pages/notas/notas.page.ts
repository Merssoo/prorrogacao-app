import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface AtletaNota {
  nome: string;
  pos: string;
  ini: string;
}

@Component({
  standalone: false,
  selector: 'app-notas',
  templateUrl: './notas.page.html',
  styleUrls: ['./notas.page.scss'],
})
export class NotasPage {
  readonly players: AtletaNota[] = [
    { nome: 'Marcão', pos: 'GOL', ini: 'MG' },
    { nome: 'Tota', pos: 'ZAG', ini: 'TÔ' },
    { nome: 'Caco', pos: 'MEI', ini: 'CA' },
    { nome: 'Léo', pos: 'ATA', ini: 'LÉ' },
  ];

  notas: Record<number, number> = { 0: 8, 1: 7, 2: 9, 3: 6 };

  readonly ratingScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(private readonly router: Router) {}

  setNota(i: number, n: number): void {
    this.notas[i] = n;
  }

  voltar(): void {
    this.router.navigateByUrl('/home');
  }
}
