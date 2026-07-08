import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

interface ContextDoc {
  title?: string; name?: string;
  category?: string; city?: string;
  phone?: string; website?: string;
  rating?: number; street?: string;
  source?: string;
}

function buildSystemPrompt(docs: ContextDoc[], query: string, userCity?: string): string {
  const list = docs
    .slice(0, 12)
    .map((d, i) => {
      const name = d.title || d.name || '?';
      const parts = [`${i + 1}. ${name}`];
      if (d.category) parts.push(`(${d.category})`);
      if (d.city) parts.push(`à ${d.city}`);
      if (d.street) parts.push(`— ${d.street}`);
      if (d.rating) parts.push(`— ⭐ ${d.rating}/5`);
      if (d.phone) parts.push(`— 📞 ${d.phone}`);
      if (d.website) parts.push(`— 🌐 ${d.website}`);
      if (d.source === 'KERNEL_ORG') parts.push('[annuaire officiel]');
      return parts.join(' ');
    })
    .join('\n');

  return `Tu es l'assistant IA de YowYob, un moteur de recherche local au Cameroun.
L'utilisateur a cherché : "${query}".${userCity ? `\nSa position géolocalisée est : ${userCity}. Les résultats ci-dessous sont déjà filtrés par proximité.` : ''}

Voici les établissements réels trouvés dans notre base de données :
${list || '(aucun résultat trouvé)'}

RÈGLES STRICTES :
- Réponds en français, de façon synthétique et conversationnelle — PAS une simple liste.
- Cite les établissements par leur nom exact uniquement s'ils sont dans la liste.
- N'invente jamais un commerce, une adresse ou un numéro de téléphone.
- Si tu ne peux pas répondre avec les données disponibles, dis-le honnêtement.
- Pour les questions de suivi, reste dans le contexte de cette recherche.
- Sois concis : 3-5 phrases maximum pour une synthèse, 1-3 pour une réponse de suivi.`;
}

export async function POST(req: NextRequest) {
  const { query, context, history, userCity }: {
    query: string;
    context: ContextDoc[];
    history: ChatMessage[];
    userCity?: string;
  } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: 'GROQ_API_KEY non configurée' }, { status: 503 });
  }

  const systemPrompt = buildSystemPrompt(context || [], query || '', userCity);

  // Première requête : synthèse initiale
  const isInitial = !history || history.length === 0;
  const userMessage = isInitial
    ? `Fais-moi une synthèse utile et concise des résultats pour ma recherche "${query}". Mets en avant les meilleurs choix et pourquoi.`
    : history[history.length - 1].content;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    ...(history.slice(0, -1).map(m => ({ role: m.role, content: m.content } as Groq.Chat.ChatCompletionMessageParam))),
    { role: 'user', content: userMessage },
  ];

  try {
    const stream = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 512,
      temperature: 0.5,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('[AI Chat]', err?.message);
    return Response.json({ error: err?.message ?? 'Erreur LLM' }, { status: 500 });
  }
}
