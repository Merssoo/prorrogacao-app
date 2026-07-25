import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SorteioTeam } from '../../shared/components/team-column/team-column.component';

@Component({
  standalone: false,
  selector: 'app-sorteio',
  templateUrl: './sorteio.page.html',
  styleUrls: ['./sorteio.page.scss'],
})
export class SorteioPage {
  readonly timeA: SorteioTeam = {
    nome: 'TIME A',
    cor: '#F5C542',
    soma: 51,
    players: [
      { nome: 'Marcão', pos: 'GOL', nota: 8 },
      { nome: 'Tota', pos: 'ZAG', nota: 7 },
      { nome: 'Dedé', pos: 'LAT', nota: 6 },
      { nome: 'Júnior', pos: 'VOL', nota: 8 },
      { nome: 'Caco', pos: 'MEI', nota: 9 },
      { nome: 'Léo', pos: 'ATA', nota: 7 },
      { nome: 'Rafa', pos: 'ZAG', nota: 6 },
    ],
  };

  readonly timeB: SorteioTeam = {
    nome: 'TIME B',
    cor: '#8FB4FF',
    soma: 50,
    players: [
      { nome: 'Zé Luiz', pos: 'GOL', nota: 7 },
      { nome: 'Betão', pos: 'ZAG', nota: 8 },
      { nome: 'Nino', pos: 'LAT', nota: 6 },
      { nome: 'PH', pos: 'VOL', nota: 7 },
      { nome: 'Nando', pos: 'MEI', nota: 8 },
      { nome: 'Bill', pos: 'ATA', nota: 8 },
      { nome: 'Kadu', pos: 'ATA', nota: 6 },
    ],
  };

  constructor(private readonly router: Router) {}

  voltar(): void {
    this.router.navigateByUrl('/evento');
  }
}
