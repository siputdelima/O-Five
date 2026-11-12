import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { extractTextFromBuffer, performOcrWithGemini } from './server/extractor.js';
import { analyzeDocument } from './server/analyzer.js';
import { classifyInformation } from './server/classifier.js';
import { generateFiveProducts } from './server/generator.js';
import { verifyProducts } from './server/verifier.js';
import { SUPPORTED_MODELS, DEFAULT_MODEL, DEFAULT_VERIFICATION_MODEL, getGeminiClient, hasValidGeminiKey, withTimeout } from './server/config.js';
import { REGENERATOR_SYSTEM_INSTRUCTION, buildRegeneratorPrompt } from './server/prompts/regeneratorPrompt.js';
import { Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;


// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Stateless memory storage for file uploads (DO NOT save documents to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.docx', '.pptx', '.txt'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe berkas "${ext}" tidak didukung. Format yang diizinkan: PDF, DOCX, PPTX, TXT (maks. 20 MB).`));
    }
  },
});

// 1. GET /api/models - List supported models
app.get('/api/models', (_req: Request, res: Response) => {
  res.json({
    models: SUPPORTED_MODELS,
    defaultModel: DEFAULT_MODEL,
    defaultVerificationModel: DEFAULT_VERIFICATION_MODEL,
  });
});

// 2. POST /api/extract - Stateless document text extraction
app.post('/api/extract', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const isOcrRequested = req.body.useOcr === 'true' || req.body.useOcr === true;
    const directText = req.body.directText;

    // Direct text input
    if (directText && typeof directText === 'string' && directText.trim().length > 0) {
      const text = directText.trim();
      const charCount = text.length;
      if (charCount < 200) {
        res.status(400).json({
          error: `Teks langsung yang dimasukkan terlalu pendek (${charCount} karakter). Diperlukan minimal 200 karakter teks dokumen kebijakan untuk dianalisis.`,
        });
        return;
      }

      res.json({
        text,
        fileName: 'Teks Langsung Kebijakan',
        fileSize: Buffer.byteLength(text, 'utf8'),
        fileType: 'txt',
        wordCount: text.split(/\s+/).filter(Boolean).length,
        charCount,
        isOcr: false,
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Tidak ada berkas yang diunggah atau teks langsung yang diberikan.' });
      return;
    }

    const { buffer, originalname, mimetype } = req.file;
    const ext = path.extname(originalname).replace('.', '').toLowerCase();

    if (isOcrRequested) {
      const ocrResult = await performOcrWithGemini(buffer, mimetype, req.body.modelName || DEFAULT_MODEL);
      res.json({
        ...ocrResult,
        fileName: originalname,
        fileSize: buffer.length,
        fileType: ext,
      });
      return;
    }

    const result = await extractTextFromBuffer(buffer, ext, originalname);
    res.json({
      ...result,
      fileName: originalname,
      fileSize: buffer.length,
      fileType: ext,
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Terjadi kesalahan saat mengekstrak naskah dokumen.',
    });
  }
});

// 3. POST /api/analyze - Structured summary extraction
app.post('/api/analyze', async (req: Request, res: Response) => {
  console.log('[DEBUG /api/analyze] Received body length:', req.body?.text?.length);
  try {
    const { text, supportingText, modelName } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length < 150) {
      res.status(400).json({ error: 'Teks dokumen sumber tidak valid atau terlalu pendek.' });
      return;
    }

    const summary = await analyzeDocument(text, supportingText, modelName || DEFAULT_MODEL);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Terjadi kesalahan saat memproses analisis naskah kebijakan dengan Gemini.',
    });
  }
});

// 4. POST /api/classify - UU KIP 14/2008 classification
app.post('/api/classify', async (req: Request, res: Response) => {
  try {
    const { summary, modelName } = req.body;
    if (!summary) {
      res.status(400).json({ error: 'Data ringkasan dokumen diperlukan untuk klasifikasi KIP.' });
      return;
    }

    const kipItems = await classifyInformation(summary, modelName || DEFAULT_MODEL);
    res.json(kipItems);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Terjadi kesalahan saat menelaah klasifikasi keterbukaan informasi.',
    });
  }
});

