"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, ArrowLeft } from "lucide-react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-200">

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">

        {/* ESQUERDA */}
        <div className="flex items-center gap-4">

          {/* MENU HAMBURGUER */}
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* BOTÃO VOLTAR */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <span className="font-semibold text-lg ml-4">
            Copiloto Executivo
          </span>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          >
            Dashboard
          </button>

          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          >
            Chat
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Sair
          </button>
        </div>
      </header>

      {/* MENU LATERAL */}
      {open && (
        <div className="fixed top-0 left-0 w-64 h-full bg-gray-900 border-r border-gray-800 p-6 z-50">
          <h2 className="text-lg font-bold mb-6">Menu</h2>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                router.push("/dashboard");
                setOpen(false);
              }}
              className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-left"
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                router.push("/chat");
                setOpen(false);
              }}
              className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-left"
            >
              Chat
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-left"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO */}
      <main className="flex-1 p-6">{children}</main>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 text-center py-4 text-sm text-gray-500 bg-gray-900">
        © {new Date().getFullYear()} Mawdsleys Brasil — Copiloto Executivo
      </footer>
    </div>
  );
}