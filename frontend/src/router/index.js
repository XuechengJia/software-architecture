import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import axios from 'axios'

const routes = [
    { path: '/', redirect: '/login' },  // 关键：根路径重定向
    { path: '/login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/register', component: RegisterView, meta: { requiresAuth: false } },
    { path: '/home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/map', component: () => import('../views/MapView.vue'), meta: { requiresAuth: true } },
    {
        path: '/riding/:vehicleId',
        name: 'Riding',
        component: () => import('../views/RidingView.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 看门狗守卫
router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth) {
        if (!token) {
            next('/login')
            return
        }

        // 验证 token
        try {
            await axios.get('/api/auth/validate', {
                headers: { Authorization: `Bearer ${token}` }
            })
            next()  // 放行
        } catch (err) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            ElMessage.error('登录已过期，请重新登录')
            next('/login')
        }
    }
    else if ((to.path === '/login' || to.path === '/register') && token) {
        try {
            await axios.get('/api/auth/validate', {
                headers: { Authorization: `Bearer ${token}` }
            })
            next('/home')
        } catch {
            next()  // token 无效 → 留在登录页
        }
    }
    else {
        next()
    }
})

const validateToken = async (token) => {
    if (!token) return false
    try {
        await axios.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
        })
        return true
    } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return false
    }
}

export default router
