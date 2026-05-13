import { useState, useEffect, useCallback } from 'react';
import { Account, Transaction } from '../types';
import { api } from '../utils/api';
import { TransactionRow } from '../components/TransactionRow';

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'exchange';

export function HistoryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [accRes, txRes] = await Promise.all([api.accounts.list(), api.transactions.list()]);
      setAccounts(accRes.accounts);
      setTransactions(txRes.transactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  const accountIds = accounts.map(a => a.id);

  const filters: FilterType[] = ['all', 'deposit', 'withdrawal', 'transfer', 'exchange'];

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Transaction History</h1>
          <p className="page-subtitle">{transactions.length} total transactions</p>
        </div>
      </div>

      <div className="filter-tabs">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No {filter === 'all' ? '' : filter} transactions found.</p>
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
              {filtered.map(tx => (
                <TransactionRow key={tx.id} transaction={tx} currentAccountIds={accountIds} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
