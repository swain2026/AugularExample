import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../core/services/log.service';
import { Log, LogFilters } from '../../core/models/log.model';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const LIMIT = 20;

@Component({
  selector: 'app-log-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p class="text-gray-500 mt-1">{{ total() }} records total</p>
        </div>
        
      </div>

      <div class="card overflow-hidden p-0">
        <!-- Filters -->
        <div class="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3">
          <input class="input-field w-40" placeholder="Username" [(ngModel)]="filters.username" (keyup.enter)="applyFilters()" />
          <input class="input-field w-48" placeholder="Path (partial match)" [(ngModel)]="filters.path" (keyup.enter)="applyFilters()" />
          <select class="input-field w-36" [(ngModel)]="filters.method" (ngModelChange)="applyFilters()">
            <option value="">All Methods</option>
            @for (m of methods; track m) {
              <option [value]="m">{{ m }}</option>
            }
          </select>
          <input class="input-field w-28" type="number" placeholder="Status code" [(ngModel)]="filters.status_code" (keyup.enter)="applyFilters()" />
          <button class="btn-primary text-sm" (click)="applyFilters()">Search</button>
          <button class="btn-secondary text-sm" (click)="clearFilters()">Clear Filters</button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">Time</th>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">User</th>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">IP</th>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">Method</th>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">Path</th>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th class="text-left px-4 py-3 text-gray-600 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (log of logs(); track log.id) {
                <tr class="hover:bg-gray-50 cursor-pointer" (click)="toggleDetail(log)">
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ log.username ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ log.user_ip ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <span [class]="methodClass(log.method)">{{ log.method }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 max-w-[280px] truncate" [title]="log.path">{{ log.path }}</td>
                  <td class="px-4 py-3">
                    <span [class]="statusClass(log.status_code)">{{ log.status_code }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ log.process_time_ms != null ? log.process_time_ms + ' ms' : '—' }}</td>
                </tr>
                @if (expandedId() === log.id && log.request_params) {
                  <tr class="bg-slate-50">
                    <td colspan="7" class="px-6 py-4">
                      <p class="text-xs font-semibold text-gray-600 mb-1">Request Params</p>
                      <pre class="text-xs text-gray-500 bg-white border border-gray-200 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all">{{ log.request_params }}</pre>
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-400">No logs found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-sm text-gray-500">
            Showing {{ skip() + 1 }}–{{ skip() + logs().length }} of {{ total() }}
          </p>
          <div class="flex gap-2">
            <button class="btn-secondary text-sm py-1 px-3" [disabled]="skip() === 0" (click)="prevPage()">Previous</button>
            <button class="btn-secondary text-sm py-1 px-3" [disabled]="skip() + logs().length >= total()" (click)="nextPage()">Next</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LogListComponent implements OnInit {
  private logService = inject(LogService);

  logs = signal<Log[]>([]);
  total = signal(0);
  skip = signal(0);
  expandedId = signal<number | null>(null);

  methods = HTTP_METHODS;
  filters: LogFilters = {};

  ngOnInit() { this.loadLogs(); }

  loadLogs() {
    this.logService.getLogs(this.skip(), LIMIT, this.filters).subscribe(res => {
      this.logs.set(res.items);
      this.total.set(res.total);
    });
  }

  applyFilters() { this.skip.set(0); this.loadLogs(); }

  clearFilters() { this.filters = {}; this.applyFilters(); }

  toggleDetail(log: Log) {
    this.expandedId.update(id => id === log.id ? null : log.id);
  }

  prevPage() { this.skip.update(s => Math.max(0, s - LIMIT)); this.loadLogs(); }
  nextPage() { this.skip.update(s => s + LIMIT); this.loadLogs(); }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  methodClass(method: string): string {
    const map: Record<string, string> = {
      GET:    'px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700',
      POST:   'px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700',
      PUT:    'px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700',
      PATCH:  'px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700',
      DELETE: 'px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700',
    };
    return map[method] ?? 'px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600';
  }

  statusClass(code: number): string {
    if (code < 300) return 'px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700';
    if (code < 400) return 'px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700';
    if (code < 500) return 'px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700';
    return 'px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700';
  }
}
