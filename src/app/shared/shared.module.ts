import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TopBarComponent } from './components/top-bar/top-bar.component';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { FieldComponent } from './components/field/field.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { RoleBadgeComponent } from './components/role-badge/role-badge.component';
import { ChipComponent } from './components/chip/chip.component';
import { EyebrowComponent } from './components/eyebrow/eyebrow.component';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { TileComponent } from './components/tile/tile.component';
import { TeamCrestComponent } from './components/team-crest/team-crest.component';
import { PlayerRowComponent } from './components/player-row/player-row.component';
import { PlayerGroupComponent } from './components/player-group/player-group.component';
import { InfoBoxComponent } from './components/info-box/info-box.component';
import { TeamColumnComponent } from './components/team-column/team-column.component';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';
import { VoteQuestionComponent } from './components/vote-question/vote-question.component';
import { TypeCardComponent } from './components/type-card/type-card.component';
import { CodeInputComponent } from './components/code-input/code-input.component';
import { PlayerCardComponent } from './components/player-card/player-card.component';
import { JerseyNumberPickerComponent } from './components/jersey-number-picker/jersey-number-picker.component';
import { TeamCrestPickerComponent } from './components/team-crest-picker/team-crest-picker.component';
import { CrestBadgeComponent } from './components/crest-badge/crest-badge.component';

const COMPONENTS = [
  TopBarComponent,
  AppButtonComponent,
  FieldComponent,
  AvatarComponent,
  RoleBadgeComponent,
  ChipComponent,
  EyebrowComponent,
  BottomNavComponent,
  TileComponent,
  TeamCrestComponent,
  PlayerRowComponent,
  PlayerGroupComponent,
  InfoBoxComponent,
  TeamColumnComponent,
  SummaryCardComponent,
  VoteQuestionComponent,
  TypeCardComponent,
  CodeInputComponent,
  PlayerCardComponent,
  JerseyNumberPickerComponent,
  TeamCrestPickerComponent,
  CrestBadgeComponent,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [CommonModule, FormsModule, IonicModule, ...COMPONENTS],
})
export class SharedModule {}
