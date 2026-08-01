import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  attendanceConfirmed = false;

  readonly avatars = ['MG', 'TÔ', 'JR', 'PH', 'CA'];

  constructor(private readonly router: Router) {}

  goToEvent(): void {
    this.router.navigateByUrl('/event');
  }

  goToCreateEvent(): void {
    this.router.navigateByUrl('/create-event');
  }

  goToRatings(): void {
    this.router.navigateByUrl('/ratings');
  }

  goToVoting(): void {
    this.router.navigateByUrl('/voting');
  }

  goToDraft(): void {
    this.router.navigateByUrl('/draft');
  }

  goToFinance(): void {
    this.router.navigateByUrl('/finance');
  }

  toggleAttendance(event: Event): void {
    event.stopPropagation();
    this.attendanceConfirmed = !this.attendanceConfirmed;
  }
}
