import { Component, Input } from '@angular/core';

export interface PlayerListItem {
  name: string;
  pos: string;
  initials: string;
}

@Component({
  standalone: false,
  selector: 'app-player-group',
  templateUrl: './player-group.component.html',
  styleUrls: ['./player-group.component.scss'],
})
export class PlayerGroupComponent {
  @Input() title = '';
  @Input() color = '';
  @Input() players: PlayerListItem[] = [];
}
