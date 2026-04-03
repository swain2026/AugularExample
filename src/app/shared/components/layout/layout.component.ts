import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Permission } from '../../../core/models/user.model';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';


export interface MenuNode extends Permission {
  children: MenuNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex flex-col h-screen bg-slate-100">
      <!-- Header -->
      <header class="bg-slate-50 px-6 py-4 flex items-center justify-between z-10 shadow-md">
        <h1 class="text-xl font-bold text-slate-800">CMS Admin</h1>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {{ userInitial() }}
          </div>
          <span class="text-sm text-slate-500">{{ username() }}</span>
        </div>
      </header>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-64 bg-white text-slate-700 flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.08)] z-[5]">
          <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            @for (item of menuTree(); track item.id) {
              <!-- Folder (has children) -->
              @if (item.children.length > 0) {
                <div>
                  <button (click)="toggleMenu(item)"
                    class="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <span class="w-5 h-5 flex items-center justify-center" [innerHTML]="item.icon || defaultIcon"></span>
                    <span class="flex-1 text-left text-sm font-medium">{{ item.display_name }}</span>
                    <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-90]="item.expanded"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  @if (item.expanded) {
                    <div class="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                      @for (child of item.children; track child.id) {
                        <a [routerLink]="child.path" routerLinkActive="bg-blue-50 text-blue-600"
                          class="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm">
                          <span class="w-4 h-4 flex items-center justify-center" [innerHTML]="child.icon || defaultIcon"></span>
                          {{ child.display_name }}
                        </a>
                      }
                    </div>
                  }
                </div>
              }
              <!-- Leaf menu item -->
              @else {
                <a [routerLink]="item.path" routerLinkActive="bg-blue-50 text-blue-600"
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  <span class="w-5 h-5 flex items-center justify-center" [innerHTML]="item.icon || defaultIcon"></span>
                  <span class="text-sm">{{ item.display_name }}</span>
                </a>
              }
            }
            @if (menuTree().length === 0) {
              <p class="text-xs text-slate-400 px-4 py-2">No menu items available.</p>
            }
          </nav>
          <div class="p-4 border-t border-slate-200">
            <button (click)="logout()"
              class="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </div>
        </aside>

        <!-- Main content -->
        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = signal(this.auth.getCurrentUsername());
  userInitial = computed(() => this.username().charAt(0).toUpperCase());

  private rawMenus = signal<Permission[]>(this.auth.getPermissions());

  readonly defaultIcon = `<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>`;

  private navEnd = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
  );

  pageTitle = computed(() => {
    this.navEnd();
    const url = this.router.url.split('?')[0];
    const segment = url.split('/').filter(Boolean)[0] ?? 'dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  });

  private expandedIds = signal<Set<number>>(new Set());

  menuTree = computed<MenuNode[]>(() => this.buildTree(this.rawMenus(), this.expandedIds()));

  private buildTree(menus: Permission[], expandedIds: Set<number>): MenuNode[] {
    // Only include menu-type permissions, sorted by sort_order
    const menuItems = menus
      .filter(m => m.type === 'menu')
      .sort((a, b) => a.sort_order - b.sort_order);

    const nodeMap = new Map<number, MenuNode>();
    menuItems.forEach(m => nodeMap.set(m.id, { ...m, children: [], expanded: expandedIds.has(m.id) }));

    const roots: MenuNode[] = [];
    nodeMap.forEach(node => {
      const parentId = node.parent_id as number;
      const parent = parentId > 0 ? nodeMap.get(parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  toggleMenu(item: MenuNode): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      return next;
    });
  }

  logout() {
    this.auth.logout();
  }
}
