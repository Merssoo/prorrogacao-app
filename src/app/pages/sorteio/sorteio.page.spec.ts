import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SorteioPage } from './sorteio.page';

describe('SorteioPage', () => {
  let component: SorteioPage;
  let fixture: ComponentFixture<SorteioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SorteioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
