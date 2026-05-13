import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const accounts = db.prepare('SELECT id FROM accounts WHERE user_id = ?').all(req.userId) as any[];
  const accountIds = accounts.map(a => a.id);

  if (accountIds.length === 0) return res.json({ transactions: [] });

  const placeholders = accountIds.map(() => '?').join(',');
  const transactions = db.prepare(`
    SELECT t.*,
      fa.account_number as from_account_number,
      ta.account_number as to_account_number,
      fu.full_name as from_user_name,
      tu.full_name as to_user_name
    FROM transactions t
    LEFT JOIN accounts fa ON fa.id = t.from_account_id
    LEFT JOIN accounts ta ON ta.id = t.to_account_id
    LEFT JOIN users fu ON fu.id = fa.user_id
    LEFT JOIN users tu ON tu.id = ta.user_id
    WHERE t.from_account_id IN (${placeholders}) OR t.to_account_id IN (${placeholders})
    ORDER BY t.created_at DESC
    LIMIT 50
  `).all(...accountIds, ...accountIds);

  return res.json({ transactions });
});

router.post('/transfer', (req: AuthRequest, res: Response) => {
  const { from_account_id, to_account_number, amount, description } = req.body;
  if (!from_account_id || !to_account_number || !amount || amount <= 0) {
    return res.status(400).json({ error: 'from_account_id, to_account_number, and positive amount are required' });
  }

  const db = getDb();
  const fromAccount = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1').get(from_account_id, req.userId) as any;
  if (!fromAccount) return res.status(404).json({ error: 'Source account not found' });

  const toAccount = db.prepare('SELECT * FROM accounts WHERE account_number = ? AND is_active = 1').get(to_account_number) as any;
  if (!toAccount) return res.status(404).json({ error: 'Destination account not found' });
  if (fromAccount.id === toAccount.id) return res.status(400).json({ error: 'Cannot transfer to the same account' });

  const isCrossCountry = fromAccount.currency !== toAccount.currency;
  let exchangeRate: number | null = null;
  let convertedAmount: number | null = null;

  if (isCrossCountry) {
    const rate = db.prepare('SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ?').get(fromAccount.currency, toAccount.currency) as any;
    if (!rate) return res.status(400).json({ error: 'Exchange rate not available' });
    exchangeRate = rate.rate;
    convertedAmount = amount * rate.rate;
  }

  if (fromAccount.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });

  const txId = uuidv4();
  const creditAmount = isCrossCountry ? convertedAmount! : amount;

  db.transaction(() => {
    db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, fromAccount.id);
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(creditAmount, toAccount.id);
    db.prepare(`
      INSERT INTO transactions (id, from_account_id, to_account_id, type, amount, currency, converted_amount, converted_currency, exchange_rate, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txId,
      fromAccount.id,
      toAccount.id,
      isCrossCountry ? 'exchange' : 'transfer',
      amount,
      fromAccount.currency,
      convertedAmount,
      isCrossCountry ? toAccount.currency : null,
      exchangeRate,
      description || 'Money transfer'
    );
  })();

  const tx = db.prepare(`
    SELECT t.*,
      fa.account_number as from_account_number,
      ta.account_number as to_account_number
    FROM transactions t
    LEFT JOIN accounts fa ON fa.id = t.from_account_id
    LEFT JOIN accounts ta ON ta.id = t.to_account_id
    WHERE t.id = ?
  `).get(txId);

  return res.status(201).json({ transaction: tx });
});

router.get('/rates', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const rates = db.prepare('SELECT * FROM exchange_rates').all();
  return res.json({ rates });
});

export default router;
