import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-jersey-number-picker',
  templateUrl: './jersey-number-picker.component.html',
  styleUrls: ['./jersey-number-picker.component.scss'],
})
export class JerseyNumberPickerComponent {
  @Input() value: number | null = null;
  @Input() min = 1;
  @Input() max = 99;
  @Output() valueChange = new EventEmitter<number>();

  editing = false;
  draftValue = '';

  @ViewChild('numberInput') private numberInput?: ElementRef<HTMLInputElement>;

  get canDecrement(): boolean {
    return this.value !== null && this.value > this.min;
  }

  get canIncrement(): boolean {
    return this.value === null || this.value < this.max;
  }

  decrement(): void {
    if (!this.canDecrement) return;
    this.emit((this.value as number) - 1);
  }

  increment(): void {
    if (!this.canIncrement) return;
    this.emit(this.value === null ? this.min : this.value + 1);
  }

  startEditing(): void {
    this.draftValue = this.value !== null ? String(this.value) : '';
    this.editing = true;
    setTimeout(() => {
      this.numberInput?.nativeElement.focus();
      this.numberInput?.nativeElement.select();
    });
  }

  onDraftInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2);
    this.draftValue = raw;
    (event.target as HTMLInputElement).value = raw;
  }

  confirmEditing(): void {
    this.numberInput?.nativeElement.blur();
  }

  commitEditing(): void {
    this.editing = false;
    if (!this.draftValue) return;

    const parsed = Math.min(this.max, Math.max(this.min, Number(this.draftValue)));
    this.emit(parsed);
  }

  cancelEditing(): void {
    this.draftValue = '';
    this.editing = false;
  }

  private emit(next: number): void {
    this.value = next;
    this.valueChange.emit(next);
  }
}
