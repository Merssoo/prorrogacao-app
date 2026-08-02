import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-code-input',
  templateUrl: './code-input.component.html',
  styleUrls: ['./code-input.component.scss'],
})
export class CodeInputComponent implements OnChanges {
  @Input() length = 6;
  @Input() value = '';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() completed = new EventEmitter<string>();

  digits: string[] = new Array(this.length).fill('');

  @ViewChildren('digitInput') private digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['length'] && this.digits.length !== this.length) {
      this.digits = new Array(this.length).fill('');
    }
    if (changes['value']) {
      const incoming = this.value ?? '';
      if (incoming !== this.digits.join('')) {
        const chars = incoming.split('');
        this.digits = new Array(this.length).fill('').map((_, i) => chars[i] ?? '');
      }
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  focusFirst(): void {
    this.focusDigit(0);
  }

  clear(): void {
    this.digits = new Array(this.length).fill('');
    this.emitValue();
    this.focusFirst();
  }

  onDigitInput(i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputType = (event as InputEvent).inputType;

    if (inputType?.startsWith('delete')) {
      this.digits[i] = '';
      input.value = '';
      this.emitValue();
      if (i > 0) {
        this.focusDigit(i - 1);
      }
      return;
    }

    const raw = input.value.replace(/\D/g, '');

    if (raw.length > 1) {
      this.fillFrom(0, raw);
      return;
    }

    this.digits[i] = raw;
    input.value = raw;
    this.emitValue();
    if (raw && i < this.digits.length - 1) {
      this.focusDigit(i + 1);
    }
  }

  onDigitKeydown(i: number, event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' && i > 0) {
      event.preventDefault();
      this.focusDigit(i - 1);
      return;
    }
    if (event.key === 'ArrowRight' && i < this.digits.length - 1) {
      event.preventDefault();
      this.focusDigit(i + 1);
    }
  }

  onDigitsPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digitsOnly = pasted.replace(/\D/g, '');
    if (!digitsOnly) return;

    event.preventDefault();
    this.fillFrom(0, digitsOnly);
  }

  private fillFrom(startIndex: number, code: string): void {
    const chars = code.split('').slice(0, this.digits.length - startIndex);
    chars.forEach((digit, offset) => {
      this.digits[startIndex + offset] = digit;
    });
    this.emitValue();
    const lastFilledIndex = startIndex + chars.length - 1;
    this.focusDigit(Math.min(lastFilledIndex + 1, this.digits.length - 1));
  }

  private focusDigit(index: number): void {
    setTimeout(() => {
      const target = this.digitInputs.get(index)?.nativeElement;
      target?.focus();
      target?.select();
    });
  }

  private emitValue(): void {
    const value = this.digits.join('');
    this.valueChange.emit(value);
    if (value.length === this.length) {
      this.completed.emit(value);
    }
  }
}
