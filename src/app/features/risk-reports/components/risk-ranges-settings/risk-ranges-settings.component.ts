import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { RiskRange } from '../../models/risk-range.model';
import { RiskReportsService } from '../../services/risk-reports.service';

/**
 * Configuración "Categorías de riesgo": los cortes entre Bajo / Medio / Alto / Muy alto.
 * Solo se editan los límites superiores de los 3 primeros niveles; el "desde" de cada
 * nivel es siempre el "hasta" del anterior y el último termina en 1 (así nunca quedan huecos).
 */
@Component({
  selector: 'app-risk-ranges-settings',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './risk-ranges-settings.component.html',
  styleUrl: './risk-ranges-settings.component.scss',
})
export class RiskRangesSettingsComponent {
  private readonly service = inject(RiskReportsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly ranges = signal<RiskRange[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);

  constructor() {
    this.service
      .getRiskRanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => { this.ranges.set(r.map((x) => ({ ...x }))); this.loading.set(false); },
        error: () => { this.loading.set(false); this.message.set({ ok: false, text: 'No se pudieron cargar los rangos.' }); },
      });
  }

  /** Cambia el "hasta" del nivel i y arrastra el "desde" del siguiente. */
  protected setMax(i: number, value: number | string): void {
    const n = Number(value);
    this.ranges.update((rs) =>
      rs.map((r, k) => (k === i ? { ...r, max: n } : k === i + 1 ? { ...r, min: n } : r)),
    );
    this.message.set(null);
  }

  protected save(): void {
    this.saving.set(true);
    this.message.set(null);
    this.service
      .updateRiskRanges(this.ranges())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.ranges.set(r.map((x) => ({ ...x })));
          this.saving.set(false);
          this.message.set({ ok: true, text: 'Rangos guardados. Los nuevos cortes aplican de inmediato.' });
        },
        error: (err) => {
          this.saving.set(false);
          this.message.set({ ok: false, text: err?.error?.detail ?? 'No se pudieron guardar los rangos.' });
        },
      });
  }
}
