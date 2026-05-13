import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Account, Transaction, ExchangeRate } from '../types';
import { AccountCard } from '../components/AccountCard';
import { TransactionRow } from '../components/TransactionRow';
import { Modal } from '../components/Modal';
import { api } from '../utils/api';
import { formatCurrency, countryFlag, countryName } from '../utils/format';

export function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalAccount, setModalAccount] = useState<Account | null>(null);
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  const load = useCallback(async () => {
    try {
      const [accRes, txRes, rateRes] = await Promise.all([
        api.accounts.list(),
        api.transactions.list(),
        api.transactions.rates(),
      ]);
      setAccounts(accRes.accounts);
      setTransactions(txRes.transactions);
      setRates(rateRes.rates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = accounts[0]?.currency;
  const accountIds = accounts.map(a => a.id);

  function openModal(account: Account, type: 'deposit' | 'withdraw') {
    setModalAccount(account);
    setModalType(type);
    setTxAmount('');
    setTxDesc('');
    setTxError('');
  }

  function closeModal() {
    setModalAccount(null);
    setModalType(null);
  }

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
          <h1>Good morning, {user?.full_name.split(' ')[0]} {countryFlag(user?.country || '')}</h1>
          <p className="page-subtitle">{countryName(user?.country || '')} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {rates.length > 0 && (
          <div className="rate-pill">
            <span>1 RWF = {rates.find(r => r.from_currency === 'RWF')?.rate.toFixed(4)} DJF</span>
          </div>
        )}
      </div>

      {/* Total Balance */}
      {currency && (
        <div className="balance-hero">
          <p className="balance-label">Total Balance</p>
          <p className="balance-amount">{formatCurrency(totalBalance, currency)}</p>
        </div>
      )}

      {/* Accounts */}
      <section className="section">
        <h2>Your Accounts</h2>
        <div className="accounts-grid">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onDeposit={a => openModal(a, 'deposit')}
              onWithdraw={a => openModal(a, 'withdraw')}
            />
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="section">
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Make your first deposit!</p>
        ) : (
          <div className="table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Counterparty</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map(tx => (
                  <TransactionRow key={tx.id} transaction={tx} currentAccountIds={accountIds} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
            <p className="modal-info">
              Available: {formatCurrency(modalAccount.balance, modalAccount.currency)}
            </p>
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
