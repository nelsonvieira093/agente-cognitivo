
// C:\agente-cognitivo\frontend\app\(app)\fronts\page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";

type StrategicFront = {
  id: number;
  name: string;
  status?: string;
  total_followups?: number;
  high_priority_count?: number;
  directors_involved?: string[];
  last_update?: string;
};

export default function StrategicFrontsPage() {
  const [fronts, setFronts] = useState<StrategicFront[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API_URL}/api/cognitive/strategic-fronts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setFronts(res.data))
      .catch(() => setFronts([]));
  }, []);

  return (
    <div className="min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-10">
        Frentes Estratégicas
      </h1>

      {fronts.length === 0 && (
        <p className="text-gray-400">
          Nenhuma frente estratégica aberta.
        </p>
      )}

      <div className="grid gap-6">
        {fronts.map((front) => (
          <div
            key={front.id}
            className="p-6 rounded bg-gray-900 border border-gray-800"
          >
            <h2 className="text-xl font-semibold mb-4">
              {front.name}
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">

              <div>
                <span className="text-gray-400">Status:</span>
                <div>{front.status ?? "—"}</div>
              </div>

              <div>
                <span className="text-gray-400">
                  Total Follow-ups:
                </span>
                <div>{front.total_followups ?? 0}</div>
              </div>

              <div>
                <span className="text-gray-400">
                  Prioridade ALTA:
                </span>
                <div className="text-red-400">
                  {front.high_priority_count ?? 0}
                </div>
              </div>

              <div>
                <span className="text-gray-400">
                  Diretorias:
                </span>
                <div>
                  {front.directors_involved?.length
                    ? front.directors_involved.join(", ")
                    : "—"}
                </div>
              </div>

              <div>
                <span className="text-gray-400">
                  Última Atualização:
                </span>
                <div>
                  {front.last_update
                    ? new Date(front.last_update).toLocaleDateString()
                    : "—"}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}