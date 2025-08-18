import type { NextApiRequest, NextApiResponse } from 'next';
import * as formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest, form: formidable.IncomingForm) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Recebendo upload...');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const form = new formidable.IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  try {
    const { files } = await parseForm(req, form);
    const fileField = files.file || files.image || Object.values(files)[0];
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!file) {
      console.error('Nenhum arquivo encontrado no upload. files:', files);
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }
    const fileUrl = `/uploads/${path.basename(file.filepath)}`;
    console.log('Upload realizado com sucesso:', fileUrl);
    return res.status(200).json({ url: fileUrl });
  } catch (err: any) {
    console.error('Erro no upload:', err);
    return res.status(500).json({ error: 'Erro ao fazer upload', details: err.message });
  }
} 