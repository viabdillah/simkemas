import { request } from './base';

export const userService = {
  // 1. GET USERS (Terima search & deleted)
  getUsers: async (search = '', deleted = false) => {
    return await request(`/api/users?search=${search}&deleted=${deleted}`);
  },

  // 2. REGISTER
  registerUser: async (userData: any) => {
    return await request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 3. UPDATE
  updateUser: async (id: number, userData: any) => {
    return await request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // 4. DELETE (Soft)
  deleteUser: async (id: number) => {
    return await request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // 5. RESTORE
  restoreUser: async (id: number) => {
    return await request(`/api/users/${id}/restore`, {
      method: 'POST',
    });
  },

  // 6. PERMANENT DELETE
  permanentDeleteUser: async (id: number) => {
    return await request(`/api/users/${id}/permanent`, {
      method: 'DELETE',
    });
  }
};