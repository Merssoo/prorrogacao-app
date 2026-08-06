import { Component, EventEmitter, Input, Output } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
}

@Component({
  standalone: false,
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent {
  @Input() active = '';
  @Output() itemClick = new EventEmitter<string>();

  readonly items: NavItem[] = [
    { label: 'Times', icon: 'shield-outline' },
    { label: 'Elenco', icon: 'people-outline' },
    { label: 'Jogos', icon: 'calendar-outline' },
    { label: 'Caixa', icon: 'wallet-outline' },
  ];
}
