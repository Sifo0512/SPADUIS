import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, Validators } from '@angular/forms';

import { IconComponent, IconName } from '../icon/icon.component';

/**
 * Contenedor visual de un campo de formulario: fondo gris, ícono a la izquierda,
 * etiqueta que flota, mensaje de error y contador de caracteres.
 * El <input>, <select> o <textarea> real se escribe DENTRO de este componente
 * (contenido proyectado) y se conecta al formulario con formControlName.
 *
 * ============================================================================
 *  LIB: reemplazar por el campo de formulario de la librería
 *       (busca: form-field / input / select / textarea / mat-form-field).
 *  Cada uso de <app-field> se convierte en un campo de la librería con:
 *    - label ........ [label]
 *    - ícono ........ [icon]   (prefijo del campo)
 *    - obligatorio .. el asterisco sale solo si el control tiene Validators.required
 *    - error ........ mensaje bajo el campo (aquí: errorText())
 *    - contador ..... [counterMax]  ("0 de 400 caracteres.")
 *  Los select de la librería reemplazan al <select> nativo.
 * ============================================================================
 *
 * Nota técnica (importante): en Angular 22 los componentes son OnPush por defecto
 * y la app es zoneless. El estado de un FormControl (valor, touched, invalid...)
 * NO es una señal, así que la vista no se enteraría de sus cambios. Por eso el
 * campo escucha `control.events` y sube la señal `version`; todo lo que se pinta
 * (is-filled, is-invalid, mensaje de error, contador) sale de señales computadas.
 */
@Component({
  selector: 'app-field',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Sin encapsulación: los estilos tienen que alcanzar al <input> proyectado.
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="field"
      [class.field--multiline]="kind() === 'textarea'"
      [class.field--date]="kind() === 'date'"
      [class.is-filled]="isFilled()"
      [class.is-invalid]="showError()"
      [class.is-disabled]="disabled()"
    >
      <div class="field__box">
        @if (icon(); as name) {
          <app-icon class="field__icon" [name]="name" />
        }
        <div class="field__control">
          <label class="field__label" [attr.for]="controlId()">{{ label() }}{{ isRequired() ? '*' : '' }}</label>
          <ng-content />
        </div>
        @if (kind() === 'select') {
          <app-icon class="field__arrow" name="chevron-down" />
        } @else if (kind() === 'date') {
          <app-icon class="field__arrow" name="calendar" />
        }
      </div>

      <div class="field__footer">
        <span class="field__error" role="alert">{{ showError() ? errorText() : '' }}</span>
        @if (counterMax(); as max) {
          <span class="field__counter">{{ length() }} de {{ max }} caracteres.</span>
        }
      </div>
    </div>
  `,
  styleUrl: './field.component.scss',
})
export class FieldComponent implements OnInit {
  readonly label = input.required<string>();
  /** Debe coincidir con el `id` del input proyectado (conecta label e input). */
  readonly controlId = input.required<string>();
  /** El control no debe cambiar durante la vida del campo. */
  readonly control = input.required<AbstractControl>();
  readonly icon = input<IconName | null>(null);
  readonly kind = input<'text' | 'select' | 'textarea' | 'date'>('text');
  /** Si se define, muestra "N de MAX caracteres." */
  readonly counterMax = input<number | null>(null);
  /** Fuerza el estado "con contenido" (lo usa el autocompletado, cuyo texto no es el valor del control). */
  readonly filled = input<boolean | null>(null);
  readonly requiredMessage = input('Este campo es obligatorio.');

  private readonly destroyRef = inject(DestroyRef);

  /** Sube cada vez que el control emite un evento (valor, estado, touched, pristine, reset). */
  private readonly version = signal(0);

  /** Foto del estado del control. Se recalcula solo cuando `version` o `control` cambian. */
  private readonly state = computed(() => {
    this.version();
    const c = this.control();
    return {
      value: c.value as unknown,
      invalid: c.invalid,
      touched: c.touched,
      dirty: c.dirty,
      disabled: c.disabled,
      errors: c.errors,
    };
  });

  protected readonly isRequired = computed(() => this.control().hasValidator(Validators.required));

  protected readonly isFilled = computed(() => {
    const forced = this.filled();
    if (forced !== null) return forced;
    const value = this.state().value;
    return value !== null && value !== undefined && value !== '';
  });

  protected readonly showError = computed(() => {
    const s = this.state();
    return s.invalid && (s.touched || s.dirty);
  });

  protected readonly disabled = computed(() => this.state().disabled);

  protected readonly length = computed(() => String(this.state().value ?? '').length);

  protected readonly errorText = computed(() => {
    const errors = this.state().errors;
    if (!errors) return '';
    if (errors['required']) return this.requiredMessage();
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['dateRange']) return 'La fecha hasta no puede ser anterior a la fecha desde.';
    return 'El valor no es válido.';
  });

  ngOnInit(): void {
    this.control()
      .events.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.version.update((n) => n + 1));
  }
}
