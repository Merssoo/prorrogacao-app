import { Component } from '@angular/core';
import { Router } from '@angular/router';

type EventType = 'INTERNAL' | 'EXTERNAL';

@Component({
  standalone: false,
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
})
export class CreateEventPage {
  type: EventType = 'INTERNAL';

  matchTitle = 'Racha de sábado';
  opponent = 'Real Várzea';
  venue = 'Campo do Zé Pretão';
  dateTime = '26/07 · 15:00';
  confirmationDeadline = '25/07 · 20:00';

  constructor(private readonly router: Router) {}

  get isInternal(): boolean {
    return this.type === 'INTERNAL';
  }

  get suggestedSpots(): number {
    return this.isInternal ? 20 : 16;
  }

  selectType(type: EventType): void {
    this.type = type;
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  createEvent(): void {
    this.router.navigateByUrl('/event');
  }
}
