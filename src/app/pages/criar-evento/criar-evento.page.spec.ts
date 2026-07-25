import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CriarEventoPage } from './criar-evento.page';

describe('CriarEventoPage', () => {
  let component: CriarEventoPage;
  let fixture: ComponentFixture<CriarEventoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CriarEventoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
