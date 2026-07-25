import { Component, Input } from '@angular/core';

export type Papel = 'PRESIDENTE' | 'TESOUREIRO' | 'CONSELHEIRO' | 'JOGADOR';

interface RoleMeta {
  color: string;
  icon: string;
}

const ROLE_MAP: Record<Papel, RoleMeta> = {
  PRESIDENTE: { color: '#F5C542', icon: 'ribbon-outline' },
  TESOUREIRO: { color: '#5FCB7E', icon: 'cash-outline' },
  CONSELHEIRO: { color: '#8FB4FF', icon: 'shield-outline' },
  JOGADOR: { color: '#8A968C', icon: 'person-outline' },
};

@Component({
  standalone: false,
  selector: 'app-role-badge',
  templateUrl: './role-badge.component.html',
  styleUrls: ['./role-badge.component.scss'],
})
export class RoleBadgeComponent {
  @Input() role: Papel = 'JOGADOR';

  get meta(): RoleMeta {
    return ROLE_MAP[this.role];
  }
}
