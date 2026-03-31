import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { User, Role } from '../../../core/models/user.model';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserFormComponent, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
          <p class="text-gray-500 mt-1">{{ total() }} users total</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Add User</button>
      </div>

      <div class="card overflow-hidden p-0">
        <!-- Filters -->
        <div class="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-4">
          <select class="input-field w-48" [(ngModel)]="filterRoleId" (ngModelChange)="applyFilters()">
            <option [ngValue]="null">All Roles</option>
            @for (role of allRoles(); track role.id) {
              <option [ngValue]="role.id">{{ role.name }}</option>
            }
          </select>
          <select class="input-field w-40" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
            <option [ngValue]="null">All Statuses</option>
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Inactive</option>
          </select>
          <button class="btn-secondary text-sm" (click)="clearFilters()">Clear</button>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">User</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Email</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Roles</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Status</th>
              <th class="text-right px-6 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (user of users(); track user.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs">
                      {{ user.username[0].toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ user.username }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-gray-600">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    @for (role of user.roles; track role.id) {
                      <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{{ role.name }}</span>
                    }
                  </div>
                </td>
                <td class="px-6 py-4">
                  @if (user.is_active) {
                    <span class="badge-active">Active</span>
                  } @else {
                    <span class="badge-inactive">Inactive</span>
                  }
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                    (click)="openEdit(user)">Edit</button>
                  <button class="text-red-600 hover:text-red-800 text-sm font-medium"
                    (click)="deleteUser(user.id)">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-400">No users found</td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-sm text-gray-500">Page {{ page() }} of {{ totalPages() }}</p>
          <div class="flex gap-2">
            <button class="btn-secondary text-sm py-1 px-3" [disabled]="page() === 1" (click)="prevPage()">Previous</button>
            <button class="btn-secondary text-sm py-1 px-3" [disabled]="page() >= totalPages()" (click)="nextPage()">Next</button>
          </div>
        </div>
      </div>
    </div>

    @if (showForm()) {
      <app-user-form
        [user]="selectedUser()"
        [roles]="allRoles()"
        (saved)="onSaved()"
        (cancelled)="showForm.set(false)" />
    }
  `
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  users = signal<User[]>([]);
  allRoles = signal<Role[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = 10;
  totalPages = signal(1);
  showForm = signal(false);
  selectedUser = signal<User | null>(null);

  filterStatus: boolean | null = null;

  filterRoleId: number | null = null;

  ngOnInit() {
    this.loadUsers();
    this.roleService.getRoles().subscribe(roles => this.allRoles.set(roles));
  }

  loadUsers() {
    const filters: { role_id?: number; status?: boolean } = {};
    if (this.filterRoleId != null) filters.role_id = this.filterRoleId;
    if (this.filterStatus != null) filters.status = this.filterStatus;
    this.userService.getUsers(this.page(), this.pageSize, filters).subscribe(res => {
      this.users.set(res.items);
      this.total.set(res.total);
      this.totalPages.set(Math.ceil(res.total / this.pageSize));
    });
  }

  applyFilters() {
    this.page.set(1);
    this.loadUsers();
  }

  clearFilters() {
    this.filterRoleId = null;
    this.filterStatus = null;
    this.applyFilters();
  }

  openCreate() {
    this.selectedUser.set(null);
    this.showForm.set(true);
  }

  openEdit(user: User) {
    this.selectedUser.set(user);
    this.showForm.set(true);
  }

  deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    this.userService.deleteUser(id).subscribe(() => this.loadUsers());
  }

  onSaved() {
    this.showForm.set(false);
    this.loadUsers();
  }

  prevPage() { this.page.update(p => p - 1); this.loadUsers(); }
  nextPage() { this.page.update(p => p + 1); this.loadUsers(); }
}
