import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/permissions`;

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.base);
  }

  getPermission(id: number): Observable<Permission> {
    return this.http.get<Permission>(`${this.base}/${id}`);
  }

  createPermission(data: CreatePermissionRequest): Observable<Permission> {
    return this.http.post<Permission>(this.base, data);
  }

  updatePermission(id: number, data: UpdatePermissionRequest): Observable<Permission> {
    return this.http.put<Permission>(`${this.base}/${id}`, data);
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
