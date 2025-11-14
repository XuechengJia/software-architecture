import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import MaintainerManageView from '../views/MaintainerManageView.vue'

import axios from 'axios'

const routes = [
    { path: '/', redirect: '/login' },  // 关键：根路径重定向
    { path: '/login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/register', component: RegisterView, meta: { requiresAuth: false } },
    { path: '/home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/complaint', component: () => import('../views/ComplaintView.vue'), meta: { requiresAuth: true } },
    { path: '/map', component: () => import('../views/MapView.vue'), meta: { requiresAuth: true } },
    {
        path: '/riding/:vehicleId',
        name: 'Riding',
        component: () => import('../views/RidingView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        // 直接重定向到基于角色的子页面（在 beforeEnter 中读取 localStorage）
        beforeEnter: (to, from, next) => {
            try {
                const userStr = localStorage.getItem('user')
                const user = userStr ? JSON.parse(userStr) : {}
                if (user && user.role) {
                    if (user.role === 'OPERATOR') return next('/admin/operator')
                    if (user.role === 'MAINTAINER') return next('/admin/maintainer')
                    if (user.role === 'PARK_ADMIN') return next('/admin/park_admin')
                }
            } catch (e) {
                // ignore and fallback
            }
            // 无法识别角色则回到登录页
            next('/login')
        }
    }
    ,
    { path: '/admin/operator', component: () => import('../views/OperatorView.vue'), meta: { requiresAuth: true, roles: ['OPERATOR'] } },
    { path: '/admin/maintainer', component: () => import('../views/MaintainerView.vue'), meta: { requiresAuth: true, roles: ['MAINTAINER'] } },
    { path: '/admin/park_admin', component: () => import('../views/ParkAdminView.vue'), meta: { requiresAuth: true, roles: ['PARK_ADMIN'] } },
    {
        path: '/admin/maintainers',
        name: 'MaintainerManage',
        component: MaintainerManageView,
        meta: {
            requiresAuth: true,
            role: 'PARK_ADMIN'
        }}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 看门狗守卫
router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : {}

    if (to.meta.requiresAuth) {
        if (!token || !user?.id) {
            // 记住目标路径
            const redirect = to.fullPath || (user.role === 'TENANT' ? '/home' : '/admin')
            next({
                path: '/login',
                query: { redirect }  // 带上目标路径
            })
            return
        }

        // 角色权限校验
        if (to.meta.roles && !to.meta.roles.includes(user.role)) {
            ElMessage.error('无权限访问')
            next(user.role === 'TENANT' ? '/home' : '/admin')
            return
        }

        try {
            await axios.get('/api/auth/validate', {
                headers: { Authorization: `Bearer ${token}` }
            })
            next()
        } catch {
            localStorage.clear()
            ElMessage.error('登录已过期')
            const redirect = user.role === 'TENANT' ? '/home' : '/admin'
            next({
                path: '/login',
                query: { redirect }
            })
        }
    } else if ((to.path === '/login' || to.path === '/register') && token) {
        try {
            await axios.get('/api/auth/validate', {
                headers: { Authorization: `Bearer ${token}` }
            })
            next(user.role === 'TENANT' ? '/home' : '/admin')
        } catch {
            next()
        }
    } else {
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
