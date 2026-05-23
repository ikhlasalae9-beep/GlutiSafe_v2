export function allowPostOnly(req, res) {
  if (req.method === 'POST') return false;

  res.setHeader('Allow', 'POST');
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' });
  return true;
}

export async function readJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}
