import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinTeamPage } from './join-team.page';

describe('JoinTeamPage', () => {
  let component: JoinTeamPage;
  let fixture: ComponentFixture<JoinTeamPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinTeamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
