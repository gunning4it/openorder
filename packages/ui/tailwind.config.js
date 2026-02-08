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

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Base 8 spacing system (already defined by Tailwind's defaults)
      // 2 = 8px, 4 = 16px, 6 = 24px, 8 = 32px, 12 = 48px, 16 = 64px

      colors: {
        // Semantic colors for OpenOrder
        brand: {
          DEFAULT: 'var(--brand-color, #2563eb)', // blue-600 fallback
          50: 'var(--brand-50, #eff6ff)',
          100: 'var(--brand-100, #dbeafe)',
          200: 'var(--brand-200, #bfdbfe)',
          300: 'var(--brand-300, #93c5fd)',
          400: 'var(--brand-400, #60a5fa)',
          500: 'var(--brand-500, #3b82f6)',
          600: 'var(--brand-600, #2563eb)',
          700: 'var(--brand-700, #1d4ed8)',
          800: 'var(--brand-800, #1e40af)',
          900: 'var(--brand-900, #1e3a8a)',
        },
        success: {
          DEFAULT: '#16a34a', // green-600
          light: '#22c55e', // green-500
          dark: '#15803d', // green-700
        },
        error: {
          DEFAULT: '#dc2626', // red-600
          light: '#ef4444', // red-500
          dark: '#b91c1c', // red-700
        },
        warning: {
          DEFAULT: '#d97706', // amber-600
          light: '#f59e0b', // amber-500
          dark: '#b45309', // amber-700
        },
        info: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6', // blue-500
          dark: '#1d4ed8', // blue-700
        },
      },
      borderRadius: {
        // Base 8 system for border radius
        'sm': '4px',  // 0.5 * 8
        DEFAULT: '8px', // 1 * 8
        'md': '8px',   // 1 * 8
        'lg': '16px',  // 2 * 8
        'xl': '24px',  // 3 * 8
        '2xl': '32px', // 4 * 8
      },
      fontSize: {
        // Typography scale with proper line heights
        'xs': ['12px', { lineHeight: '16px' }],     // Small labels
        'sm': ['14px', { lineHeight: '20px' }],     // Body small
        'base': ['16px', { lineHeight: '24px' }],   // Body default
        'lg': ['18px', { lineHeight: '28px' }],     // Large text
        'xl': ['20px', { lineHeight: '28px' }],     // H3
        '2xl': ['24px', { lineHeight: '32px' }],    // H2
        '3xl': ['30px', { lineHeight: '36px' }],    // H2 large
        '4xl': ['36px', { lineHeight: '40px' }],    // H1
        '5xl': ['48px', { lineHeight: '48px' }],    // H1 large
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      boxShadow: {
        // Elevation system for cards and modals
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      keyframes: {
        // Animation keyframes
        'spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 200ms ease-in',
        'slide-in-from-top': 'slide-in-from-top 200ms ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 200ms ease-out',
        'slide-in-from-left': 'slide-in-from-left 200ms ease-out',
        'slide-in-from-right': 'slide-in-from-right 200ms ease-out',
      },
    },
  },
  plugins: [],
};
