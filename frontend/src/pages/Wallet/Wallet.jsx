/**
 * pages/Wallet/Wallet.jsx
 */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, SectionTitle } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import { WalletBalance } from "../../components/WalletPages/WalletBalance";
import WalletTransactionTable from "../../components/WalletPages/WalletTransactionTable";
import { Receipt } from "lucide-react";
import { getMyWallet, getWalletTransactions } from "../../redux/slices/wallet.slice";

export default function Wallet() {
  const dispatch = useDispatch();
  const { wallet, transactions, loading, transactionsLoading, error } = useSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(getMyWallet());
    dispatch(getWalletTransactions({ page: 1, limit: 5 }));
  }, [dispatch]);

  return (
    <UserLayout>
      <PageShell title="Wallet" subtitle="Manage your prize money, referral earnings, and withdrawals.">
        {(loading || transactionsLoading) && (
          <SearchPulseLoader
            label="Loading wallet"
            sublabel="Refreshing balances and recent transactions"
            compact
          />
        )}
        {error && <p className="text-red-400 text-sm py-2">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WalletBalance wallet={wallet || { balance: 0, holdAmount: 0, currency: "INR", lifetimeEarnings: 0, totalWithdrawn: 0, totalCredited: 0 }} />
          </div>
          <div className="lg:col-span-2">
            <SectionTitle icon={Receipt}>Recent Transactions</SectionTitle>
            <WalletTransactionTable transactions={transactions || []} />
          </div>
        </div>
      </PageShell>
    </UserLayout>
  );
}
