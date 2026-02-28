// C:\agente-cognitivo\frontend\app\(app)\radar\page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";

export default function RadarPage() {
  const [radar, setRadar] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API_URL}/api/cognitive/followup-radar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setRadar(res.data))
      .catch(() => setRadar(null));
  }, []);

  if (!radar) {
    return <p className="text-gray-400">Carregando radar...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Radar Estratégico</h1>

      <div className="grid gap-4">
        <div className="p-4 bg-gray-900 rounded border border-gray-800">
          <p>Total de Follow-ups:</p>
          <h2 className="text-2xl font-bold">
            {radar.total_open_followups}
          </h2>
        </div>

        <div className="p-4 bg-gray-900 rounded border border-gray-800">
          <p>Prioridade ALTA:</p>
          <h2 className="text-xl font-bold text-red-400">
            {radar.by_priority.ALTA}
          </h2>
        </div>
      </div>
    </div>
  );
}