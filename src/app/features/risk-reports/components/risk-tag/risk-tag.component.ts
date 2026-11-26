import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RiskLevel } from '../../models/student-risk.model';

// Clase CSS por nivel ("Muy alto" tiene un espacio, por eso no se arma con el texto).
const CLASS_BY_LEVEL: Record<RiskLevel | 'Crítico', string> = {
  Bajo: 'tag--low',
  Medio: 'tag--medium',
  Alto: 'tag--high',
  'Muy alto': 'tag--very-high',
  Crítico: 'tag--very-high',
};

/**
 * LIB: reemplazar por el tag / chip / badge de estado de la librería.
 * Mapeo de variantes: Bajo -> success (verde), Medio -> info (azul),
 * Alto -> warning (naranja), Muy alto -> error/danger (rojo).
 */
@Component({
  selector: 'app-risk-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tag" [class]="cssClass()">{{ level() }}</span>`,
  styles: `
    .tag {
      display: inline-block;
      padding: 1px 8px;
      font-size: 12px;
      line-height: 18px;
      color: var(--text);
      white-space: nowrap;
      border: 1px solid;
      border-radius: 4px;
    }
    .tag--low {
      background: #e3f6d8;
      border-color: #7cc65a;
    }
    .tag--medium {
      background: #dcecff;
      border-color: #5b9be6;
    }
    .tag--high {
      background: #fff1d6;
      border-color: #e6a23c;
    }
    .tag--very-high {
      background: #fddede;
      border-color: #e06a6a;
    }
  `,
})
export class RiskTagComponent {
  /** Nivel de riesgo del estudiante, o "Crítico" (nivel de una alerta). */
  readonly level = input.required<RiskLevel | 'Crítico'>();
  protected readonly cssClass = computed(() => `tag ${CLASS_BY_LEVEL[this.level()]}`);
}