// 5. POST /api/generate - 5 Communication products generation
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { summary, kipItems, tone, modelName } = req.body;
    if (!summary || !kipItems) {
      res.status(400).json({ error: 'Ringkasan dokumen dan data KIP diperlukan untuk proses generasi.' });
      return;
    }

    // Check if any sensitive item is still pending decision
    const pendingSensitive = (kipItems as any[]).some(
      (item) => item.classification === 'SENSITIF' && item.userDecision === 'PENDING'
    );
    if (pendingSensitive) {
      res.status(400).json({
        error: 'Terdapat butir informasi berpotensi sensitif yang belum ditentukan statusnya (Gunakan/Jangan Gunakan) oleh analis. Harap tentukan keputusan sebelum proses generasi.',
      });
      return;
    }

    const products = await generateFiveProducts(summary, kipItems, tone || 'formal', modelName || DEFAULT_MODEL);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Terjadi kesalahan saat menghasilkan lima produk komunikasi.',
    });
  }
});

// 6. POST /api/regenerate - Regenerate, refine, shorten, expand, or restyle a single product
app.post('/api/regenerate', async (req: Request, res: Response) => {
  try {
    const { productType, currentContent, summary, action, targetStyle, modelName } = req.body;
    if (!productType || !currentContent || !summary) {
      res.status(400).json({ error: 'Parameter produk, konten saat ini, dan ringkasan diperlukan.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = buildRegeneratorPrompt(productType, currentContent, JSON.stringify(summary, null, 2), action, targetStyle);

      const schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          posts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Hanya diisi jika produk adalah threads',
          },
        },
        required: ['title', 'content'],
      };

      const response: any = await withTimeout(
        ai.models.generateContent({
          model: modelName || DEFAULT_MODEL,
          contents: prompt,
          config: {
            systemInstruction: REGENERATOR_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
        6000,
        'Regenerasi Produk Gemini'
      );

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        res.json({
          title: parsed.title,
          content: parsed.content,
          threadsPosts: parsed.posts || undefined,
        });
        return;
      }
    } catch (aiErr) {
      console.warn(`[Gemini API Info] Regenerasi via AI dialihkan ke penyesuaian teks deterministik:`, aiErr);
    }

    // Deterministic refinement fallback
    let modifiedContent = currentContent;
    if (action === 'shorten') {
      modifiedContent = currentContent
        .split('\n\n')
        .map((p: string) => p.replace(/\b(sangat|tentunya|pada hakikatnya|sebagaimana kita ketahui|secara seksama)\s+/gi, ''))
        .filter((p: string, idx: number, arr: string[]) => idx < arr.length - 1 || p.includes('Kontak') || p.includes('Narahubung'))
        .join('\n\n');
    } else if (action === 'expand') {
      const extra = `\n\nKebijakan ini ditujukan secara khusus guna memperkuat sinergi koordinasi antar-instansi serta memberikan rasa aman dan kepastian informasi yang valid bagi seluruh lapisan masyarakat Indonesia.`;
      modifiedContent = currentContent + extra;
    } else if (action === 'style') {
      if (targetStyle === 'formal') {
        modifiedContent = currentContent.replace(/tau gak sih\?/gi, 'Perlu dipahami bahwa').replace(/banget/gi, 'sungguh');
      } else if (targetStyle === 'santai') {
        modifiedContent = currentContent.replace(/menegaskan bahwa/gi, 'mengingatkan kita kalau').replace(/Diterbitkan di Jakarta/gi, 'Rilis resmi dari Jakarta');
      } else if (targetStyle === 'ringkas') {
        const lines = currentContent.split('\n').filter((l: string) => l.trim().length > 0);
        modifiedContent = lines.slice(0, Math.min(lines.length, 6)).join('\n\n');
      }
    }

    res.json({
      title: summary.judul || 'Produk Komunikasi O-FIVE',
      content: modifiedContent,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Terjadi kesalahan saat meregenerasi konten produk.',
    });
  }
});

// 7. POST /api/verify - Two-layer source verification & consistency matrix
app.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { rawSourceText, products, modelName } = req.body;
    if (!rawSourceText || !products) {
      res.status(400).json({ error: 'Teks dokumen sumber asli dan data produk diperlukan untuk verifikasi.' });
      return;
    }

    const result = await verifyProducts(rawSourceText, products, modelName || DEFAULT_VERIFICATION_MODEL);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Terjadi kesalahan saat melakukan audit verifikasi sumber.',
    });
  }
});

// Client routes & static handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[O-FIVE Backend] Berjalan di port ${PORT} (Environment: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[O-FIVE Backend] Fatal error during startup:', err);
});
