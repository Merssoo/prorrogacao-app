import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DraftTeam } from '../../shared/components/team-column/team-column.component';

@Component({
  standalone: false,
  selector: 'app-draft',
  templateUrl: './draft.page.html',
  styleUrls: ['./draft.page.scss'],
})
export class DraftPage {
  readonly teamA: DraftTeam = {
    name: 'TIME A',
    color: '#F5C542',
    total: 51,
    players: [
      { name: 'Marcão', pos: 'GOL', rating: 8 },
      { name: 'Tota', pos: 'ZAG', rating: 7 },
      { name: 'Dedé', pos: 'LAT', rating: 6 },
      { name: 'Júnior', pos: 'VOL', rating: 8 },
      { name: 'Caco', pos: 'MEI', rating: 9 },
      { name: 'Léo', pos: 'ATA', rating: 7 },
      { name: 'Rafa', pos: 'ZAG', rating: 6 },
    ],
  };

  readonly teamB: DraftTeam = {
    name: 'TIME B',
    color: '#8FB4FF',
    total: 50,
    players: [
      { name: 'Zé Luiz', pos: 'GOL', rating: 7 },
      { name: 'Betão', pos: 'ZAG', rating: 8 },
      { name: 'Nino', pos: 'LAT', rating: 6 },
      { name: 'PH', pos: 'VOL', rating: 7 },
      { name: 'Nando', pos: 'MEI', rating: 8 },
      { name: 'Bill', pos: 'ATA', rating: 8 },
      { name: 'Kadu', pos: 'ATA', rating: 6 },
    ],
  };

  constructor(private readonly router: Router) {}

  goBack(): void {
    this.router.navigateByUrl('/event');
  }
}
