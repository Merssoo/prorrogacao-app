import { Component, EventEmitter, Input, Output } from '@angular/core';

export type CrestShape = 'SHIELD' | 'CIRCLE' | 'HEXAGON';

const SHAPES: CrestShape[] = ['SHIELD', 'CIRCLE', 'HEXAGON'];

@Component({
  standalone: false,
  selector: 'app-team-crest-picker',
  templateUrl: './team-crest-picker.component.html',
  styleUrls: ['./team-crest-picker.component.scss'],
})
export class TeamCrestPickerComponent {
  @Input() shape: CrestShape = 'SHIELD';
  @Input() photoUrl: string | null = null;
  @Input() photoUploading = false;
  @Output() shapeChange = new EventEmitter<CrestShape>();
  @Output() photoTap = new EventEmitter<void>();

  readonly shapes = SHAPES;

  selectShape(shape: CrestShape): void {
    if (shape === this.shape) return;
    this.shape = shape;
    this.shapeChange.emit(shape);
  }

  shapeClass(shape: CrestShape): string {
    return 'shape-' + shape.toLowerCase();
  }
}
