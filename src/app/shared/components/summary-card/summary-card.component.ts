import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-summary-card',
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss'],
})
export class SummaryCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() sub = '';
  @Input() alert = false;
}
