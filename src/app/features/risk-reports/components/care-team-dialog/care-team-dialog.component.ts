import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

import { DialogComponent } from '../../../../shared/dialog/dialog.component';
import { FieldComponent } from '../../../../shared/field/field.component';
import { notBlank } from '../../../../shared/validators/not-blank.validator';
import { CareTeam, CareTeamPayload } from '../../models/care-team.model';

/** "Fecha hasta" no puede ser anterior a "Fecha desde". Las fechas "yyyy-MM-dd" se comparan como texto. */
const notBeforeFrom: ValidatorFn = (control) => {
  const from = control.parent?.get('validFrom')?.value;
  const to = control.value;
  return from && to && to < from ? { dateRange: true } : null;
};

/**
 * Diálogo "Crear/editar equipo": nombre y vigencia (desde / hasta).
 * No habla con el servicio: valida y avisa con `save`; la página hace la petición.
 *
 * ============================================================================
 *  LIB: el contenedor es <app-dialog> (ver dialog.component.ts) y cada campo
 *       es un <app-field>. Se reemplazan por el dialog, el input y el
 *       datepicker de la librería; el formulario reactivo no cambia.
 * ============================================================================
 *
 *  Para editar: pasar `team`. Para crear: dejarlo en null.
 */
@Component({
  selector: 'app-care-team-dialog',
  imports: [ReactiveFormsModule, DialogComponent, FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './care-team-dialog.component.html',
  styleUrl: './care-team-dialog.component.scss',
})
export class CareTeamDialogComponent implements OnInit {
  /** Equipo a editar. null = crear uno nuevo. */
  readonly team = input<CareTeam | null>(null);
  /** La página está guardando: se bloquean campos y botones. */
  readonly saving = input(false);
  /** Mensaje de error del guardado (lo decide la página). */
  readonly error = input<string | null>(null);

  readonly save = output<CareTeamPayload>();
  readonly dismiss = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly nameMax = 100;

  /**
   * BACK: confirmar con backend el largo máximo del nombre y si la fecha
   * "hasta" puede quedar vacía (aquí es opcional, como en el mockup).
   */
  protected readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, notBlank, Validators.maxLength(this.nameMax)]),
    validFrom: this.fb.control('', Validators.required),
    validTo: this.fb.control('', notBeforeFrom),
  });

  /** "Fecha desde" como señal: la usa el `min` del campo "Fecha hasta" (el valor de un control no es una señal). */
  protected readonly fromDate = toSignal(this.form.controls.validFrom.valueChanges, { initialValue: '' });

  constructor() {
    // Si cambia "Fecha desde", hay que revalidar "Fecha hasta".
    this.form.controls.validFrom.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.validTo.updateValueAndValidity());

    // Mientras se guarda, el formulario queda bloqueado.
    effect(() => (this.saving() ? this.form.disable() : this.form.enable()));
  }

  ngOnInit(): void {
    const team = this.team();
    if (team) {
      this.form.patchValue({ name: team.name, validFrom: team.validFrom, validTo: team.validTo ?? '' });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      name: value.name.trim(),
      validFrom: value.validFrom,
      // Campo vacío = sin fecha de fin.
      validTo: value.validTo || null,
    });
  }
}
