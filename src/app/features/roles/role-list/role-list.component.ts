import { Component, inject, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RoleService } from '../../../core/services/role.service';
import { Permission, Role } from '../../../core/models/user.model';
import { RoleFormComponent } from '../role-form/role-form.component';

export interface PermissionNode extends Permission {
  children: PermissionNode[];
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [RoleFormComponent, NgTemplateOutlet],
  template: `
    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Role Management</h1>
          <p class="text-gray-500 mt-1">{{ roles().length }} roles configured</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Add Role</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (role of roles(); track role.id) {
          <div class="card hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div class="flex gap-2">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" (click)="openEdit(role)">Edit</button>
                <button class="text-red-600 hover:text-red-800 text-sm font-medium" (click)="deleteRole(role.id)">Delete</button>
              </div>
            </div>
            <h3 class="font-semibold text-gray-900">{{ role.name }}</h3>
            @if (role.description) {
              <p class="text-gray-500 text-sm mt-1">{{ role.description }}</p>
            }
            @if (role.permissions?.length) {
              <div class="mt-3 border border-gray-100 rounded-lg overflow-hidden">
                <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Permissions
                </div>
                <ul class="p-2 space-y-0.5">
                  @for (node of buildTree(role.permissions!); track node.id) {
                    <ng-container *ngTemplateOutlet="permNode; context: { $implicit: node, depth: 0 }" />
                  }
                </ul>
              </div>
            }
          </div>
        } @empty {
          <div class="col-span-3 text-center py-12 text-gray-400">No roles found</div>
        }
      </div>
    </div>

    <!-- Recursive permission tree node template -->
    <ng-template #permNode let-node let-depth="depth">
      <li>
        @if (node.children.length) {
          <!-- Group / parent node -->
          <div class="flex items-center gap-1.5 py-0.5" [style.padding-left.px]="depth * 16">
            <svg class="w-3 h-3 text-purple-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
            <span class="text-xs font-semibold text-gray-700">{{ node.display_name }}</span>
          </div>
          <!-- Children indented under parent -->
          <ul class="space-y-0">
            @for (child of node.children; track child.id) {
              <ng-container *ngTemplateOutlet="permNode; context: { $implicit: child, depth: depth + 1 }" />
            }
          </ul>
        } @else {
          <!-- Leaf node -->
          <div class="flex items-center gap-1.5 py-0.5" [style.padding-left.px]="depth * 16 + 8">
            <span class="text-gray-300 shrink-0">–</span>
            <span class="text-xs text-gray-600 flex-1">{{ node.display_name }}</span>
            @if (node.method) {
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                [class]="methodClass(node.method)">{{ node.method }}</span>
            }
          </div>
        }
      </li>
    </ng-template>

    @if (showForm()) {
      <app-role-form
        [role]="selectedRole()"
        (saved)="onSaved()"
        (cancelled)="showForm.set(false)" />
    }
  `
})
export class RoleListComponent implements OnInit {
  private roleService = inject(RoleService);

  roles = signal<Role[]>([]);
  showForm = signal(false);
  selectedRole = signal<Role | null>(null);

  ngOnInit() { this.loadRoles(); }

  loadRoles() {
    this.roleService.getRoles().subscribe(roles => this.roles.set(roles));
  }

  buildTree(permissions: Permission[]): PermissionNode[] {
    const map = new Map<number, PermissionNode>();
    const roots: PermissionNode[] = [];

    // First pass: create nodes
    for (const p of permissions) {
      map.set(p.id, { ...p, children: [] });
    }

    // Second pass: wire up parent/child relationships
    for (const node of map.values()) {
      const parent = node.parent_id ? map.get(node.parent_id) : null;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Sort by sort_order at each level
    const sort = (nodes: PermissionNode[]) => {
      nodes.sort((a, b) => a.sort_order - b.sort_order);
      nodes.forEach(n => sort(n.children));
    };
    sort(roots);

    return roots;
  }

  methodClass(method: string): string {
    const map: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      PATCH: 'bg-orange-100 text-orange-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return map[method.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
  }

  openCreate() { this.selectedRole.set(null); this.showForm.set(true); }
  openEdit(role: Role) { this.selectedRole.set(role); this.showForm.set(true); }

  deleteRole(id: number) {
    if (!confirm('Delete this role?')) return;
    this.roleService.deleteRole(id).subscribe(() => this.loadRoles());
  }

  onSaved() { this.showForm.set(false); this.loadRoles(); }
}
