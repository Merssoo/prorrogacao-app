import { Component } from '@angular/core';
import { Router } from '@angular/router';

const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];
const FEET = ['Direito', 'Esquerdo', 'Ambidestro'];

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  readonly positions = POSITIONS;
  readonly feet = FEET;

  nickname = 'Caco';
  jerseyNumber = '10';
  position = 'Meia';
  foot = 'Direito';

  constructor(private readonly router: Router) {}

  finish(): void {
    this.router.navigateByUrl('/home');
  }
}
