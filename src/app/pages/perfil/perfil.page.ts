import { Component } from '@angular/core';
import { Router } from '@angular/router';

const POSICOES = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];
const PES = ['Direito', 'Esquerdo', 'Ambidestro'];

@Component({
  standalone: false,
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage {
  readonly posicoes = POSICOES;
  readonly pes = PES;

  apelido = 'Caco';
  numeroCamisa = '10';
  posicao = 'Meia';
  pe = 'Direito';

  constructor(private readonly router: Router) {}

  concluir(): void {
    this.router.navigateByUrl('/home');
  }
}
