import { Component, inject, input, output, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Role, Permission } from '../../../core/models/user.model';

interface PermissionNode {
  permission: Permission;
  children: PermissionNode[];
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-lg font-semibold">{{ role() ? 'Edit Role' : 'Create Role' }}</h2>
          <button (click)="cancelled.emit()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input formControlName="name" class="input-field" placeholder="e.g. admin, editor">
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <p class="text-red-500 text-xs mt-1">Name is required</p>
            }
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea formControlName="description" class="input-field" rows="2"
              placeholder="Role description"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            @if (permissionTree().length) {
              <div class="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                @for (node of permissionTree(); track node.permission.id) {
                  <ng-container *ngTemplateOutlet="treeNode; context: { node: node, depth: 0 }"></ng-container>
                }
              </div>
            } @else {
              <p class="text-sm text-gray-400 italic">No permissions defined yet.</p>
            }
          </div>
          @if (error()) {
            <p class="text-red-500 text-sm">{{ error() }}</p>
          }
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="btn-secondary" (click)="cancelled.emit()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ng-template #treeNode let-node="node" let-depth="depth">
      <div [style.padding-left.px]="depth * 16">
        <div class="flex items-center gap-1 py-0.5">
          <!-- expand/collapse toggle for nodes with children -->
          @if (node.children.length) {
            <button type="button" (click)="toggleExpand(node.permission.id)"
              class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0">
              <svg class="w-3 h-3 transition-transform" [class.rotate-90]="isExpanded(node.permission.id)"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          } @else {
            <span class="w-4 flex-shrink-0"></span>
          }
          <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 flex-1 min-w-0">
            <input type="checkbox"
              [checked]="getNodeCheckState(node) === 'all'"
              [indeterminate]="getNodeCheckState(node) === 'some'"
              (change)="toggleNode(node, $event)"
              class="rounded border-gray-300 text-blue-600 flex-shrink-0">
            <span class="text-sm font-medium truncate">{{ node.permission.display_name || node.permission.name }}</span>
            @if (node.permission.method) {
              <span class="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                [class]="methodClass(node.permission.method)">{{ node.permission.method }}</span>
            }
          </label>
        </div>
        @if (node.children.length && isExpanded(node.permission.id)) {
          @for (child of node.children; track child.permission.id) {
            <ng-container *ngTemplateOutlet="treeNode; context: { node: child, depth: depth + 1 }"></ng-container>
          }
        }
      </div>
    </ng-template>
  `
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);

  role = input<Role | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  loading = signal(false);
  error = signal('');
  allPermissions = signal<Permission[]>([]);
  selectedPermissionIds = signal<number[]>([]);
  expandedIds = signal<Set<number>>(new Set());

  permissionTree = computed(() => this.buildTree(this.allPermissions(), 0));

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.permissionService.getPermissions().subscribe(perms => {
      this.allPermissions.set(perms);
      // auto-expand all parent nodes
      const parentIds = new Set(perms.filter(p => p.parent_id === 0 || perms.some(x => x.parent_id === p.id)).map(p => p.id));
      this.expandedIds.set(parentIds);
    });

    const r = this.role();
    if (r) {
      this.form.patchValue({ name: r.name, description: r.description ?? '' });
      this.selectedPermissionIds.set(r.permissions?.map(p => p.id) ?? []);
    }
  }

  private buildTree(perms: Permission[], parentId: number): PermissionNode[] {
    return perms
      .filter(p => p.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(p => ({ permission: p, children: this.buildTree(perms, p.id) }));
  }

  private getAllLeafIds(node: PermissionNode): number[] {
    if (!node.children.length) return [node.permission.id];
    return node.children.flatMap(c => this.getAllLeafIds(c));
  }

  private getAllIds(node: PermissionNode): number[] {
    return [node.permission.id, ...node.children.flatMap(c => this.getAllIds(c))];
  }

  getNodeCheckState(node: PermissionNode): 'all' | 'some' | 'none' {
    const ids = this.getAllIds(node);
    const selected = this.selectedPermissionIds();
    const count = ids.filter(id => selected.includes(id)).length;
    if (count === 0) return 'none';
    if (count === ids.length) return 'all';
    return 'some';
  }

  private getAncestorIds(permId: number): number[] {
    const perms = this.allPermissions();
    const ancestors: number[] = [];
    let current = perms.find(p => p.id === permId);
    while (current && current.parent_id !== 0) {
      ancestors.push(current.parent_id);
      current = perms.find(p => p.id === current!.parent_id);
    }
    return ancestors;
  }

  toggleNode(node: PermissionNode, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.getAllIds(node);
    if (checked) {
      const ancestorIds = this.getAncestorIds(node.permission.id);
      this.selectedPermissionIds.update(sel => [...new Set([...sel, ...ids, ...ancestorIds])]);
    } else {
      // when unchecking, also uncheck ancestors only if no other siblings remain selected
      const perms = this.allPermissions();
      this.selectedPermissionIds.update(sel => {
        let next = sel.filter(id => !ids.includes(id));
        // walk up and remove parent if none of its descendants are selected anymore
        let current = node.permission;
        while (current.parent_id !== 0) {
          const parent = perms.find(p => p.id === current.parent_id);
          if (!parent) break;
          const parentNode = this.findNode(this.permissionTree(), parent.id);
          if (parentNode) {
            const siblingIds = this.getAllIds(parentNode).filter(id => id !== parent.id);
            const anySelected = siblingIds.some(id => next.includes(id));
            if (!anySelected) next = next.filter(id => id !== parent.id);
          }
          current = parent;
        }
        return next;
      });
    }
  }

  private findNode(nodes: PermissionNode[], id: number): PermissionNode | null {
    for (const n of nodes) {
      if (n.permission.id === id) return n;
      const found = this.findNode(n.children, id);
      if (found) return found;
    }
    return null;
  }

  toggleExpand(id: number) {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  methodClass(method: string): string {
    const map: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      PATCH: 'bg-orange-100 text-orange-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return map[method?.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.value;
    const permissionIds = this.selectedPermissionIds();

    const r = this.role();
    const obs = r
      ? this.roleService.updateRole(r.id, { name: v.name!, description: v.description ?? undefined, permissions: permissionIds })
      : this.roleService.createRole({ name: v.name!, description: v.description ?? undefined, permissions: permissionIds });

    obs.subscribe({
      next: () => { this.loading.set(false); this.saved.emit(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'An error occurred'); this.loading.set(false); }
    });
  }
}
