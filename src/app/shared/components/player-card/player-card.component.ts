import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
const TAP_EFFECT_DURATION_MS = 650;

@Component({
  standalone: false,
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss'],
})
export class PlayerCardComponent implements OnDestroy {
  @Input() photoUrl: string | null = null;
  @Input() nickname = '';
  @Input() position = '';
  @Input() dominantFoot = '';
  @Input() jerseyNumber: number | null = null;
  @Input() photoUploading = false;
  @Input() readOnly = false;
  @Input() attackRating: number | null = null;
  @Input() defenseRating: number | null = null;
  @Input() physicalRating: number | null = null;
  @Input() skillRating: number | null = null;
  @Output() photoTap = new EventEmitter<void>();

  tapped = false;
  private tapTimeoutId?: ReturnType<typeof setTimeout>;

  get positionAbbr(): string {
    return this.position ? this.position.slice(0, 3).toUpperCase() : '';
  }

  onCardTap(): void {
    if (this.tapTimeoutId) {
      clearTimeout(this.tapTimeoutId);
    }
    this.tapped = false;
    requestAnimationFrame(() => {
      this.tapped = true;
      this.tapTimeoutId = setTimeout(() => {
        this.tapped = false;
        this.tapTimeoutId = undefined;
      }, TAP_EFFECT_DURATION_MS);
    });
  }

  ngOnDestroy(): void {
    if (this.tapTimeoutId) {
      clearTimeout(this.tapTimeoutId);
    }
  }
}
