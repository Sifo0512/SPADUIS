import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';

import { DialogComponent } from '../../../shared/dialog/dialog.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PageChange } from '../../../shared/paginator/paginator.component';
import { SearchInputComponent } from '../../../shared/search-input/search-input.component';
import { SideListComponent, SideListItem } from '../../../shared/side-list/side-list.component';
import { CareTeamDialogComponent } from '../components/care-team-dialog/care-team-dialog.component';
import { CareTeamsTableComponent } from '../components/care-teams-table/care-teams-table.component';
import { CareTeam, CareTeamPayload } from '../models/care-team.model';
import { RiskReportsService } from '../services/risk-reports.service';
import { RR_PATHS } from '../risk-reports.paths';

/**
 * BACK: las configuraciones disponibles (panel izquierdo). Hoy son fijas; si
 * dependen de permisos del usuario, pedirlas al backend.
 */
const SECTIONS: SideListItem[] = [
  { id: 'care-teams', label: 'Equipos de atención' },
  { id: 'agents', label: 'Agentes' },
  { id: 'risk-categories', label: 'Categorías de riesgo' },
  { id: 'alert-params', label: 'Parámetros de alerta' },
];

/**
 * Pantalla "Configuración de parámetros de índice de riesgo".
 *
 * Solo "Equipos de atención" está construida (es la única con mockup). Las otras
 * tres opciones del panel izquierdo muestran un aviso hasta tener su diseño.
 *
 * Igual que las otras pantallas, es el único componente que habla con el
 * servicio; la tabla, los diálogos y el panel son piezas reemplazables.
 *
 * Flujo de la tabla: cualquier cambio de página / tamaño / filtro actualiza el
 * signal `request`, y eso dispara getCareTeams() (la petición anterior se cancela).
 * Crear, editar y eliminar vuelven a pedir la lista al terminar.
 */
@Component({
  selector: 'app-parameters',
  imports: [
    PageHeaderComponent,
    SideListComponent,
    SearchInputComponent,
    CareTeamsTableComponent,
    CareTeamDialogComponent,
    DialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Activa el tema del módulo (variables y botones); ver risk-reports.theme.scss.
  host: { class: 'rr-theme' },
  templateUrl: './parameters.component.html',
  styleUrl: './parameters.component.scss',
})
export class ParametersComponent {
  private readonly service = inject(RiskReportsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ---------- Panel izquierdo ----------
  protected readonly sections = SECTIONS;
  protected readonly selectedId = signal(SECTIONS[0].id);
  protected readonly selectedSection = computed(
    () => this.sections.find((s) => s.id === this.selectedId()) ?? this.sections[0],
  );
  protected readonly sidebarCollapsed = signal(false);

  // ---------- Tabla ----------
  protected readonly teams = signal<CareTeam[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(5);
  protected readonly search = signal('');
  private readonly reloadTick = signal(0);

  protected readonly pageSizeOptions = [5, 10, 25, 100];

  // ---------- Diálogos ----------
  protected readonly formOpen = signal(false);
  protected readonly editingTeam = signal<CareTeam | null>(null);
  protected readonly deletingTeam = signal<CareTeam | null>(null);
  protected readonly working = signal(false);
  protected readonly dialogError = signal<string | null>(null);

  /** Todo lo que, al cambiar, obliga a volver a pedir los equipos. */
  private readonly request = computed(() => ({
    page: this.page(),
    size: this.pageSize(),
    search: this.search(),
    tick: this.reloadTick(),
  }));

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.listenTeamsRequests();
    this.listenSearchInput();
  }

  // ---------------------------------------------------------------- carga de datos

  private listenTeamsRequests(): void {
    toObservable(this.request)
      .pipe(
        // Las otras configuraciones todavía no tienen datos que pedir.
        filter(() => this.selectedId() === 'care-teams'),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        // switchMap cancela la petición anterior si el usuario cambia algo rápido.
        switchMap(({ page, size, search }) =>
          this.service.getCareTeams({ page, size, search }).pipe(
            catchError(() => {
              // LIB: equivale al @Output errorLoadData de mat-table-full.
              this.error.set('No se pudo cargar el listado de equipos.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;

        this.teams.set(res.content);
        this.total.set(res.totalElements);

        // Si se borró el último registro de la página, se retrocede a la última que sí tiene datos.
        if (res.content.length === 0 && this.page() > 0) {
          this.page.set(Math.max(0, Math.ceil(res.totalElements / this.pageSize()) - 1));
        }
      });
  }

  private listenSearchInput(): void {
    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        this.search.set(text.trim());
        this.page.set(0);
      });
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }

  // ---------------------------------------------------------------- panel izquierdo y tabla

  protected onSelectSection(item: SideListItem): void {
    this.selectedId.set(item.id);
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  protected onSearch(text: string): void {
    this.searchInput$.next(text);
  }

  protected onPageChange(change: PageChange): void {
    this.page.set(change.page);
    this.pageSize.set(change.size);
  }

  protected goBack(): void {
    this.router.navigate([RR_PATHS.list]);
  }

  // ---------------------------------------------------------------- crear / editar

  protected openCreate(): void {
    this.editingTeam.set(null);
    this.dialogError.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(team: CareTeam): void {
    this.editingTeam.set(team);
    this.dialogError.set(null);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    // Mientras se guarda no se deja cerrar, para no perder la respuesta.
    if (this.working()) return;
    this.formOpen.set(false);
    this.editingTeam.set(null);
    this.dialogError.set(null);
  }

  protected onSave(payload: CareTeamPayload): void {
    const editing = this.editingTeam();
    this.working.set(true);
    this.dialogError.set(null);

    const request$ = editing
      ? this.service.updateCareTeam(editing.id, payload)
      : this.service.createCareTeam(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.working.set(false);
        this.closeForm();
        // LIB: aquí va la notificación de éxito (snackbar/toast de la librería).
        this.reload();
      },
      error: (err) => {
        this.working.set(false);
        // BACK: confirmar con backend que responda 409 cuando el nombre ya existe.
        this.dialogError.set(
          err?.status === 409 ? 'Ya existe un equipo con ese nombre.' : 'No se pudo guardar el equipo. Intenta de nuevo.',
        );
      },
    });
  }

  // ---------------------------------------------------------------- eliminar

  protected openDelete(team: CareTeam): void {
    this.dialogError.set(null);
    this.deletingTeam.set(team);
  }

  protected closeDelete(): void {
    if (this.working()) return;
    this.deletingTeam.set(null);
    this.dialogError.set(null);
  }

  protected confirmDelete(): void {
    const team = this.deletingTeam();
    if (!team) return;

    this.working.set(true);
    this.dialogError.set(null);

    this.service
      .deleteCareTeam(team.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.working.set(false);
          this.closeDelete();
          // LIB: aquí va la notificación de éxito (snackbar/toast de la librería).
          this.reload();
        },
        error: () => {
          this.working.set(false);
          // BACK: un equipo con agentes o reportes asociados podría no poder borrarse (409).
          this.dialogError.set('No se pudo eliminar el equipo. Intenta de nuevo.');
        },
      });
  }
}
