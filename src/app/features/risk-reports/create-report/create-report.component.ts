import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { FieldComponent } from '../../../shared/field/field.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { HelpDrawerComponent } from '../components/help-drawer/help-drawer.component';
import { StudentPickerComponent } from '../components/student-picker/student-picker.component';
import { ReportCatalogs, StudentSummary } from '../models/create-report.model';
import { RiskRange } from '../models/risk-range.model';
import { RiskReportsService } from '../services/risk-reports.service';
import { RR_PATHS } from '../risk-reports.paths';

/** Rechaza textos que solo tienen espacios. Devuelve el error `required` para reutilizar el mensaje. */
const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.length > 0 && control.value.trim() === ''
    ? { required: true }
    : null;

/**
 * Pantalla "Crear reporte por riesgo".
 *
 * Igual que la pantalla del listado, este es el único componente que habla con
 * el servicio; los campos y el autocompletado son piezas reemplazables.
 *
 * Flujo:
 *   1. Al abrir: pide los catálogos de los desplegables.
 *   2. Si llega con ?studentId=123 (desde el icono "crear registro" de la tabla),
 *      precarga ese estudiante.
 *   3. "Guardar y enviar": valida, y si todo está bien hace el POST.
 */
@Component({
  selector: 'app-create-report',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    FieldComponent,
    IconComponent,
    StudentPickerComponent,
    HelpDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Activa el tema del módulo (variables y botones); ver risk-reports.theme.scss.
  host: { class: 'rr-theme' },
  templateUrl: './create-report.component.html',
  styleUrl: './create-report.component.scss',
})
export class CreateReportComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(RiskReportsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly reporterMax = 100;
  protected readonly descriptionMax = 400;

  /**
   * BACK: las validaciones (obligatorios y 400 caracteres) vienen del mockup.
   * Confirma con backend que acepten los mismos límites.
   */
  protected readonly form = this.fb.group({
    student: this.fb.control<StudentSummary | null>(null, Validators.required),
    reporterName: this.fb.control('', [Validators.required, notBlank, Validators.maxLength(this.reporterMax)]),
    relationId: this.fb.control('', Validators.required),
    categoryId: this.fb.control('', Validators.required),
    channelId: this.fb.control('', Validators.required),
    urgencyId: this.fb.control('', Validators.required),
    description: this.fb.control('', [Validators.required, notBlank, Validators.maxLength(this.descriptionMax)]),
  });

  // ---------- Estado ----------
  protected readonly catalogs = signal<ReportCatalogs>({ relations: [], categories: [], channels: [], urgencies: [] });
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly success = signal(false);
  protected readonly submitError = signal<string | null>(null);

  // ---------- Panel de ayuda (el mismo de la pantalla del listado) ----------
  protected readonly helpOpen = signal(false);
  protected readonly riskRanges = signal<RiskRange[]>([]);
  protected readonly rangesLoading = signal(false);
  protected readonly rangesError = signal<string | null>(null);

  constructor() {
    this.loadCatalogs();
    this.prefillStudent();
  }

  // ---------------------------------------------------------------- carga de datos

  private loadCatalogs(): void {
    this.service
      .getReportCatalogs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogs) => this.catalogs.set(catalogs),
        // LIB: si la librería tiene servicio de notificaciones (snackbar/toast), úsalo aquí.
        error: () => this.loadError.set('No se pudieron cargar las listas del formulario. Recarga la página.'),
      });
  }

  /** Viene de la tabla: <ruta del módulo>/crear?studentId=123 */
  private prefillStudent(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('studentId'));
    if (!id) return;

    this.service
      .getStudentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (student) => {
          // Si el usuario ya empezó a escribir otro estudiante, no se lo pisamos.
          if (student && !this.form.controls.student.dirty) this.form.controls.student.setValue(student);
        },
        error: () => {
          /* Si falla, el usuario simplemente lo busca a mano. */
        },
      });
  }

  // ---------------------------------------------------------------- acciones

  protected onSubmit(): void {
    this.success.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set(null);
    this.form.disable();

    this.service
      .createReport({
        // El formulario ya es válido, así que el estudiante no es null.
        studentId: value.student!.id,
        reporterName: value.reporterName.trim(),
        relationId: value.relationId,
        categoryId: value.categoryId,
        channelId: value.channelId,
        urgencyId: value.urgencyId,
        description: value.description.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.enable();
          this.form.reset();
          // LIB: aquí va la notificación de éxito (snackbar/toast/alert de la librería).
          // TODO: decidir con el negocio si, al enviar, se vuelve al listado o se queda aquí.
          this.success.set(true);
        },
        error: () => {
          this.saving.set(false);
          this.form.enable();
          this.submitError.set('No se pudo enviar el reporte. Intenta de nuevo.');
        },
      });
  }

  protected onCancel(): void {
    // LIB: reemplazar confirm() por el dialog de confirmación de la librería.
    if (this.form.dirty && !confirm('Hay cambios sin guardar. ¿Quieres salir sin enviar el reporte?')) {
      return;
    }
    this.router.navigate([RR_PATHS.list]);
  }

  protected onHelp(): void {
    this.helpOpen.set(true);
    if (this.riskRanges().length === 0 && !this.rangesLoading()) {
      this.loadRiskRanges();
    }
  }

  private loadRiskRanges(): void {
    this.rangesLoading.set(true);
    this.rangesError.set(null);
    this.service
      .getRiskRanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ranges) => {
          this.riskRanges.set(ranges);
          this.rangesLoading.set(false);
        },
        error: () => {
          this.rangesError.set('No se pudo cargar la información de ayuda.');
          this.rangesLoading.set(false);
        },
      });
  }

  /** Lleva el foco al primer campo con error (cuando se pulsa "Guardar" con el formulario incompleto). */
  private focusFirstInvalid(): void {
    // Se espera al render: la clase .is-invalid solo existe después de pintar los errores.
    afterNextRender(
      () => {
        this.host.nativeElement
          .querySelector<HTMLElement>('.is-invalid input, .is-invalid select, .is-invalid textarea')
          ?.focus();
      },
      { injector: this.injector },
    );
  }
}
