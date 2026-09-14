import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MendoDeco | BambuFarm OS v3.2",
  description: "Sistema Integral de Cotización, Inventario, Flota 3D y Finanzas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
