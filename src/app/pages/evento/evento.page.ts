import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerListItem } from '../../shared/components/player-group/player-group.component';

@Component({
  standalone: false,
  selector: 'app-evento',
  templateUrl: './evento.page.html',
  styleUrls: ['./evento.page.scss'],
})
export class EventoPage {
  readonly confirmados: PlayerListItem[] = [
    { nome: 'Marcão', pos: 'GOL', ini: 'MG' },
    { nome: 'Tota', pos: 'ZAG', ini: 'TÔ' },
    { nome: 'Dedé', pos: 'LAT', ini: 'DÊ' },
    { nome: 'Júnior', pos: 'VOL', ini: 'JR' },
    { nome: 'PH', pos: 'MEI', ini: 'PH' },
    { nome: 'Caco', pos: 'MEI', ini: 'CA' },
    { nome: 'Léo', pos: 'ATA', ini: 'LÉ' },
    { nome: 'Bill', pos: 'ATA', ini: 'BI' },
  ];

  readonly duvida: PlayerListItem[] = [
    { nome: 'Rafa', pos: 'ZAG', ini: 'RA' },
    { nome: 'Nando', pos: 'MEI', ini: 'NA' },
    { nome: 'Kadu', pos: 'ATA', ini: 'KA' },
  ];

  constructor(private readonly router: Router) {}

  voltar(): void {
    this.router.navigateByUrl('/home');
  }

  irParaSorteio(): void {
    this.router.navigateByUrl('/sorteio');
  }
}
