import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
})
export class TileComponent {
  @Input() icon = '';
  @Input() label = '';
  @Input() sub = '';
  @Output() pressed = new EventEmitter<void>();
}
