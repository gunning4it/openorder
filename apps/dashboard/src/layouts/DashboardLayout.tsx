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

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated()) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">OpenOrder</h1>
              <nav className="flex gap-4">
                <Link
                  to="/menu"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Menu
                </Link>
                <Link
                  to="/settings"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
