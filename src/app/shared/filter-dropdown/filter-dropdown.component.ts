import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * LIB: reemplazar por el dropdown / select / menú con botón de la librería
 * (los dos botones "Label" con engranaje y flecha del mockup).
 * Contrato que debe cumplir el reemplazo:
 *   - recibe la lista de opciones
 *   - emite el valor seleccionado ('' = sin filtro)
 */
@Component({
  selector: 'app-filter-dropdown',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'open.set(false)',
  },
  template: `
    <button
      type="button"
      class="trigger"
      [class.has-value]="!!value()"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
      (click)="open.update((v) => !v)"
    >
      <app-icon name="settings" style="--icon-size: 16px" />
      <span>{{ text() }}</span>
      <app-icon name="chevron-down" style="--icon-size: 14px" />
    </button>

    @if (open()) {
      <ul class="menu" role="listbox">
        <li>
          <button type="button" role="option" [attr.aria-selected]="!value()" (click)="select('')">
            {{ allLabel() }}
          </button>
        </li>
        @for (opt of options(); track opt.value) {
          <li>
            <button
              type="button"
              role="option"
              [class.selected]="opt.value === value()"
              [attr.aria-selected]="opt.value === value()"
              (click)="select(opt.value)"
            >
              {{ opt.label }}
            </button>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './filter-dropdown.component.scss',
})
export class FilterDropdownComponent {
  readonly label = input.required<string>();
  readonly options = input.required<FilterOption[]>();
  readonly allLabel = input('Todos');

  /** Valor seleccionado. '' = sin filtro. Se usa como [value] + (valueChange). */
  readonly value = model<string>('');

  protected readonly open = signal(false);

  protected readonly text = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? this.label(),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected select(value: string): void {
    this.value.set(value);
    this.open.set(false);
  }

  protected onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
