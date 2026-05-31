import { Router } from 'express';
import { query, run } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

const COLOR_PALETTE = [
  '#F43F5E','#F97316','#EAB308','#22C55E','#14B8A6',
  '#06B6D4','#3B82F6','#8B5CF6','#EC4899','#84CC16',
  '#0EA5E9','#D946EF','#64748B','#A16207','#0F766E','#BE185D',
];
const EMOJI_PALETTE = [
  '🏷️','⭐','🎯','💎','🌟','🔖','🎪','🎨',
  '🏆','🌀','💡','🔑','🌈','🎭','🔮','🎲',
];
const MAX_NAME_LEN = 50;

router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM custom_categories WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json({ categories: rows });
  } catch (e) {
    console.error('List categories error:', e);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const rawName = (req.body.name || '').trim();
    if (!rawName) return res.status(400).json({ error: 'Category name is required' });
    if (rawName.length > MAX_NAME_LEN)
      return res.status(400).json({ error: `Name must be ${MAX_NAME_LEN} characters or fewer` });

    const [existing] = await query(
      'SELECT id FROM custom_categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [req.userId, rawName]
    );
    if (existing) return res.status(409).json({ error: 'A category with this name already exists' });

    const [{ count }] = await query(
      'SELECT COUNT(*) AS count FROM custom_categories WHERE user_id = $1',
      [req.userId]
    );
    const idx   = parseInt(count, 10) % COLOR_PALETTE.length;
    const color = req.body.color || COLOR_PALETTE[idx];
    const emoji = req.body.emoji || EMOJI_PALETTE[idx % EMOJI_PALETTE.length];
    const type  = ['expense', 'income', 'both'].includes(req.body.type) ? req.body.type : 'expense';

    const id = `cc-${genId()}`;
    await run(
      `INSERT INTO custom_categories (id, user_id, name, color, emoji, type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.userId, rawName, color, emoji, type]
    );

    const [cat] = await query('SELECT * FROM custom_categories WHERE id = $1', [id]);
    res.status(201).json({ category: cat });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'A category with this name already exists' });
    console.error('Create category error:', e);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [cat] = await query(
      'SELECT id FROM custom_categories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    await run('DELETE FROM custom_categories WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete category error:', e);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
