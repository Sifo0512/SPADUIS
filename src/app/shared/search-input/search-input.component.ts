import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * LIB: reemplazar por el input de búsqueda de la librería (search / input con ícono).
 *  - variant "pill"      -> "Buscar registros" (panel izquierdo, borde redondeado).
 *  - variant "underline" -> "Filtrar registros" (panel derecho, solo línea inferior).
 * Si la librería no tiene dos variantes, usar el mismo componente y ajustar con CSS.
 */
@Component({
  selector: 'app-search-input',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="box" [class.underline]="variant() === 'underline'">
      <app-icon name="search" />
      <input
        type="search"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
      />
      @if (clearable() && value()) {
        <button type="button" class="clear" aria-label="Borrar búsqueda" (click)="clear($event)">
          <app-icon name="close" style="--icon-size: 16px" />
        </button>
      }
    </label>
  `,
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  readonly placeholder = input('Buscar');
  readonly variant = input<'pill' | 'underline'>('pill');
  /**
   * Texto actual. Solo hace falta si quien lo usa necesita vaciarlo desde afuera
   * ("Limpiar filtros") o mostrar la X de borrar (`clearable`).
   */
  readonly value = input('');
  /** Muestra la X para borrar (requiere pasar `value`). */
  readonly clearable = input(false);

  /** Emite el texto en cada tecla. El debounce se hace en quien lo usa. */
  readonly valueChange = output<string>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected clear(event: Event): void {
    event.preventDefault();
    this.valueChange.emit('');
  }
}
