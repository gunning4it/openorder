/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN';
  restaurantId: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;

  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      login: (token: string, user: User) => {
        set({ accessToken: token, user });
      },

      logout: () => {
        set({ accessToken: null, user: null });
        // Clear localStorage
        localStorage.removeItem('auth-storage');
      },

      updateUser: (updatedUser: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updatedUser } });
        }
      },

      isAuthenticated: () => {
        return !!get().accessToken && !!get().user;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
