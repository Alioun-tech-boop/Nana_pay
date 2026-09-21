import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../components/providers/AppProviders'
import { RequireAuth } from '../components/auth/RequireAuth'
import { RequireRole } from '../components/auth/RequireRole'
import { RoleHomeRedirect } from '../components/auth/RoleHomeRedirect'
import { AppShell } from './AppShell'
import { lazyPage } from './lazy'
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  RegisterContactPage,
  RegisterPasswordPage,
  AuthStartPage,
  VerifyPage,
} from '../features/auth/pages'
import { PrivacyPage } from '../features/legal/pages/PrivacyPage'

const DesignSystemPage = lazyPage(() =>
  import('./design-system/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
)
const MarketplacePage = lazyPage(() =>
  import('../features/marketplace/pages/MarketplacePage').then((m) => ({ default: m.MarketplacePage })),
)
const SearchPage = lazyPage(() =>
  import('../features/marketplace/pages/SearchPage').then((m) => ({ default: m.SearchPage })),
)
const StorePage = lazyPage(() =>
  import('../features/marketplace/pages/StorePage').then((m) => ({ default: m.StorePage })),
)
const ProductPage = lazyPage(() =>
  import('../features/marketplace/pages/ProductPage').then((m) => ({ default: m.ProductPage })),
)
const CartPage = lazyPage(() =>
  import('../features/marketplace/pages/CartPage').then((m) => ({ default: m.CartPage })),
)
const CheckoutPage = lazyPage(() =>
  import('../features/marketplace/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
)
const SavingsIndexPage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.SavingsIndexPage })),
)
const SavingsPage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.SavingsPage })),
)
const VaultPage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.VaultPage })),
)
const CreditPage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.CreditPage })),
)
const PaymentModePage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.PaymentModePage })),
)
const MobileMoneyPage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.MobileMoneyPage })),
)
const BankCardPage = lazyPage(() =>
  import('../features/financing').then((m) => ({ default: m.BankCardPage })),
)
const PurchasesPage = lazyPage(() =>
  import('../features/orders').then((m) => ({ default: m.PurchasesPage })),
)
const OrderDetailPage = lazyPage(() =>
  import('../features/orders').then((m) => ({ default: m.OrderDetailPage })),
)
const OrderQrPage = lazyPage(() =>
  import('../features/orders').then((m) => ({ default: m.OrderQrPage })),
)
const HistoryPage = lazyPage(() =>
  import('../features/history').then((m) => ({ default: m.HistoryPage })),
)
const DashboardPage = lazyPage(() =>
  import('../features/dashboard').then((m) => ({ default: m.DashboardPage })),
)
const ProfilePage = lazyPage(() =>
  import('../features/profile').then((m) => ({ default: m.ProfilePage })),
)
const NotificationsPage = lazyPage(() =>
  import('../features/notifications').then((m) => ({ default: m.NotificationsPage })),
)

const MerchantDashboardPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantDashboardPage })),
)
const MerchantOrdersPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantOrdersPage })),
)
const MerchantOrderDetailPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantOrderDetailPage })),
)
const MerchantProductsPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantProductsPage })),
)
const MerchantProductFormPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantProductFormPage })),
)
const MerchantScanPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantScanPage })),
)
const MerchantPaymentsPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantPaymentsPage })),
)
const MerchantStorePage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantStorePage })),
)
const MerchantHistoryPage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantHistoryPage })),
)
const MerchantProfilePage = lazyPage(() =>
  import('../features/merchant').then((m) => ({ default: m.MerchantProfilePage })),
)

const BankDashboardPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankDashboardPage })),
)
const BankCreditRequestsPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankCreditRequestsPage })),
)
const BankCreditRequestDetailPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankCreditRequestDetailPage })),
)
const BankClientProfilesPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankClientProfilesPage })),
)
const BankClientProfileDetailPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankClientProfileDetailPage })),
)
const BankCreditsPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankCreditsPage })),
)
const BankTransfersPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankTransfersPage })),
)
const BankSettlementsPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankSettlementsPage })),
)
const BankHistoryPage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankHistoryPage })),
)
const BankProfilePage = lazyPage(() =>
  import('../features/bank').then((m) => ({ default: m.BankProfilePage })),
)

const AdminDashboardPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminClientsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminClientsPage })),
)
const AdminMerchantsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminMerchantsPage })),
)
const AdminKycPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminKycPage })),
)
const AdminOrdersPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminOrdersPage })),
)
const AdminPaymentsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminPaymentsPage })),
)
const AdminSavingsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminSavingsPage })),
)
const AdminVaultsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminVaultsPage })),
)
const AdminCreditsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminCreditsPage })),
)
const AdminQrPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminQrPage })),
)
const AdminWithdrawalsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminWithdrawalsPage })),
)
const AdminSettlementsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminSettlementsPage })),
)
const AdminTransactionsPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminTransactionsPage })),
)
const AdminAuditPage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminAuditPage })),
)
const AdminProfilePage = lazyPage(() =>
  import('../features/admin').then((m) => ({ default: m.AdminProfilePage })),
)

export function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<AuthStartPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/contact" element={<RegisterContactPage />} />
          <Route path="/register/password" element={<RegisterPasswordPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route
              element={
                <RequireRole roles={['CLIENT']} fallback={<RoleHomeRedirect />}>
                  <Outlet />
                </RequireRole>
              }
            >
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/shops/:merchantId" element={<StorePage />} />
              <Route path="/products/:productId" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/savings" element={<SavingsIndexPage />} />
              <Route path="/savings/:savingsId" element={<SavingsPage />} />
<Route path="/vault" element={<VaultPage />} />
            <Route path="/credit" element={<CreditPage />} />
            <Route path="/payment-mode" element={<PaymentModePage />} />
            <Route path="/payments/mobile-money" element={<MobileMoneyPage />} />
            <Route path="/payments/bank-card" element={<BankCardPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/orders/:orderId/qr" element={<OrderQrPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/design-system" element={<DesignSystemPage />} />
            </Route>

            <Route
              path="/merchant"
              element={
                <RequireRole roles={['MERCHANT']} fallback={<RoleHomeRedirect />}>
                  <Outlet />
                </RequireRole>
              }
            >
              <Route index element={<MerchantDashboardPage />} />
              <Route path="orders" element={<MerchantOrdersPage />} />
              <Route path="orders/:orderId" element={<MerchantOrderDetailPage />} />
              <Route path="products" element={<MerchantProductsPage />} />
              <Route path="products/new" element={<MerchantProductFormPage />} />
              <Route path="products/:productId" element={<MerchantProductFormPage />} />
              <Route path="scan" element={<MerchantScanPage />} />
              <Route path="payments" element={<MerchantPaymentsPage />} />
              <Route path="store" element={<MerchantStorePage />} />
              <Route path="history" element={<MerchantHistoryPage />} />
              <Route path="profile" element={<MerchantProfilePage />} />
            </Route>

            <Route
              path="/bank"
              element={
                <RequireRole roles={['BANK']} fallback={<RoleHomeRedirect />}>
                  <Outlet />
                </RequireRole>
              }
            >
              <Route index element={<BankDashboardPage />} />
              <Route path="requests" element={<BankCreditRequestsPage />} />
              <Route path="requests/:requestId" element={<BankCreditRequestDetailPage />} />
              <Route path="profiles" element={<BankClientProfilesPage />} />
              <Route path="profiles/:clientId" element={<BankClientProfileDetailPage />} />
              <Route path="credits" element={<BankCreditsPage />} />
              <Route path="transfers" element={<BankTransfersPage />} />
              <Route path="settlements" element={<BankSettlementsPage />} />
              <Route path="history" element={<BankHistoryPage />} />
              <Route path="profile" element={<BankProfilePage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireRole roles={['ADMIN']} fallback={<RoleHomeRedirect />}>
                  <Outlet />
                </RequireRole>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="clients" element={<AdminClientsPage />} />
              <Route path="merchants" element={<AdminMerchantsPage />} />
              <Route path="kyc" element={<AdminKycPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="savings" element={<AdminSavingsPage />} />
              <Route path="vaults" element={<AdminVaultsPage />} />
              <Route path="credits" element={<AdminCreditsPage />} />
              <Route path="qr" element={<AdminQrPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="settlements" element={<AdminSettlementsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}