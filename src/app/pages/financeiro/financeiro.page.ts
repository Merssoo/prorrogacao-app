import { Component } from '@angular/core';
import { Router } from '@angular/router';

type StatusMensalidade = 'PAGO' | 'PENDENTE' | 'ATRASADO';

interface MensalidadeRow {
  nome: string;
  ini: string;
  status: StatusMensalidade;
}

const STATUS_COLOR: Record<StatusMensalidade, string> = {
  PAGO: '#5FCB7E',
  PENDENTE: '#F5C542',
  ATRASADO: '#F26B5E',
};

@Component({
  standalone: false,
  selector: 'app-financeiro',
  templateUrl: './financeiro.page.html',
  styleUrls: ['./financeiro.page.scss'],
})
export class FinanceiroPage {
  rows: MensalidadeRow[] = [
    { nome: 'Marcão', ini: 'MG', status: 'PAGO' },
    { nome: 'Tota', ini: 'TÔ', status: 'PAGO' },
    { nome: 'Caco', ini: 'CA', status: 'PAGO' },
    { nome: 'Léo', ini: 'LÉ', status: 'PENDENTE' },
    { nome: 'Bill', ini: 'BI', status: 'ATRASADO' },
    { nome: 'Rafa', ini: 'RA', status: 'ATRASADO' },
  ];

  constructor(private readonly router: Router) {}

  corDoStatus(status: StatusMensalidade): string {
    return STATUS_COLOR[status];
  }

  confirmarPagamento(row: MensalidadeRow): void {
    row.status = 'PAGO';
  }

  voltar(): void {
    this.router.navigateByUrl('/home');
  }
}
