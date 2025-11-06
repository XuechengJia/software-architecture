import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'

const routes = [
    { path: '/', redirect: '/login' },  // 关键：根路径重定向
    { path: '/login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/register', component: RegisterView, meta: { requiresAuth: false } },
    { path: '/home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/map', component: () => import('../views/MapView.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 看门狗守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    if (to.meta.requiresAuth && !token) {
        next('/login')
    } else if ((to.path === '/login' || to.path === '/register') && token) {
        next('/home')
    } else {
        next()
    }
})

export default router
