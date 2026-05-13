import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT a.*, u.full_name, u.country
    FROM accounts a
    JOIN users u ON u.id = a.user_id
    WHERE a.user_id = ? AND a.is_active = 1
    ORDER BY a.created_at ASC
  `).all(req.userId);
  return res.json({ accounts });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { account_type } = req.body;
  if (!account_type || !['checking', 'savings'].includes(account_type)) {
    return res.status(400).json({ error: 'account_type must be checking or savings' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  const currency = user.country === 'RW' ? 'RWF' : 'DJF';
  const prefix = user.country === 'RW' ? 'RW' : 'DJ';
  const accountNumber = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const accountId = uuidv4();

  db.prepare(`INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
    accountId, req.userId, accountNumber, account_type, currency, 0
  );

  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  return res.status(201).json({ account });
});

router.post('/:id/deposit', (req: AuthRequest, res: Response) => {
  const { amount, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const db = getDb();
  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1').get(req.params.id, req.userId) as any;
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const txId = uuidv4();
  db.transaction(() => {
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, account.id);
    db.prepare(`INSERT INTO transactions (id, to_account_id, type, amount, currency, description) VALUES (?, ?, ?, ?, ?, ?)`).run(
      txId, account.id, 'deposit', amount, account.currency, description || 'Cash deposit'
    );
  })();

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account.id);
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  return res.json({ account: updated, transaction: tx });
});

router.post('/:id/withdraw', (req: AuthRequest, res: Response) => {
  const { amount, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const db = getDb();
  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1').get(req.params.id, req.userId) as any;
  if (!account) return res.status(404).json({ error: 'Account not found' });
  if (account.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });

  const txId = uuidv4();
  db.transaction(() => {
    db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account.id);
    db.prepare(`INSERT INTO transactions (id, from_account_id, type, amount, currency, description) VALUES (?, ?, ?, ?, ?, ?)`).run(
      txId, account.id, 'withdrawal', amount, account.currency, description || 'Cash withdrawal'
    );
  })();

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account.id);
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  return res.json({ account: updated, transaction: tx });
});

export default router;
