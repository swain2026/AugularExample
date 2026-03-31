import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermissionService } from '../../../core/services/permission.service';
import { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '../../../core/models/user.model';
import { CommonModule } from '@angular/common';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const TYPES = ['api', 'menu'];

@Component({
  selector: 'app-permission-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 class="text-lg font-semibold">{{ permission() ? 'Edit Permission' : 'Create Permission' }}</h2>
          <button (click)="cancelled.emit()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
              <input formControlName="name" class="input-field" placeholder="e.g. user.list">
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Required</p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Display Name <span class="text-red-500">*</span></label>
              <input formControlName="display_name" class="input-field" placeholder="e.g. List Users">
              @if (form.get('display_name')?.invalid && form.get('display_name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Required</p>
              }
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type <span class="text-red-500">*</span></label>
              <select formControlName="type" class="input-field">
                @for (t of types; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Method <span class="text-red-500">*</span></label>
              <select formControlName="method" class="input-field">
                <option value="">— None —</option>
                @for (m of methods; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Path <span class="text-red-500">*</span></label>
            <input formControlName="path" class="input-field" placeholder="e.g. /api/users">
            @if (form.get('path')?.invalid && form.get('path')?.touched) {
              <p class="text-red-500 text-xs mt-1">Required</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Parent Permission</label>
              <select formControlName="parent_id" class="input-field">
                <option [value]="0">— None —</option>
                @for (p of parentOptions(); track p.id) {
                  <option [value]="p.id">{{ p.display_name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input formControlName="sort_order" type="number" class="input-field" placeholder="1">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <input formControlName="icon" class="input-field" placeholder="Icon name (optional)">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea formControlName="description" class="input-field" rows="2" placeholder="Optional description"></textarea>
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
  `
})
export class PermissionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);

  permission = input<Permission | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  loading = signal(false);
  error = signal('');
  parentOptions = signal<Permission[]>([]);

  methods = HTTP_METHODS;
  types = TYPES;

  form = this.fb.group({
    name: ['', Validators.required],
    display_name: ['', Validators.required],
    type: ['api', Validators.required],
    method: [''],
    path: ['', Validators.required],
    parent_id: [0],
    sort_order: [1],
    icon: [''],
    description: ['']
  });

  ngOnInit() {
    const p = this.permission();
    this.permissionService.getPermissions().subscribe(all => {
      this.parentOptions.set(p ? all.filter(x => x.id !== p.id) : all);
    });
    if (p) {
      this.form.patchValue({
        name: p.name,
        display_name: p.display_name,
        type: p.type,
        method: p.method,
        path: p.path,
        parent_id: p.parent_id,
        sort_order: p.sort_order,
        icon: p.icon ?? '',
        description: p.description ?? ''
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.value;
    const p = this.permission();

    const payload = {
      name: v.name!,
      display_name: v.display_name!,
      type: v.type!,
      method: v.method || null,
      path: v.path!,
      parent_id: v.parent_id ?? 0,
      sort_order: v.sort_order ?? 1,
      icon: v.icon || null,
      description: v.description || null
    };

    const obs = p
      ? this.permissionService.updatePermission(p.id, payload as UpdatePermissionRequest)
      : this.permissionService.createPermission(payload as CreatePermissionRequest);

    obs.subscribe({
      next: () => { this.loading.set(false); this.saved.emit(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'An error occurred'); this.loading.set(false); }
    });
  }
}
