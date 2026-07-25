import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-type-card',
  templateUrl: './type-card.component.html',
  styleUrls: ['./type-card.component.scss'],
})
export class TypeCardComponent {
  @Input() active = false;
  @Input() icon = '';
  @Input() title = '';
  @Input() sub = '';
  @Output() pressed = new EventEmitter<void>();
}
