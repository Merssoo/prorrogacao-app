import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraftPage } from './draft.page';

describe('DraftPage', () => {
  let component: DraftPage;
  let fixture: ComponentFixture<DraftPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DraftPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
