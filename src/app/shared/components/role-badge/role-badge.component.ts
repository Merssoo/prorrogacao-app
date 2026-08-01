import { Component, Input } from '@angular/core';

export type Role = 'PRESIDENT' | 'TREASURER' | 'COUNCIL_MEMBER' | 'PLAYER';

interface RoleMeta {
  color: string;
  icon: string;
  label: string;
}

const ROLE_MAP: Record<Role, RoleMeta> = {
  PRESIDENT: { color: '#F5C542', icon: 'ribbon-outline', label: 'PRESIDENTE' },
  TREASURER: { color: '#5FCB7E', icon: 'cash-outline', label: 'TESOUREIRO' },
  COUNCIL_MEMBER: { color: '#8FB4FF', icon: 'shield-outline', label: 'CONSELHEIRO' },
  PLAYER: { color: '#8A968C', icon: 'person-outline', label: 'JOGADOR' },
};

@Component({
  standalone: false,
  selector: 'app-role-badge',
  templateUrl: './role-badge.component.html',
  styleUrls: ['./role-badge.component.scss'],
})
export class RoleBadgeComponent {
  @Input() role: Role = 'PLAYER';

  get meta(): RoleMeta {
    return ROLE_MAP[this.role];
  }
}
