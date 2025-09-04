import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nome, email, senha } = req.body || {};
  console.log("Proxy recebendo:", req.body);

  // Usa BACKEND_URL (container) ou NEXT_PUBLIC_BACKEND_URL (host/browser)
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Erro ao conectar ao backend:", err);
    res.status(500).json({ error: "Erro ao conectar ao backend." });
  }
}
