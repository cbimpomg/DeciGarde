const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

async function generate(prompt, options = {}) {
  const baseUrl = options.baseUrl || DEFAULT_OLLAMA_BASE_URL;
  const model = options.model || DEFAULT_OLLAMA_MODEL;

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.response;
}

module.exports = { generate };

