import { useState, useEffect, useCallback } from 'react';
import { Account } from '../types';
import { api } from '../utils/api';
import { AccountCard } from '../components/AccountCard';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/format';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<'checking' | 'savings'>('savings');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [modalAccount, setModalAccount] = useState<Account | null>(null);
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.accounts.list();
      setAccounts(res.accounts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAccount() {
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.accounts.create(newType);
      setCreating(false);
      load();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  function openModal(account: Account, type: 'deposit' | 'withdraw') {
    setModalAccount(account);
    setModalType(type);
    setTxAmount('');
    setTxDesc('');
    setTxError('');
  }

  function closeModal() { setModalAccount(null); setModalType(null); }

  async function handleTransaction() {
    if (!modalAccount || !modalType) return;
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) { setTxError('Enter a valid amount'); return; }
    setTxLoading(true);
    setTxError('');
    try {
      if (modalType === 'deposit') {
        await api.accounts.deposit(modalAccount.id, amount, txDesc || undefined);
      } else {
        await api.accounts.withdraw(modalAccount.id, amount, txDesc || undefined);
      }
      closeModal();
      load();
    } catch (err: any) {
      setTxError(err.message);
    } finally {
      setTxLoading(false);
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Accounts</h1>
          <p className="page-subtitle">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setCreating(true)}>
          + New Account
        </button>
      </div>

      <div className="accounts-grid accounts-grid--large">
        {accounts.map(account => (
          <AccountCard
            key={account.id}
            account={account}
            onDeposit={a => openModal(a, 'deposit')}
            onWithdraw={a => openModal(a, 'withdraw')}
          />
        ))}
      </div>

      {/* Create Account Modal */}
      {creating && (
        <Modal title="Open New Account" onClose={() => setCreating(false)}>
          {createError && <div className="alert alert--error">{createError}</div>}
          <p className="modal-info">Choose the account type. The currency will match your registered country.</p>
          <div className="form-group">
            <label>Account type</label>
            <div className="account-type-select">
              {(['checking', 'savings'] as const).map(t => (
                <label key={t} className={`type-option${newType === t ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="account_type"
                    value={t}
                    checked={newType === t}
                    onChange={() => setNewType(t)}
                  />
                  <div className="type-icon">{t === 'checking' ? '💳' : '🏦'}</div>
                  <div>
                    <strong>{t.charAt(0).toUpperCase() + t.slice(1)}</strong>
                    <p>{t === 'checking' ? 'Day-to-day spending' : 'Long-term savings'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn btn--primary" onClick={createAccount} disabled={createLoading}>
              {createLoading ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </Modal>
      )}

      {/* Deposit/Withdraw Modal */}
      {modalAccount && modalType && (
        <Modal
          title={modalType === 'deposit' ? `Deposit to ${modalAccount.account_number}` : `Withdraw from ${modalAccount.account_number}`}
          onClose={closeModal}
        >
          {txError && <div className="alert alert--error">{txError}</div>}
          <div className="form-group">
            <label>Amount ({modalAccount.currency})</label>
            <input
              type="number"
              value={txAmount}
              onChange={e => setTxAmount(e.target.value)}
              placeholder="0"
              min="1"
              step="1"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input
              type="text"
              value={txDesc}
              onChange={e => setTxDesc(e.target.value)}
              placeholder={modalType === 'deposit' ? 'Salary, gift…' : 'Bill payment…'}
            />
          </div>
          {modalType === 'withdraw' && (
            <p className="modal-info">Available: {formatCurrency(modalAccount.balance, modalAccount.currency)}</p>
          )}
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={closeModal}>Cancel</button>
            <button
              className={`btn ${modalType === 'deposit' ? 'btn--success' : 'btn--primary'}`}
              onClick={handleTransaction}
              disabled={txLoading}
            >
              {txLoading ? 'Processing…' : modalType === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
