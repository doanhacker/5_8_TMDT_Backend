import { BrowserRouter, Routes, Route } from "react-router-dom"
import { NotificationProvider } from "./context/NotificationContext"
import { ProductProvider } from "./context/ProductContext"
import { CartProvider, useCart } from "./context/CartContext"
import { AuthProvider } from "./context/AuthContext"
import MainLayout from "./layouts/MainLayout"
import Home from "./pages/Home"
import Laptop from "./pages/Laptop"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import Admin from "./pages/Admin"
import OrderTracking from "./pages/OrderTracking"
import PaymentSuccess from "./pages/PaymentSuccess"
import PaymentFailed from "./pages/PaymentFailed"
import News from "./pages/News"
import Notifications from "./pages/Notifications"
import ResetPassword from "./pages/ResetPassword"
import FacebookCallback from "./pages/FacebookCallback"
import BrandProductsPage from "./pages/BrandProductsPage"
import CategoryProductsPage from "./pages/CategoryProductsPage"
import UserProfile from "./pages/UserProfile"
import SmartwatchPage from "./pages/SmartwatchPage"
import MonitorPrinterPage from "./pages/MonitorPrinterPage"
import SimTheCaoPage from "./pages/SimTheCaoPage"
import PhonePage from "./pages/Phone"
import TabletPage from "./pages/Tablet"
import UsedTradeInPage from "./pages/UsedTradeIn"
import AccessoriesPage from "./pages/AccessoriesPage"
import ProductsCatalogPage from "./pages/ProductsCatalogPage"
import ServicesPage from "./pages/ServicesPage"
// THÊM MỚI: Component trung gian — lấy onAuthChange từ CartContext
// rồi truyền vào AuthProvider để AuthContext thông báo cho CartContext
// khi login / logout / restore session.
// Không thể import useCart trực tiếp trong AuthProvider vì sẽ circular dependency.
function AuthBridge({ children }) {
  const { onAuthChange } = useCart()
  return (
    <AuthProvider onAuthChange={onAuthChange}>
      {children}
    </AuthProvider>
  )
}

function App() {
  return (
    // THAY ĐỔI: CartProvider lên ngoài cùng (trước AuthProvider)
    // để AuthBridge có thể gọi useCart()
    <CartProvider>
      <AuthBridge>
        <NotificationProvider>
          <ProductProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/facebook-callback" element={<FacebookCallback />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Laptop />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/laptop" element={<Laptop />} />
                  <Route path="/phone" element={<PhonePage />} />
                  <Route path="/dien-thoai" element={<PhonePage />} />
                  <Route path="/tablet" element={<TabletPage />} />
                  <Route path="/may-tinh-bang" element={<TabletPage />} />
                  <Route path="/may-cu-thu-cu" element={<UsedTradeInPage />} />
                  <Route path="/accessories" element={<AccessoriesPage />} />
                  <Route path="/phu-kien" element={<AccessoriesPage />} />
                  <Route path="/smartwatch" element={<SmartwatchPage />} />
                  <Route path="/dong-ho-thong-minh" element={<SmartwatchPage />} />
                  <Route path="/monitor-printer" element={<MonitorPrinterPage />} />
                  <Route path="/man-hinh-may-in" element={<MonitorPrinterPage />} />
                  <Route path="/sim-the-cao" element={<SimTheCaoPage />} />
                  <Route path="/dong-ho" element={<SmartwatchPage />} />
                  <Route path="/products" element={<ProductsCatalogPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<News />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/order-tracking" element={<OrderTracking />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/brands/:brandId" element={<BrandProductsPage />} />
                  <Route path="/categories/:categoryId" element={<CategoryProductsPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ProductProvider>
        </NotificationProvider>
      </AuthBridge>
    </CartProvider>
  )
}

export default App
