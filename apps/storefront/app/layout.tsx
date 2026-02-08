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

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'),
  title: {
    default: 'OpenOrder - Online Restaurant Ordering',
    template: '%s | OpenOrder',
  },
  description:
    'OpenOrder is an open-source restaurant ordering platform. Order food online for pickup, delivery, or dine-in from your favorite local restaurants.',
  keywords: [
    'restaurant ordering',
    'online food ordering',
    'food delivery',
    'pickup',
    'takeout',
    'restaurant menu',
    'order online',
  ],
  authors: [{ name: 'OpenOrder' }],
  creator: 'OpenOrder',
  publisher: 'OpenOrder',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'OpenOrder',
    title: 'OpenOrder - Online Restaurant Ordering',
    description:
      'Order food online for pickup, delivery, or dine-in from your favorite local restaurants.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenOrder - Online Restaurant Ordering',
    description: 'Order food online from your favorite local restaurants.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification if available
    // google: 'verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
