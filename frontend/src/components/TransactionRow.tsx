import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface Props {
  transaction: Transaction;
  currentAccountIds: string[];
}

export function TransactionRow({ transaction: tx, currentAccountIds }: Props) {
  const isCredit = tx.to_account_id && currentAccountIds.includes(tx.to_account_id);
  const isDebit = tx.from_account_id && currentAccountIds.includes(tx.from_account_id);

  let sign = '';
  let amountClass = '';
  if (tx.type === 'deposit') { sign = '+'; amountClass = 'tx-credit'; }
  else if (tx.type === 'withdrawal') { sign = '−'; amountClass = 'tx-debit'; }
  else if (isCredit && !isDebit) { sign = '+'; amountClass = 'tx-credit'; }
  else if (isDebit) { sign = '−'; amountClass = 'tx-debit'; }

  const displayAmount = isCredit && tx.converted_amount ? tx.converted_amount : tx.amount;
  const displayCurrency = isCredit && tx.converted_currency ? tx.converted_currency : tx.currency;

  const counterparty = isCredit
    ? (tx.from_user_name || tx.from_account_number || 'External')
    : (tx.to_user_name || tx.to_account_number || 'External');

  const typeLabels: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer: 'Transfer',
    exchange: 'Exchange',
  };

  return (
    <tr className="tx-row">
      <td className="tx-date">{formatDate(tx.created_at)}</td>
      <td>
        <span className={`tx-type-badge tx-type-badge--${tx.type}`}>{typeLabels[tx.type]}</span>
      </td>
      <td className="tx-description">{tx.description || '—'}</td>
      <td className="tx-counterparty">{counterparty}</td>
      <td className={`tx-amount ${amountClass}`}>
        {sign}{formatCurrency(displayAmount, displayCurrency)}
      </td>
      <td>
        <span className={`tx-status tx-status--${tx.status}`}>{tx.status}</span>
      </td>
    </tr>
  );
}
