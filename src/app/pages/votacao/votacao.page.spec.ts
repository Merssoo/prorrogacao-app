import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VotacaoPage } from './votacao.page';

describe('VotacaoPage', () => {
  let component: VotacaoPage;
  let fixture: ComponentFixture<VotacaoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VotacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
