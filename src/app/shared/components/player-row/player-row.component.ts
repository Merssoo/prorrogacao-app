import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-player-row',
  templateUrl: './player-row.component.html',
  styleUrls: ['./player-row.component.scss'],
})
export class PlayerRowComponent {
  @Input() name = '';
  @Input() pos = '';
  @Input() initials = '';
  @Input() photoUrl: string | null | undefined = null;
  @Input() showOptions = false;
  @Output() optionsTap = new EventEmitter<void>();
}
