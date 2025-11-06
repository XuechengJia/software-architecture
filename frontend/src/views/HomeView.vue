<template>
  <div class="home-page">
    <el-affix :offset="0">
      <el-card class="header-card" shadow="never">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <el-avatar :size="48" :src="avatarUrl" />
            <div>
              <div class="text-lg font-semibold">{{ user.name }}</div>
              <div class="text-sm text-gray-500">{{ roleMap[user.role] }}</div>
            </div>
          </div>
          <el-button type="danger" @click="logout">退出登录</el-button>
        </div>
      </el-card>
    </el-affix>

    <div class="content">
      <el-empty v-if="!user.name" description="未登录" />
      <el-result v-else icon="success" title="欢迎回来！" sub-title="共享电动车管理平台已就绪">
        <template #extra>
          <el-button type="primary" @click="toMap">进入地图</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const user = ref({})
const avatarUrl = 'https://cube.elemecdn.com/0/88/0f65b04f7c9f9b8c2b9e0f8e7f8e9png.png'

const roleMap = {
  TENANT: '租客',
  OPERATOR: '运营方',
  MAINTAINER: '维护员',
  PARK_ADMIN: '园区管理员'
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  else router.push('/login')
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElMessage.success('已退出')
  router.push('/login')
}

const toMap = () => {
  router.push('/map') // 后续地图页
}
</script>

<style scoped>
.home-page { min-height: 100vh; background: #f8f9fb; }
.header-card { border-radius: 0; margin-bottom: 0; }
.content { padding: 40px 20px; text-align: center; }
</style>
