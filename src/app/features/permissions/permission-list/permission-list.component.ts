import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { PermissionService } from '../../../core/services/permission.service';
import { Permission } from '../../../core/models/user.model';
import { PermissionFormComponent } from '../permission-form/permission-form.component';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-50 text-green-700',
  POST: 'bg-blue-50 text-blue-700',
  PUT: 'bg-yellow-50 text-yellow-700',
  PATCH: 'bg-orange-50 text-orange-700',
  DELETE: 'bg-red-50 text-red-700'
};

interface TreeNode {
  perm: Permission;
  depth: number;
  children: TreeNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [PermissionFormComponent],
  template: `
    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p class="text-gray-500 mt-1">{{ permissions().length }} permissions</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary text-sm" (click)="expandAll()">Expand All</button>
          <button class="btn-secondary text-sm" (click)="collapseAll()">Collapse All</button>
          <button class="btn-primary" (click)="openCreate()">+ Add Permission</button>
        </div>
      </div>

      <div class="card overflow-hidden p-0">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-6 py-3 text-gray-600 font-medium w-64">Name</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Display Name</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Type</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Method</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Path</th>
              <th class="text-left px-6 py-3 text-gray-600 font-medium">Order</th>
              <th class="text-right px-6 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (row of flatRows(); track row.perm.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-3">
                  <div class="flex items-center gap-1" [style.padding-left.px]="row.depth * 20">
                    @if (row.children.length > 0) {
                      <button class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 flex-shrink-0"
                        (click)="toggleNode(row)">
                        <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-90]="row.expanded"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    } @else {
                      <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                        <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      </span>
                    }
                    <span class="font-mono text-xs text-gray-900 truncate">{{ row.perm.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-3 text-gray-700">{{ row.perm.display_name }}</td>
                <td class="px-6 py-3">
                  <span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">{{ row.perm.type }}</span>
                </td>
                <td class="px-6 py-3">
                  @if (row.perm.method) {
                    <span class="px-2 py-0.5 rounded text-xs font-medium {{ methodColor(row.perm.method) }}">{{ row.perm.method }}</span>
                  }
                </td>
                <td class="px-6 py-3 font-mono text-xs text-gray-500">{{ row.perm.path }}</td>
                <td class="px-6 py-3 text-gray-500 text-center">{{ row.perm.sort_order }}</td>
                <td class="px-6 py-3 text-right">
                  <button class="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                    (click)="openEdit(row.perm)">Edit</button>
                  <button class="text-red-600 hover:text-red-800 text-sm font-medium"
                    (click)="deletePermission(row.perm.id)">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-400">No permissions found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showForm()) {
      <app-permission-form
        [permission]="selectedPermission()"
        (saved)="onSaved()"
        (cancelled)="showForm.set(false)" />
    }
  `
})
export class PermissionListComponent implements OnInit {
  private permissionService = inject(PermissionService);

  permissions = signal<Permission[]>([]);
  showForm = signal(false);
  selectedPermission = signal<Permission | null>(null);

  private rootNodes = signal<TreeNode[]>([]);
  flatRows = computed(() => this.flatten(this.rootNodes()));

  ngOnInit() { this.loadPermissions(); }

  loadPermissions() {
    this.permissionService.getPermissions().subscribe(perms => {
      this.permissions.set(perms);
      this.rootNodes.set(this.buildTree(perms, 0, 0));
    });
  }

  private buildTree(perms: Permission[], parentId: number, depth: number): TreeNode[] {
    return perms
      .filter(p => p.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(p => {
        const children = this.buildTree(perms, p.id, depth + 1);
        return { perm: p, depth, children, expanded: true };
      });
  }

  private flatten(nodes: TreeNode[]): TreeNode[] {
    const rows: TreeNode[] = [];
    for (const node of nodes) {
      rows.push(node);
      if (node.expanded && node.children.length > 0) {
        rows.push(...this.flatten(node.children));
      }
    }
    return rows;
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    this.rootNodes.set([...this.rootNodes()]);
  }

  expandAll() { this.setExpanded(this.rootNodes(), true); this.rootNodes.set([...this.rootNodes()]); }
  collapseAll() { this.setExpanded(this.rootNodes(), false); this.rootNodes.set([...this.rootNodes()]); }

  private setExpanded(nodes: TreeNode[], value: boolean) {
    for (const n of nodes) { n.expanded = value; this.setExpanded(n.children, value); }
  }

  methodColor(method: string): string {
    return METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-600';
  }

  openCreate() { this.selectedPermission.set(null); this.showForm.set(true); }
  openEdit(p: Permission) { this.selectedPermission.set(p); this.showForm.set(true); }

  deletePermission(id: number) {
    if (!confirm('Delete this permission?')) return;
    this.permissionService.deletePermission(id).subscribe(() => this.loadPermissions());
  }

  onSaved() { this.showForm.set(false); this.loadPermissions(); }
}
