<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <template #header>
        <div class="flex items-center justify-center gap-2 text-xl font-bold text-primary">
          <el-icon><Lock /></el-icon>
          <span>用户登录</span>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
              clearable
              size="large"
              prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              size="large"
              prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="w-full" @click="login" :loading="loading">
            {{ loading ? '登录中...' : '立即登录' }}
          </el-button>
        </el-form-item>

        <div class="text-center text-sm text-gray-500">
          还没有账号？
          <el-link type="primary" @click="goRegister">立即注册</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { Lock, Phone } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({ phone: '', password: '' })
const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' }
  ],
  password: [{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]
}

const login = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      const { data } = await axios.post('/api/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      ElMessage.success('登录成功！')
      router.push('/home')
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

const goRegister = () => router.push('/register')
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.auth-card {
  width: 100%;
  max-width: 420px;
}
.text-primary { color: #409eff; }
</style>
