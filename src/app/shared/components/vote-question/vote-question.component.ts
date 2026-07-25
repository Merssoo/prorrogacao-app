import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-vote-question',
  templateUrl: './vote-question.component.html',
  styleUrls: ['./vote-question.component.scss'],
})
export class VoteQuestionComponent {
  @Input() n = 1;
  @Input() label = '';
  @Input() opts: string[] = [];
  @Input() value = '';
  @Input() avatars = false;
  @Output() pick = new EventEmitter<string>();

  get numberLabel(): string {
    return String(this.n).padStart(2, '0');
  }

  initials(o: string): string {
    return o.slice(0, 2).toUpperCase();
  }
}
