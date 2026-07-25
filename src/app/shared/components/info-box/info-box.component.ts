import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-info-box',
  templateUrl: './info-box.component.html',
  styleUrls: ['./info-box.component.scss'],
})
export class InfoBoxComponent {
  @Input() icon = 'alert-circle-outline';
  @Input() iconColor = '#F5C542';
}
