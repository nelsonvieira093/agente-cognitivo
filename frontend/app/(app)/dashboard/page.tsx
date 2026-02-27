// E:\agente-cognitivo\frontend\app\(app)\dashboard\page.tsx
"use client";

import { useRouter } from "next/navigation";
import { BarChart3, MessageSquare, Target, Radar } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-10 flex items-center gap-3">
        <BarChart3 size={28} />
        Dashboard Executivo
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* 🔵 FRENTES ESTRATÉGICAS */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target size={20} />
            Frentes Estratégicas
          </h2>

          <p className="mb-6">
            Visualizar frentes abertas e prioridades executivas.
          </p>

          <button
            onClick={() => router.push("/fronts")}
            className="btn-primary"
          >
            Ver Frentes
          </button>
        </div>

        {/* 🟢 CHAT EXECUTIVO */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Chat Executivo
          </h2>

          <p className="mb-6">
            Organizar entradas espontâneas da CEO.
          </p>

          <button
            onClick={() => router.push("/chat")}
            className="btn-primary"
          >
            Abrir Chat
          </button>
        </div>

        {/* 🟣 RADAR ESTRATÉGICO */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Radar size={20} />
            Radar Estratégico
          </h2>

          <p className="mb-6">
            Consolidação automática por rito e diretoria.
          </p>

          <button
            onClick={() => router.push("/radar")}
            className="btn-primary"
          >
            Ver Radar
          </button>
        </div>

      </div>
    </div>
  );
}