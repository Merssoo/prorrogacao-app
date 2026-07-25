import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant = 'gold' | 'ghost' | 'grass';

@Component({
  standalone: false,
  selector: 'app-button',
  templateUrl: './app-button.component.html',
  styleUrls: ['./app-button.component.scss'],
})
export class AppButtonComponent {
  @Input() variant: ButtonVariant = 'gold';
  @Input() icon?: string;
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      return;
    }
    this.pressed.emit(event);
  }
}
