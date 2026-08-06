import { Component, Input } from '@angular/core';
import { AvatarVariant } from '../avatar/avatar.component';
import { CrestShape } from '../team-crest-picker/team-crest-picker.component';

@Component({
  standalone: false,
  selector: 'app-crest-badge',
  templateUrl: './crest-badge.component.html',
  styleUrls: ['./crest-badge.component.scss'],
})
export class CrestBadgeComponent {
  @Input() crestUrl: string | null | undefined = null;
  @Input() crestShape: CrestShape | null | undefined = 'SHIELD';
  @Input() size = 42;
  @Input() fallbackLabel = '';
  @Input() avatarVariant: AvatarVariant = 'default';

  get shapeClass(): string {
    return 'shape-' + (this.crestShape ?? 'SHIELD').toLowerCase();
  }
}
