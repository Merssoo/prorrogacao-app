import { Component } from '@angular/core';
import { Router } from '@angular/router';

type TipoEvento = 'INTERNO' | 'EXTERNO';

@Component({
  standalone: false,
  selector: 'app-criar-evento',
  templateUrl: './criar-evento.page.html',
  styleUrls: ['./criar-evento.page.scss'],
})
export class CriarEventoPage {
  tipo: TipoEvento = 'INTERNO';

  tituloRacha = 'Racha de sábado';
  adversario = 'Real Várzea';
  local = 'Campo do Zé Pretão';
  dataHora = '26/07 · 15:00';
  prazoConfirmacao = '25/07 · 20:00';

  constructor(private readonly router: Router) {}

  get interno(): boolean {
    return this.tipo === 'INTERNO';
  }

  get vagasSugeridas(): number {
    return this.interno ? 20 : 16;
  }

  selecionarTipo(tipo: TipoEvento): void {
    this.tipo = tipo;
  }

  voltar(): void {
    this.router.navigateByUrl('/home');
  }

  criarEvento(): void {
    this.router.navigateByUrl('/evento');
  }
}
