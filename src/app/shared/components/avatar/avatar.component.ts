import { Component, Input } from '@angular/core';

export type AvatarVariant = 'default' | 'gold' | 'grass';

@Component({
  standalone: false,
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent {
  @Input() label = '';
  @Input() size = 32;
  @Input() variant: AvatarVariant = 'default';

  get fontSize(): number {
    return this.size * 0.34;
  }
}
