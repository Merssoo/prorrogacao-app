import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-player-row',
  templateUrl: './player-row.component.html',
  styleUrls: ['./player-row.component.scss'],
})
export class PlayerRowComponent {
  @Input() nome = '';
  @Input() pos = '';
  @Input() ini = '';
}
