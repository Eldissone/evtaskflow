import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001";

  // 👀 Debug: loga qual URL o Next está tentando usar
  console.log("🔍 Usando backendUrl:", backendUrl);

  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      return res
        .status(500)
        .json({ error: "Resposta inesperada do backend", details: text });
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("❌ Erro ao conectar ao backend:", err.message);
    return res.status(500).json({ error: "Erro ao conectar ao backend" });
  }
}
