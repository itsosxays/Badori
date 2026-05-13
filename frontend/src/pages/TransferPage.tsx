import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Account, ExchangeRate } from '../types';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/format';

export function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [form, setForm] = useState({
    from_account_id: '',
    to_account_number: '',
    amount: '',
    description: '',
  });
  const [preview, setPreview] = useState<{ convertedAmount: number; rate: number; toCurrency: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [accRes, rateRes] = await Promise.all([api.accounts.list(), api.transactions.rates()]);
    setAccounts(accRes.accounts);
    setRates(rateRes.rates);
    if (accRes.accounts.length > 0) {
      setForm(f => ({ ...f, from_account_id: accRes.accounts[0].id }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setPreview(null);
  }

  const fromAccount = accounts.find(a => a.id === form.from_account_id);

  function calcPreview() {
    const amount = parseFloat(form.amount);
    if (!fromAccount || !amount || amount <= 0) return;
    const destPrefix = form.to_account_number.slice(0, 2);
    const destCurrency = destPrefix === 'DJ' ? 'DJF' : destPrefix === 'RW' ? 'RWF' : null;
    if (destCurrency && destCurrency !== fromAccount.currency) {
      const rate = rates.find(r => r.from_currency === fromAccount.currency && r.to_currency === destCurrency);
      if (rate) {
        setPreview({ convertedAmount: amount * rate.rate, rate: rate.rate, toCurrency: destCurrency });
      }
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const res = await api.transactions.transfer({
        from_account_id: form.from_account_id,
        to_account_number: form.to_account_number,
        amount,
        description: form.description || undefined,
      });
      const tx = res.transaction;
      setSuccess(
        tx.converted_amount
          ? `Transferred ${formatCurrency(tx.amount, tx.currency)} → ${formatCurrency(tx.converted_amount, tx.converted_currency)} successfully`
          : `Transferred ${formatCurrency(tx.amount, tx.currency)} successfully`
      );
      setForm(f => ({ ...f, to_account_number: '', amount: '', description: '' }));
      setPreview(null);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Send Money</h1>
          <p className="page-subtitle">Transfer to any Badori account — Rwanda or Djibouti</p>
        </div>
      </div>

      <div className="transfer-layout">
        <div className="transfer-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert--error">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}

            <div className="form-group">
              <label>From account</label>
              <select value={form.from_account_id} onChange={e => update('from_account_id', e.target.value)}>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_number} — {formatCurrency(a.balance, a.currency)} ({a.account_type})
                  </option>
                ))}
              </select>
            </div>

            {fromAccount && (
              <div className="balance-hint">
                Available: {formatCurrency(fromAccount.balance, fromAccount.currency)}
              </div>
            )}

            <div className="form-group">
              <label>Recipient account number</label>
              <input
                type="text"
                value={form.to_account_number}
                onChange={e => update('to_account_number', e.target.value.toUpperCase())}
                onBlur={calcPreview}
                placeholder="RW-XXXXXX-XXXX or DJ-XXXXXX-XXXX"
                required
              />
              <span className="field-hint">Supports cross-country transfers with automatic exchange</span>
            </div>

            <div className="form-group">
              <label>Amount ({fromAccount?.currency})</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                onBlur={calcPreview}
                placeholder="0"
                min="1"
                step="1"
                required
              />
            </div>

            {preview && fromAccount && (
              <div className="exchange-preview">
                <span>Exchange preview</span>
                <strong>
                  {formatCurrency(parseFloat(form.amount), fromAccount.currency)}
                  {' → '}
                  {formatCurrency(preview.convertedAmount, preview.toCurrency as any)}
                </strong>
                <span className="rate-note">Rate: 1 {fromAccount.currency} = {preview.rate} {preview.toCurrency}</span>
              </div>
            )}

            <div className="form-group">
              <label>Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Rent, invoice, gift…"
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Sending…' : 'Send money'}
            </button>
          </form>
        </div>

        <div className="transfer-info">
          <h3>Exchange rates</h3>
          <div className="rates-list">
            {rates.map(r => (
              <div key={r.id} className="rate-item">
                <span>1 {r.from_currency}</span>
                <span className="rate-arrow">→</span>
                <span>{r.rate} {r.to_currency}</span>
              </div>
            ))}
          </div>
          <div className="transfer-note">
            <h4>How it works</h4>
            <ul>
              <li>Transfers within the same country are instant</li>
              <li>Cross-country transfers use live exchange rates</li>
              <li>No hidden fees on transfers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
