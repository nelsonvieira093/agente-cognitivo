
//C:\agente-cognitivo\frontend\app\(auth)\signup\page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSignup = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/signup`, {
        name,
        email,
        password,
      });

      alert("Conta criada com sucesso!");
      router.push("/login");
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao criar conta");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-96">
        <h1 className="text-2xl font-bold mb-6">Criar Conta</h1>

        <input
          type="text"
          placeholder="Nome"
          className="w-full p-2 border mb-4 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full p-2 border mb-6 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Criar Conta
        </button>
      </div>
    </div>
  );
}
