// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Storefront Root Layout
// TODO: Implement in Phase 1

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
