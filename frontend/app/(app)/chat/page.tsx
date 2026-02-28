// E:\agente-cognitivo\frontend\app\chat\page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ novo estado

  const recognitionRef = useRef<any>(null);

  // 🔐 Proteção da rota
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      await sendMessage(transcript);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return; // ✅ impede duplicação

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true); // ✅ ativa loading

    // Adiciona mensagem do usuário
    setChat((prev) => [...prev, { role: "user", content: text }]);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const res = await axios.post(
        `${API_URL}/api/cognitive/analyze`,
        { message: text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Adiciona resposta do agente
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.response || "Sem resposta do agente.",
        },
      ]);

      setMessage("");
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error?.response || error);

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.response?.data?.error || "Erro ao conectar com o backend.",
        },
      ]);
    } finally {
      setLoading(false); // ✅ desativa loading
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 p-10">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">
        Copiloto Executivo
      </h1>

      <div className="card h-[500px] overflow-y-auto mb-6">
        {chat.map((msg, index) => (
          <div key={index} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-indigo-400">
                {msg.role === "user" ? "Daniela" : "Agente"}
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
              {msg.content}
            </pre>
          </div>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite sua entrada estratégica..."
        className="input-dark mb-4"
        rows={3}
      />

      <div className="flex gap-4">
        <button
          disabled={loading}
          onClick={() => sendMessage(message)}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>

        <button onClick={startListening} className="btn-secondary">
          {listening ? "🎙️ Ouvindo..." : "🎤 Falar"}
        </button>
      </div>
    </div>
  );
}
