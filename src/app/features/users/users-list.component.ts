import { Component, OnInit, inject, signal } from '@angular/core';
import { User } from '../../core/auth/auth.service';
import { UserService } from './user.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { UserFormComponent } from './user-form.component';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { TableExportService } from '../../shared/services/table-export.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule
  ],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Usuarios</h1>
        <div class="flex items-center gap-2">
          @if (authService.isAdmin()) {
            <button mat-stroked-button color="primary" (click)="exportAsXLSX()">
              <mat-icon>download</mat-icon>
              Exportar a Excel
            </button>
          }
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>person_add</mat-icon>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="users()" class="w-full">
          
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let element">{{element.username}}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let element">{{element.role?.name}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let element">
              @if (element.isActive) {
                <mat-chip class="!bg-green-100 !text-green-800">Activo</mat-chip>
              } @else {
                <mat-chip class="!bg-red-100 !text-red-800">Inactivo</mat-chip>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="openDialog(element)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                @if (element.isActive) {
                  <button mat-menu-item (click)="toggleStatus(element)">
                    <mat-icon>block</mat-icon>
                    <span>Desactivar</span>
                  </button>
                } @else {
                  <button mat-menu-item (click)="toggleStatus(element)">
                    <mat-icon>check_circle</mat-icon>
                    <span>Activar</span>
                  </button>
                }
                <button mat-menu-item class="!text-red-600" (click)="deleteUser(element)">
                  <mat-icon class="!text-red-600">delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <mat-paginator 
          [length]="total()"
          [pageSize]="limit()"
          [pageSizeOptions]="[5, 10, 25, 100]"
          (page)="onPageChange($event)">
        </mat-paginator>
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly tableExportService = inject(TableExportService);
  readonly authService = inject(AuthService);

  users = signal<User[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  
  displayedColumns: string[] = ['username', 'role', 'status', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.userService.getAll({ page: this.page(), limit: this.limit() }).subscribe(res => {
      this.users.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  exportAsXLSX(): void {
    this.tableExportService.exportRows({
      rows$: this.userService.getAllUnpaginated(),
      fileName: 'usuarios',
      mapRow: (user) => ({
        Id: user.id,
        Usuario: user.username,
        Rol: user.role?.name ?? '',
        Estado: user.isActive ? 'Activo' : 'Inactivo'
      }),
      successMessage: 'Usuarios exportados correctamente.',
      errorMessage: 'No se pudieron exportar los usuarios.'
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadData();
  }

  openDialog(user?: User) {
    const ref = this.dialog.open(UserFormComponent, {
      data: { user },
      width: '400px'
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  toggleStatus(user: User) {
    const req = user.isActive ? this.userService.deactivate(user.id) : this.userService.activate(user.id);
    req.subscribe({
      next: () => {
        this.toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'}`);
        this.loadData();
      },
      error: () => this.toast.error('Error al cambiar el estado')
    });
  }

  deleteUser(user: User) {
    if (confirm(`¿Seguro que deseas eliminar a ${user.username}?`)) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.toast.success('Usuario eliminado');
          this.loadData();
        },
        error: () => this.toast.error('Error al eliminar')
      });
    }
  }
}
