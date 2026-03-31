export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  roles: Role[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role_ids?: number[];
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  role_ids?: number[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: number[];
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  type: string;
  path: string;
  method: string | null;
  parent_id: number;
  sort_order: number;
  icon?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePermissionRequest {
  name: string;
  display_name: string;
  description?: string | null;
  type: string;
  path: string;
  method?: string | null;
  parent_id?: number;
  sort_order?: number;
  icon?: string | null;
}

export interface UpdatePermissionRequest {
  name?: string;
  display_name?: string;
  description?: string | null;
  type?: string;
  path?: string;
  method?: string | null;
  parent_id?: number;
  sort_order?: number;
  icon?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
