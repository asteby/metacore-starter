import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ModulePermissions {
  key: string
  label: string
  icon: string
  actions: string[]
  actionLabels: Record<string, string>
  actionIcons: Record<string, string>
  crudEnabled: boolean
}

export interface Role {
  id: string
  name: string
  label: string
  description: string
  color: string
}

// Fetch all modules with their available permissions
export function useModules() {
  return useQuery<ModulePermissions[]>({
    queryKey: ['permissions', 'modules'],
    queryFn: async () => {
      const res = await api.get('/permissions/modules')
      return res.data.data
    },
  })
}

// Fetch all roles (org-scoped)
export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/data/roles/me')
      return res.data.data ?? res.data
    },
  })
}

// Fetch permissions for a specific role
export function useRolePermissions(roleId: string | null) {
  return useQuery<string[]>({
    queryKey: ['permissions', 'role', roleId],
    queryFn: async () => {
      const res = await api.get(`/permissions/role/${roleId}`)
      return res.data.data
    },
    enabled: !!roleId,
  })
}

// Sync permissions for a role (by module)
export function useSyncRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      roleId,
      module,
      actions,
    }: {
      roleId: string
      module: string
      actions: string[]
    }) => {
      const res = await api.post(`/permissions/role/${roleId}/sync`, {
        module,
        actions,
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'role', variables.roleId],
      })
    },
  })
}

// Sync ALL permissions for a role at once
export function useSyncAllRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      roleId,
      permissions,
    }: {
      roleId: string
      permissions: string[]
    }) => {
      const res = await api.post(`/permissions/role/${roleId}/sync`, {
        permissions,
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'role', variables.roleId],
      })
    },
  })
}

// Create a new role
export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; label: string; description: string }) => {
      const res = await api.post('/data/roles/me', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

// Update a role
export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; label: string; description: string }) => {
      const res = await api.put(`/data/roles/me/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

// Delete a role
export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/data/roles/me/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}
