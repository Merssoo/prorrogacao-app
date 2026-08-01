import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerListItem } from '../../shared/components/player-group/player-group.component';

@Component({
  standalone: false,
  selector: 'app-event',
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
})
export class EventPage {
  readonly confirmed: PlayerListItem[] = [
    { name: 'Marcão', pos: 'GOL', initials: 'MG' },
    { name: 'Tota', pos: 'ZAG', initials: 'TÔ' },
    { name: 'Dedé', pos: 'LAT', initials: 'DÊ' },
    { name: 'Júnior', pos: 'VOL', initials: 'JR' },
    { name: 'PH', pos: 'MEI', initials: 'PH' },
    { name: 'Caco', pos: 'MEI', initials: 'CA' },
    { name: 'Léo', pos: 'ATA', initials: 'LÉ' },
    { name: 'Bill', pos: 'ATA', initials: 'BI' },
  ];

  readonly maybe: PlayerListItem[] = [
    { name: 'Rafa', pos: 'ZAG', initials: 'RA' },
    { name: 'Nando', pos: 'MEI', initials: 'NA' },
    { name: 'Kadu', pos: 'ATA', initials: 'KA' },
  ];

  constructor(private readonly router: Router) {}

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  goToDraft(): void {
    this.router.navigateByUrl('/draft');
  }
}
