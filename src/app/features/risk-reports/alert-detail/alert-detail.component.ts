import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DialogComponent } from '../../../shared/dialog/dialog.component';
import { FieldComponent } from '../../../shared/field/field.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { notBlank } from '../../../shared/validators/not-blank.validator';
import {
  AlertDetail,
  AlertStatus,
  RESULT_STATUS_OPTIONS,
  statusLabel,
} from '../models/alert.model';
import { RiskReportsService } from '../services/risk-reports.service';
import { RR_PATHS } from '../risk-reports.paths';

/**
 * Vista de intervención: se llega desde "Gestionar alertas" al elegir un estudiante.
 * Muestra el reporte (solo lectura) y el formulario de intervención.
 *
 *  - "Guardar intervención": cambia la alerta al "estado resultante" y vuelve al
 *    listado, en la pestaña de ese estado.
 *  - "Anular reporte": pide confirmación, anula y vuelve al listado.
 *  - Una alerta ya "Atendida" se muestra en solo lectura (sin botones).
 *
 * Es el único componente que habla con el servicio.
 *
 * ============================================================================
 *  LIB: el encabezado (flecha + avatar + datos + botones) puede ser un
 *       page-header con slot de acciones; los campos y el diálogo, los de la
 *       librería (igual que en "Crear reporte"). El avatar: avatar / user-chip.
 * ============================================================================
 */
@Component({
  selector: 'app-alert-detail',
  imports: [ReactiveFormsModule, FieldComponent, IconComponent, DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Activa el tema del módulo (variables y botones); ver risk-reports.theme.scss.
  host: { class: 'rr-theme' },
  templateUrl: './alert-detail.component.html',
  styleUrl: './alert-detail.component.scss',
})
export class AlertDetailComponent implements OnInit {
  private readonly service = inject(RiskReportsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly alert = signal<AlertDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly confirmCancel = signal(false);

  protected readonly notesMax = 400;
  protected readonly resultOptions = RESULT_STATUS_OPTIONS;
  protected readonly statusLabel = statusLabel;

  /** Una alerta atendida ya no se interviene. */
  protected readonly readOnly = computed(() => this.alert()?.status === 'ATENDIDA');

  protected readonly initials = computed(() =>
    (this.alert()?.studentName ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join(''),
  );

  /** BACK: confirmar largo máximo de las notas (aquí 400, como en el mockup). */
  protected readonly form = this.fb.group({
    resultStatus: this.fb.control<AlertStatus | ''>('', Validators.required),
    notes: this.fb.control('', [Validators.required, notBlank, Validators.maxLength(this.notesMax)]),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service
      .getAlertById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alert) => {
          this.alert.set(alert);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(
            err?.status === 404 ? 'No se encontró la alerta.' : 'No se pudo cargar la alerta. Intenta de nuevo.',
          );
        },
      });
  }

  protected onSubmit(): void {
    const alert = this.alert();
    if (!alert || this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set(null);

    this.service
      .saveIntervention(alert.id, { resultStatus: value.resultStatus as AlertStatus, notes: value.notes.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          // LIB: aquí va la notificación de éxito (snackbar/toast de la librería).
          this.goToList(saved.status);
        },
        error: () => {
          this.saving.set(false);
          this.submitError.set('No se pudo guardar la intervención. Intenta de nuevo.');
        },
      });
  }

  protected openCancel(): void {
    this.submitError.set(null);
    this.confirmCancel.set(true);
  }

  protected closeCancel(): void {
    if (this.saving()) return;
    this.confirmCancel.set(false);
  }

  protected confirmCancelReport(): void {
    const alert = this.alert();
    if (!alert) return;
    this.saving.set(true);
    this.service
      .cancelAlert(alert.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.confirmCancel.set(false);
          // LIB: notificación de éxito.
          this.goToList(alert.status);
        },
        error: () => {
          this.saving.set(false);
          this.confirmCancel.set(false);
          this.submitError.set('No se pudo anular el reporte. Intenta de nuevo.');
        },
      });
  }

  /** Vuelve al listado, a la pestaña indicada (por defecto, la del estado actual de la alerta). */
  protected goToList(status: AlertStatus | undefined = this.alert()?.status): void {
    this.router.navigate([RR_PATHS.alerts], { queryParams: status ? { estado: status } : {} });
  }
}
