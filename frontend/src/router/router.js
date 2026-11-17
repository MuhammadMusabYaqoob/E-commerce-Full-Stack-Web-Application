import { createRouter, createWebHistory } from "vue-router";
import Layout from "../components/layout/Layout.vue";
import HomePage from "../views/HomePage.vue";
import AboutPage from "../views/AboutPage.vue";
import ContactPage from "../views/ContactPage.vue";
import PolicyPage from "../views/Policy.vue";
import PageNotFound from "../views/PageNotFound.vue";
import RegisterPage from "../views/RegisterPage.vue";
import LoginPage from "../views/LogInPage.vue";
import DashboardRedirect from "../views/Dashboard.vue";
import UserDashboard from "../views/User/UserDashboard.vue";
import UserOverview from "../views/User/UserOverview.vue";
import ProfilePage from "../views/User/Profile.vue";
import OrdersPage from "../views/User/Orders.vue";
import AdminDashboard from "../views/Admin/AdminDashboard.vue";
import AdminOverview from "../views/Admin/AdminOverview.vue";
import CreateCategory from "../views/Admin/CreateCategory.vue";
import CreateProduct from "../views/Admin/CreateProduct.vue";
import ProductsPage from "../views/Admin/Products.vue";
import UpdateProductPage from "../views/Admin/UpdateProduct.vue";
import UsersPage from "../views/Admin/Users.vue";
import AdminOrdersPage from "../views/Admin/Orders.vue";
import SellerDashboard from "../views/Seller/SellerDashboard.vue";
import SellerOverview from "../views/Seller/SellerOverview.vue";
import ProductDetails from "../views/ProductDetails.vue";
import CartPage from "../views/CartPage.vue";
import CategoryPage from "../views/CategoryPage.vue";
import CheckoutPage from "../views/CheckoutPage.vue";

const routes = [{ path: "/", component: Layout, children: [
  { path: "", component: HomePage },
  { path: "product/:slug", component: ProductDetails },
  { path: "cart", component: CartPage },
  { path: "checkout", component: CheckoutPage, meta: { requiresAuth: true, roles: ["customer"] } },
  { path: "category", component: CategoryPage },
  { path: "category/:slug", component: CategoryPage },
  { path: "about", component: AboutPage },
  { path: "contact", component: ContactPage },
  { path: "policy", component: PolicyPage },
  { path: "register", name: "register", component: RegisterPage, meta: { guestOnly: true } },
  { path: "login", name: "login", component: LoginPage, meta: { guestOnly: true } },
  { path: "dashboard", name: "dashboard", component: DashboardRedirect, meta: { requiresAuth: true } },
  { path: "dashboard/customer", component: UserDashboard, meta: { requiresAuth: true, roles: ["customer"] }, children: [
    { path: "", component: UserOverview }, { path: "profile", component: ProfilePage }, { path: "orders", component: OrdersPage },
  ] },
  { path: "dashboard/seller", component: SellerDashboard, meta: { requiresAuth: true, roles: ["seller"] }, children: [
    { path: "", component: SellerOverview }, { path: "products", component: ProductsPage },
    { path: "products/new", component: CreateProduct }, { path: "products/:slug/edit", component: UpdateProductPage },
  ] },
  { path: "dashboard/admin", component: AdminDashboard, meta: { requiresAuth: true, roles: ["admin"] }, children: [
    { path: "", component: AdminOverview }, { path: "categories/new", component: CreateCategory },
    { path: "products", component: ProductsPage }, { path: "products/new", component: CreateProduct },
    { path: "products/:slug/edit", component: UpdateProductPage }, { path: "orders", component: AdminOrdersPage }, { path: "users", component: UsersPage },
  ] },
  { path: ":pathMatch(.*)*", component: PageNotFound },
]}];

function readAuthUser() {
  try {
    const user = JSON.parse(localStorage.getItem("authUser") || "null");
    if (!user || typeof user !== "object" || !user.id) return null;
    const role = !user.role || user.role === "user" ? "customer" : user.role;
    if (!["customer", "seller", "admin"].includes(role)) return null;
    return { ...user, role };
  } catch {
    localStorage.removeItem("authUser");
    return null;
  }
}

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to) => {
  const user = readAuthUser();
  if (to.matched.some((route) => route.meta.requiresAuth) && !user) return { name: "login", query: { redirect: to.fullPath } };
  const roleRoute = to.matched.find((route) => route.meta.roles);
  if (roleRoute && !roleRoute.meta.roles.includes(user?.role)) return { name: "dashboard" };
  if (to.meta.guestOnly && user) return { name: "dashboard" };
});

export default router;

