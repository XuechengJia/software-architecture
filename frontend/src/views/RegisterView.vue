<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <template #header>
        <div class="flex items-center justify-center gap-2 text-xl font-bold text-success">
          <el-icon><User /></el-icon>
          <span>用户注册</span>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" size="large" prefix-icon="User" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" size="large" prefix-icon="Phone" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码（≥6位）"
              show-password
              size="large"
              prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="success" size="large" class="w-full" @click="register" :loading="loading">
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>

        <div class="text-center text-sm text-gray-500">
          已有账号？
          <el-link type="primary" @click="goLogin">去登录</el-link>
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
import { User, Phone, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({ name: '', phone: '', password: '' })
const rules = {
  name: [{ required: true, message: '请输入姓名' }],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' }
  ],
  password: [{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]
}

const register = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      await axios.post('/api/auth/register', form)
      ElMessage.success('注册成功！请登录')
      router.push('/login')
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '注册失败')
    } finally {
      loading.value = false
    }
  })
}

const goLogin = () => router.push('/login')
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.auth-card { width: 100%; max-width: 420px; }
.text-success { color: #67c23a; }
</style>
