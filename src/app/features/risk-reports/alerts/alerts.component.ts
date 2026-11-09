import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

import { IconComponent } from '../../../shared/icon/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PageChange } from '../../../shared/paginator/paginator.component';
import { SearchInputComponent } from '../../../shared/search-input/search-input.component';
import { AlertsTableComponent } from '../components/alerts-table/alerts-table.component';
import { ALERT_TABS, Alert, AlertCounts, AlertStatus } from '../models/alert.model';
import { RiskReportsService } from '../services/risk-reports.service';
import { RR_PATHS } from '../risk-reports.paths';

const EMPTY_COUNTS: AlertCounts = { ACTIVA: 0, EN_ATENCION: 0, ESCALADA: 0, ATENDIDA: 0 };

/**
 * Pantalla "Gestionar alertas": pestañas por estado, filtros y tabla.
 * Elegir una alerta lleva a la vista de intervención (alert-detail).
 *
 * La pestaña activa vive en la URL (?estado=ESCALADA) para que al volver desde
 * la intervención se regrese a la misma pestaña, y para poder compartir el enlace.
 *
 * Es el único componente que habla con el servicio. Cualquier cambio de
 * pestaña / página / filtro actualiza `request` y eso dispara la petición
 * (la anterior se cancela con switchMap). Los conteos de las pestañas se piden
 * aparte, con el mismo buscador y fecha.
 */
@Component({
  selector: 'app-alerts',
  imports: [PageHeaderComponent, SearchInputComponent, AlertsTableComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Activa el tema del módulo (variables y botones); ver risk-reports.theme.scss.
  host: { class: 'rr-theme' },
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss',
})
export class AlertsComponent {
  private readonly service = inject(RiskReportsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = ALERT_TABS;
  protected readonly status = signal<AlertStatus>(this.initialStatus());

  protected readonly alerts = signal<Alert[]>([]);
  protected readonly total = signal(0);
  protected readonly counts = signal<AlertCounts>(EMPTY_COUNTS);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly page = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageSizeOptions = [5, 10, 25, 100];

  /** Texto del buscador tal como se escribe (sin debounce) y el que ya se aplicó. */
  protected readonly searchText = signal('');
  private readonly search = signal('');
  /** "yyyy-MM-dd" o ''. */
  protected readonly date = signal('');
  private readonly reloadTick = signal(0);

  protected readonly hasFilters = computed(() => !!this.searchText() || !!this.date());

  private readonly filters = computed(() => ({ search: this.search(), date: this.date() }));

  private readonly request = computed(() => ({
    status: this.status(),
    page: this.page(),
    size: this.pageSize(),
    ...this.filters(),
    tick: this.reloadTick(),
  }));

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.listenAlertsRequests();
    this.listenCountsRequests();
    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        this.search.set(text.trim());
        this.page.set(0);
      });
  }

  private initialStatus(): AlertStatus {
    const wanted = this.route.snapshot.queryParamMap.get('estado');
    return ALERT_TABS.find((t) => t.id === wanted)?.id ?? 'ACTIVA';
  }

  private listenAlertsRequests(): void {
    toObservable(this.request)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ status, page, size, search, date }) =>
          this.service.getAlerts({ status, page, size, search, date }).pipe(
            catchError(() => {
              // LIB: equivale al @Output errorLoadData de mat-table-full.
              this.error.set('No se pudo cargar el listado de alertas.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.alerts.set(res.content);
        this.total.set(res.totalElements);
      });
  }

  private listenCountsRequests(): void {
    // Los conteos no dependen de la pestaña ni de la página, solo de los filtros y del botón refrescar.
    toObservable(computed(() => ({ ...this.filters(), tick: this.reloadTick() })))
      .pipe(
        switchMap(({ search, date }) =>
          this.service.getAlertCounts({ search, date }).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((counts) => {
        if (counts) this.counts.set(counts);
      });
  }

  protected selectTab(id: AlertStatus): void {
    if (id === this.status()) return;
    this.status.set(id);
    this.page.set(0);
    // Se refleja en la URL sin agregar un paso al historial.
    this.router.navigate([], { relativeTo: this.route, queryParams: { estado: id }, replaceUrl: true });
  }

  protected onSearch(text: string): void {
    this.searchText.set(text);
    this.searchInput$.next(text);
  }

  protected onDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
    this.page.set(0);
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.searchInput$.next('');
    this.search.set('');
    this.date.set('');
    this.page.set(0);
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }

  protected onPageChange(change: PageChange): void {
    this.page.set(change.page);
    this.pageSize.set(change.size);
  }

  protected onRowSelect(alert: Alert): void {
    this.router.navigate([RR_PATHS.alerts, alert.id]);
  }

  protected goBack(): void {
    this.router.navigate([RR_PATHS.list]);
  }
}
