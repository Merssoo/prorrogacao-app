import { Component } from '@angular/core';
import { Router } from '@angular/router';

type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE';

interface FeeRow {
  name: string;
  initials: string;
  status: FeeStatus;
}

const STATUS_COLOR: Record<FeeStatus, string> = {
  PAID: '#5FCB7E',
  PENDING: '#F5C542',
  OVERDUE: '#F26B5E',
};

const STATUS_LABEL: Record<FeeStatus, string> = {
  PAID: 'PAGO',
  PENDING: 'PENDENTE',
  OVERDUE: 'ATRASADO',
};

@Component({
  standalone: false,
  selector: 'app-finance',
  templateUrl: './finance.page.html',
  styleUrls: ['./finance.page.scss'],
})
export class FinancePage {
  rows: FeeRow[] = [
    { name: 'Marcão', initials: 'MG', status: 'PAID' },
    { name: 'Tota', initials: 'TÔ', status: 'PAID' },
    { name: 'Caco', initials: 'CA', status: 'PAID' },
    { name: 'Léo', initials: 'LÉ', status: 'PENDING' },
    { name: 'Bill', initials: 'BI', status: 'OVERDUE' },
    { name: 'Rafa', initials: 'RA', status: 'OVERDUE' },
  ];

  constructor(private readonly router: Router) {}

  statusColor(status: FeeStatus): string {
    return STATUS_COLOR[status];
  }

  statusLabel(status: FeeStatus): string {
    return STATUS_LABEL[status];
  }

  confirmPayment(row: FeeRow): void {
    row.status = 'PAID';
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }
}
