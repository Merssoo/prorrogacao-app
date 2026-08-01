import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingsPage } from './ratings.page';

describe('RatingsPage', () => {
  let component: RatingsPage;
  let fixture: ComponentFixture<RatingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
