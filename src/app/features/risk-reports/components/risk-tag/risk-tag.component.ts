import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RiskLevel } from '../../models/student-risk.model';

const CLASS_BY_LEVEL: Record<RiskLevel | 'Crítico', string> = {
  Bajo: 'tag--low',
  Medio: 'tag--medium',
  Alto: 'tag--high',
  'Muy alto': 'tag--very-high',
  Crítico: 'tag--very-high',
};

@Component({
  selector: 'app-risk-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tag" [class]="cssClass()">{{ level() }}</span>`,
  styles: `
    .tag {
      display: inline-block;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 600;
      line-height: 18px;
      white-space: nowrap;
      border: 1px solid;
      border-radius: 6px;
    }
    /* Estilos alineados con la referencia visual */
    .tag--low {
      background: #e6f4ea;
      color: #137333;
      border-color: #a8dab5;
    }
    .tag--medium {
      background: #e3f2fd;
      color: #1976d2;
      border-color: #90caf9;
    }
    .tag--high {
      background: #fef7e0;
      color: #b06000;
      border-color: #fdd663;
    }
    .tag--very-high {
      background: #fce8e6;
      color: #c5221f;
      border-color: #f87171;
    }
  `,
})
export class RiskTagComponent {
  readonly level = input.required<RiskLevel | 'Crítico'>();
  protected readonly cssClass = computed(() => `tag ${CLASS_BY_LEVEL[this.level()]}`);
}