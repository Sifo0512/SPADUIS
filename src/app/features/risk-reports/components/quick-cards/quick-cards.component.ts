import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent, IconName } from '../../../../shared/icon/icon.component';

export interface QuickCard {
  id: string;
  /** Texto pequeño de arriba: "Crear", "Gestionar", "Configurar". */
  label: string;
  /** Texto grande: "Registro de reporte", "Alertas", "Parámetros". */
  title: string;
  icon: IconName;
  color: 'green' | 'orange' | 'purple' | 'blue';
}

/**
 * LIB: reemplazar cada tarjeta por la card clicable de la librería
 * (busca algo como: action-card, nav-card, link-card, shortcut-card).
 * Necesita: ícono con fondo de color + dos líneas de texto + flecha ">".
 */
@Component({
  selector: 'app-quick-cards',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (card of cards(); track card.id) {
      <button type="button" class="card" (click)="cardClick.emit(card)">
        <span class="icon-box" [class]="'icon-box--' + card.color">
          <app-icon [name]="card.icon" style="--icon-size: 24px" />
        </span>
        <span class="text">
          <small>{{ card.label }}</small>
          <strong>{{ card.title }}</strong>
        </span>
        <app-icon name="chevron-right" class="arrow" />
      </button>
    }
  `,
  styleUrl: './quick-cards.component.scss',
})
export class QuickCardsComponent {
  readonly cards = input.required<QuickCard[]>();
  readonly cardClick = output<QuickCard>();
}
