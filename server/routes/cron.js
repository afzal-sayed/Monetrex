import { Router } from 'express';
import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { processDueRules } from '../recurring.js';

const router = Router();

const hasValidSecret = (header) => {
  /* eslint-disable-next-line no-undef */
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(header || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

router.get('/process-recurring', async (req, res) => {
  if (!hasValidSecret(req.headers.authorization)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const created = await processDueRules();
    res.json({ created });
  } catch (e) {
    console.error('Cron process-recurring error:', e);
    res.status(500).json({ error: 'Failed to process recurring rules' });
  }
});

export default router;
