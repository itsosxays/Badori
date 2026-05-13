import { Account } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  account: Account;
  onDeposit?: (account: Account) => void;
  onWithdraw?: (account: Account) => void;
}

export function AccountCard({ account, onDeposit, onWithdraw }: Props) {
  return (
    <div className={`account-card account-card--${account.account_type}`}>
      <div className="account-card__header">
        <span className="account-type-badge">{account.account_type}</span>
        <span className="account-number">{account.account_number}</span>
      </div>
      <div className="account-card__balance">
        {formatCurrency(account.balance, account.currency)}
      </div>
      <div className="account-card__currency">{account.currency}</div>
      {(onDeposit || onWithdraw) && (
        <div className="account-card__actions">
          {onDeposit && (
            <button className="btn btn--sm btn--success" onClick={() => onDeposit(account)}>
              + Deposit
            </button>
          )}
          {onWithdraw && (
            <button className="btn btn--sm btn--outline" onClick={() => onWithdraw(account)}>
              − Withdraw
            </button>
          )}
        </div>
      )}
    </div>
  );
}
