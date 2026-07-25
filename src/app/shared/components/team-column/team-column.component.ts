import { Component, Input } from '@angular/core';

export interface SorteioPlayer {
  nome: string;
  pos: string;
  nota: number;
}

export interface SorteioTeam {
  nome: string;
  cor: string;
  soma: number;
  players: SorteioPlayer[];
}

@Component({
  standalone: false,
  selector: 'app-team-column',
  templateUrl: './team-column.component.html',
  styleUrls: ['./team-column.component.scss'],
})
export class TeamColumnComponent {
  @Input() team!: SorteioTeam;
}
