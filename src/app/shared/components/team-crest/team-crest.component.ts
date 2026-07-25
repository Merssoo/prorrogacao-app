import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-team-crest',
  templateUrl: './team-crest.component.html',
  styleUrls: ['./team-crest.component.scss'],
})
export class TeamCrestComponent {
  @Input() crest = '';
  @Input() name = '';
  @Input() home = false;
}
