import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roles`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.base);
  }

  getRole(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.base}/${id}`);
  }

  createRole(data: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.base, data);
  }

  updateRole(id: number, data: UpdateRoleRequest): Observable<Role> {
    return this.http.put<Role>(`${this.base}/${id}`, data);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
