import { Component, Input } from '@angular/core';

export interface DraftPlayer {
  name: string;
  pos: string;
  rating: number;
}

export interface DraftTeam {
  name: string;
  color: string;
  total: number;
  players: DraftPlayer[];
}

@Component({
  standalone: false,
  selector: 'app-team-column',
  templateUrl: './team-column.component.html',
  styleUrls: ['./team-column.component.scss'],
})
export class TeamColumnComponent {
  @Input() team!: DraftTeam;
}
