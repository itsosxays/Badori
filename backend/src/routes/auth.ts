import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { signToken } from '../middleware/auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { full_name, email, phone, password, country } = req.body;

  if (!full_name || !email || !phone || !password || !country) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['RW', 'DJ'].includes(country)) {
    return res.status(400).json({ error: 'Country must be RW (Rwanda) or DJ (Djibouti)' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const currency = country === 'RW' ? 'RWF' : 'DJF';
  const accountId = uuidv4();
  const countryPrefix = country === 'RW' ? 'RW' : 'DJ';
  const accountNumber = `${countryPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const insertUser = db.prepare(`INSERT INTO users (id, full_name, email, phone, password_hash, country) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertAccount = db.prepare(`INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance) VALUES (?, ?, ?, ?, ?, ?)`);

  db.transaction(() => {
    insertUser.run(userId, full_name, email, phone, passwordHash, country);
    insertAccount.run(accountId, userId, accountNumber, 'checking', currency, 0);
  })();

  const token = signToken(userId, country);
  const user = db.prepare('SELECT id, full_name, email, phone, country, created_at FROM users WHERE id = ?').get(userId);

  return res.status(201).json({ token, user });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user.id, user.country);
  const { password_hash, ...userSafe } = user;

  return res.json({ token, user: userSafe });
});

export default router;
