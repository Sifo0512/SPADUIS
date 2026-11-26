import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { RiskModel, RiskModelTerm } from '../../models/risk-model.model';
import { RiskReportsService } from '../../services/risk-reports.service';

/**
 * Configuración "Ponderadores del modelo": divisor del índice y ponderador de cada variable.
 * índice = (Σ aportes de los términos activos) ÷ divisor.
 */
@Component({
  selector: 'app-risk-weights-settings',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './risk-weights-settings.component.html',
  styleUrl: './risk-weights-settings.component.scss',
})
export class RiskWeightsSettingsComponent {
  private readonly service = inject(RiskReportsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly model = signal<RiskModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);

  constructor() {
    this.service
      .getRiskModel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (m) => { this.model.set(m); this.loading.set(false); },
        error: () => { this.loading.set(false); this.message.set({ ok: false, text: 'No se pudo cargar el modelo.' }); },
      });
  }

  protected setDivisor(v: number | string): void {
    this.model.update((m) => (m ? { ...m, divisor: Number(v) } : m));
    this.message.set(null);
  }

  protected patch(code: string, change: Partial<Pick<RiskModelTerm, 'weight' | 'active'>>): void {
    this.model.update((m) =>
      m ? { ...m, terms: m.terms.map((t) => (t.code === code ? { ...t, ...change } : t)) } : m,
    );
    this.message.set(null);
  }

  protected save(): void {
    const m = this.model();
    if (!m) return;
    this.saving.set(true);
    this.message.set(null);
    this.service
      .updateRiskModel({
        divisor: m.divisor,
        terms: m.terms.map((t) => ({ code: t.code, weight: Number(t.weight), active: t.active })),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.model.set(saved);
          this.saving.set(false);
          this.message.set({ ok: true, text: 'Modelo guardado. Los índices se recalculan con los nuevos valores.' });
        },
        error: (err) => {
          this.saving.set(false);
          this.message.set({ ok: false, text: err?.error?.detail ?? 'No se pudo guardar el modelo.' });
        },
      });
  }
}
