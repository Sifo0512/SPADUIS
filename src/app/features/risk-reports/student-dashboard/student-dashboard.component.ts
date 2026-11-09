import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of, catchError, tap } from 'rxjs';

import { DialogComponent } from '../../../shared/dialog/dialog.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { RiskTagComponent } from '../components/risk-tag/risk-tag.component';
import { StudentPickerComponent } from '../components/student-picker/student-picker.component';
import { StudentSummary } from '../models/create-report.model';
import {
  DimensionCard,
  DimensionDetail,
  DimensionId,
  ExportFile,
  RiskCalculation,
  StudentDashboard,
} from '../models/dashboard.model';
import { RiskLevel } from '../models/student-risk.model';
import { RR_PATHS } from '../risk-reports.paths';
import { RiskReportsService } from '../services/risk-reports.service';

/**
 * Dashboard "Riesgo de deserción" de un estudiante.
 *  - Buscar: el mismo autocomplete de "Crear reporte" (al elegir, cambia la URL).
 *  - Muestra el índice, el resumen y una tarjeta por dimensión; "Ver todas las
 *    variables" abre las variables de esa dimensión.
 *  - Exporta a Excel las variables de este estudiante o de todos.
 *
 * Es el único componente que habla con el servicio.
 *
 * LIB: tarjetas -> card; barra de progreso -> progress; tags -> chip/badge.
 */
@Component({
  selector: 'app-student-dashboard',
  imports: [IconComponent, DialogComponent, RiskTagComponent, StudentPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'rr-theme' },
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  private readonly service = inject(RiskReportsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly picker = new FormControl<StudentSummary | null>(null);

  protected readonly data = signal<StudentDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly dimension = signal<DimensionDetail | null>(null);
  protected readonly dimensionLoading = signal(false);
  protected readonly calculation = signal<RiskCalculation | null>(null);
  protected readonly calculationOpen = signal(false);

  protected readonly exporting = signal<'one' | 'all' | null>(null);
  protected readonly exportError = signal<string | null>(null);

  constructor() {
    this.picker.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
      if (s) this.router.navigate([RR_PATHS.student, s.id]);
    });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          if (!params.get('id') || Number.isNaN(id)) {
            this.data.set(null);
            this.error.set(null);
            return of(null);
          }
          this.loading.set(true);
          this.error.set(null);
          return this.service.getStudentDashboard(id).pipe(
            catchError(() => {
              this.error.set('No se pudo cargar la información del estudiante.');
              return of(null);
            }),
          );
        }),
        tap(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((d) => this.data.set(d));
  }

  protected goBack(): void {
    this.router.navigate([RR_PATHS.list]);
  }

  protected level(l: string | null): RiskLevel {
    return (l ?? 'Bajo') as RiskLevel;
  }

  protected pct(index: number | null): number {
    return Math.round((index ?? 0) * 100);
  }

  protected tone(l: string | null): string {
    return { Bajo: 'low', Medio: 'medium', Alto: 'high', 'Muy alto': 'very-high' }[l ?? ''] ?? 'low';
  }

  protected initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  // ---------------------------------------------------------------- diálogos

  protected openDimension(id: DimensionId): void {
    const d = this.data();
    if (!d) return;
    this.dimension.set(null);
    this.dimensionLoading.set(true);
    this.service
      .getDimensionDetail(d.student.id, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.dimension.set(detail);
          this.dimensionLoading.set(false);
        },
        error: () => {
          this.dimensionLoading.set(false);
          this.error.set('No se pudieron cargar las variables.');
        },
      });
  }

  protected closeDimension(): void {
    this.dimension.set(null);
    this.dimensionLoading.set(false);
  }

  protected openCalculation(): void {
    const d = this.data();
    if (!d) return;
    this.calculationOpen.set(true);
    this.calculation.set(null);
    this.service
      .getRiskCalculation(d.student.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => this.calculation.set(c),
        error: () => {
          this.calculationOpen.set(false);
          this.error.set('No se pudo cargar el cálculo del índice.');
        },
      });
  }

  protected closeCalculation(): void {
    this.calculationOpen.set(false);
  }

  protected card(id: DimensionId): DimensionCard | undefined {
    return this.data()?.dimensions.find((c) => c.id === id);
  }

  // ---------------------------------------------------------------- exportar

  protected exportOne(): void {
    const d = this.data();
    if (d) this.export('one', { studentId: d.student.id });
  }

  protected exportAll(): void {
    this.export('all', {});
  }

  private export(kind: 'one' | 'all', opts: { studentId?: number }): void {
    this.exporting.set(kind);
    this.exportError.set(null);
    this.service.downloadVariablesExcel(opts).subscribe({
      next: (file: ExportFile) => {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(null);
      },
      error: () => {
        this.exporting.set(null);
        this.exportError.set('No se pudo generar el archivo de Excel.');
      },
    });
  }
}
