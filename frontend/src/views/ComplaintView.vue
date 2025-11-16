<template>
  <div class="complaint-view">
    <!-- 头部 -->
    <header class="cv-header">
      <h2>投诉反馈</h2>
      <button class="btn-exit" @click="cancel">取消并返回</button>
    </header>

    <!-- Tab 切换 -->
    <div class="cv-tabs">
      <button
          class="cv-tab"
          :class="{ active: activeTab === 'create' }"
          @click="switchToCreate"
      >
        我要投诉
      </button>
      <button
          class="cv-tab"
          :class="{ active: activeTab === 'mine' }"
          @click="switchToMyComplaints"
      >
        我的投诉
      </button>
    </div>

    <!-- 全局提示 -->
    <div v-if="successMsg" class="msg success">{{ successMsg }}</div>
    <div v-if="errorMsg" class="msg error">{{ errorMsg }}</div>

    <!-- ========== Tab1：我要投诉（保留你的位置逻辑） ========== -->
    <form
        v-if="activeTab === 'create'"
        class="cv-form"
        @submit.prevent="submitComplaint"
    >
      <!-- 投诉类型 -->
      <div class="row">
        <label>投诉类型 <span class="required">*</span></label>
        <select v-model="type">
          <option value="不文明用车">不文明用车</option>
          <option value="不规范停车">不规范停车</option>
        </select>
      </div>

      <!-- 投诉描述 -->
      <div class="row">
        <label>投诉描述 <span class="required">*</span></label>
        <textarea
            v-model="description"
            rows="4"
            placeholder="请详细描述问题，例如时间、地点、车牌号等信息"
        ></textarea>
      </div>

      <!-- 上传照片 -->
      <div class="row">
        <label>现场照片（可选）</label>
        <input
            type="file"
            accept="image/*"
            ref="fileInput"
            @change="onFileChange"
        />
        <div v-if="photoPreview" class="preview">
          <img :src="photoPreview" alt="照片预览" />
          <button
              type="button"
              class="btn-small"
              @click="removePhoto"
          >
            删除照片
          </button>
        </div>
      </div>

      <!-- ⭐ 位置信息：保留你的 geolocation 逻辑 -->
      <div class="row location-row">
        <label>位置信息 <span class="required">*</span></label>
        <div class="loc-info">
          <div v-if="location" class="loc-text">
            经度: {{ location.longitude }}，纬度: {{ location.latitude }}
          </div>
          <div v-else class="hint">
            未获取位置信息
          </div>
          <div class="loc-actions">
            <button type="button" @click="getLocation">
              获取当前位置
            </button>
            <button
                type="button"
                class="btn-small"
                @click="clearLocation"
            >
              清除位置
            </button>
          </div>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="row actions">
        <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-primary"
        >
          {{ isSubmitting ? '提交中...' : '提交投诉' }}
        </button>
        <button
            type="button"
            @click="cancel"
            class="btn-ghost"
        >
          返回首页
        </button>
      </div>
    </form>

    <!-- ========== Tab2：我的投诉 + 处理结果 + 月卡奖励 ========== -->
    <div
        v-else
        class="my-complaints"
    >
      <div v-if="loadingMyComplaints" class="state-text">
        正在加载我的投诉...
      </div>

      <div v-else-if="!myComplaints.length" class="state-text">
        暂无投诉记录
      </div>

      <div v-else>
        <div
            v-for="c in myComplaints"
            :key="c.id"
            class="complaint-item"
        >
          <div class="ci-main">
            <div class="ci-header-line">
              <div class="ci-left">
                <span class="ci-type">{{ c.type }}</span>
                <!-- ⭐ 如果有奖励，在标题旁边给一个小标记 -->
                <span
                    v-if="c.reward === 'MONTH_CARD'"
                    class="ci-reward-tag"
                >
                  月卡已发放
                </span>
              </div>
              <span class="ci-status" :class="'status-' + c.status">
                {{ c.status }}
              </span>
            </div>

            <div class="ci-desc">
              {{ c.description }}
            </div>

            <div class="ci-meta">
              <span>提交时间：{{ formatTime(c.createdAt) }}</span>
              <span v-if="c.handledAt">
                处理时间：{{ formatTime(c.handledAt) }}
              </span>
            </div>
          </div>

          <!-- 有处理结果才显示 -->
          <div v-if="c.result" class="ci-result">
            <button
                type="button"
                class="btn btn-small btn-ghost"
                @click="toggleResult(c.id)"
            >
              {{ isResultExpanded(c.id) ? '收起处理结果' : '查看处理结果' }}
            </button>

            <div
                v-if="isResultExpanded(c.id)"
                class="ci-result-detail"
            >
              <p v-if="c.result.text" class="res-text">
                <strong>处理说明：</strong>{{ c.result.text }}
              </p>

              <div
                  v-if="c.result.photoUrl"
                  class="res-photo"
              >
                <img :src="c.result.photoUrl" alt="处理结果照片" />
              </div>

              <p
                  v-if="c.result.longitude != null && c.result.latitude != null"
                  class="res-location"
              >
                <strong>处理位置：</strong>
                {{ c.result.longitude.toFixed(6) }},
                {{ c.result.latitude.toFixed(6) }}
              </p>

              <!-- ⭐ 在处理结果详情里再强调一次奖励 -->
              <p
                  v-if="c.reward === 'MONTH_CARD'"
                  class="reward-tip"
              >
                🎁 奖励：骑行月卡 *1 已发放，请在账户中查看有效期。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ComplaintView',
  data () {
    return {
      // tab 状态
      activeTab: 'create',

      // 提交投诉相关
      type: '',
      description: '',
      photoPreview: null,
      location: null,    // { latitude, longitude }
      isSubmitting: false,

      // 提示信息
      successMsg: '',
      errorMsg: '',

      // 我的投诉
      myComplaints: [],
      loadingMyComplaints: false,
      expandedResultIds: [] // 哪些投诉展开了处理结果
    }
  },
  methods: {
    // 切换 Tab
    switchToCreate () {
      this.activeTab = 'create'
    },
    async switchToMyComplaints () {
      this.activeTab = 'mine'
      if (!this.myComplaints.length) {
        await this.fetchMyComplaints()
      }
    },

    // 选择照片
    onFileChange (e) {
      const file = e.target.files[0]
      if (!file) {
        this.photoPreview = null
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        this.photoPreview = reader.result
      }
      reader.readAsDataURL(file)
    },
    removePhoto () {
      const fileInput = this.$refs.fileInput
      if (fileInput) {
        fileInput.value = ''
      }
      this.photoPreview = null
    },

    // ⭐ 保留你的 geolocation 获取位置逻辑
    getLocation () {
      if (!navigator.geolocation) {
        this.errorMsg = '当前浏览器不支持定位'
        return
      }
      this.errorMsg = ''
      navigator.geolocation.getCurrentPosition(
          pos => {
            this.location = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6))
            }
          },
          () => {
            this.errorMsg = '无法获取位置信息，请检查定位权限'
          }
      )
    },
    clearLocation () {
      this.location = null
    },

    // 提交投诉
    async submitComplaint () {
      if (!this.type || !this.description || !this.location) {
        this.errorMsg = '请填写所有必填项后再提交'
        this.successMsg = ''
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        this.errorMsg = '请先登录后再提交投诉'
        this.successMsg = ''
        return
      }

      this.isSubmitting = true
      this.successMsg = ''
      this.errorMsg = ''

      try {
        const formData = new FormData()
        formData.append('type', this.type)
        formData.append('description', this.description)
        formData.append('latitude', this.location.latitude)
        formData.append('longitude', this.location.longitude)

        const fileInput = this.$refs.fileInput
        if (fileInput && fileInput.files && fileInput.files[0]) {
          formData.append('photo', fileInput.files[0])
        }

        const res = await axios.post('/api/complaints', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        })

        this.successMsg = res.data?.message || '投诉已提交，感谢您的反馈！'
        this.errorMsg = ''

        // 清空表单
        this.type = ''
        this.description = ''
        this.location = null
        this.photoPreview = null
        if (fileInput) fileInput.value = ''
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '投诉提交失败，请稍后重试'
        this.successMsg = ''
      } finally {
        this.isSubmitting = false
      }
    },

    // 获取“我的投诉”
    async fetchMyComplaints () {
      this.loadingMyComplaints = true
      this.errorMsg = ''
      this.successMsg = ''

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          this.errorMsg = '请先登录后查看我的投诉'
          this.loadingMyComplaints = false
          return
        }

        const res = await axios.get('/api/complaints/my', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        this.myComplaints = res.data?.complaints || []
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '获取我的投诉失败'
      } finally {
        this.loadingMyComplaints = false
      }
    },

    // 展开 / 收起处理结果
    toggleResult (id) {
      const idx = this.expandedResultIds.indexOf(id)
      if (idx === -1) {
        this.expandedResultIds.push(id)
      } else {
        this.expandedResultIds.splice(idx, 1)
      }
    },
    isResultExpanded (id) {
      return this.expandedResultIds.includes(id)
    },

    // 时间格式化
    formatTime (value) {
      if (!value) return ''
      const d = new Date(value)
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    },

    // 返回首页
    cancel () {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
/* 基本样式同前，这里只加一点和奖励相关的样式 */

.complaint-view {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.cv-header {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.cv-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #2c3e50;
}
.btn-exit {
  border: none;
  background: transparent;
  color: #909399;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-exit:hover {
  color: #f56c6c;
}

.cv-tabs {
  width: 100%;
  max-width: 900px;
  display: flex;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 0.6rem;
}
.cv-tab {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.6rem 0;
  cursor: pointer;
  font-size: 0.95rem;
  color: #666;
}
.cv-tab.active {
  color: #409eff;
  border-bottom: 2px solid #409eff;
  font-weight: 600;
}

.msg {
  width: 100%;
  max-width: 900px;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-bottom: 0.8rem;
  font-size: 0.87rem;
}
.msg.success {
  background-color: #f0f9eb;
  color: #67c23a;
}
.msg.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.cv-form {
  background-color: #ffffff;
  width: 100%;
  max-width: 900px;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.row {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
}

label {
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
  color: #606266;
}

.required {
  color: #f56c6c;
}

select,
textarea {
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  padding: 0.5rem 0.6rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

select:focus,
textarea:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

textarea {
  resize: vertical;
}

.preview {
  margin-top: 0.6rem;
}
.preview img {
  max-width: 200px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  display: block;
  margin-bottom: 0.4rem;
}

/* 位置 */
.location-row .loc-info {
  background-color: #f9fafc;
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  border: 1px dashed #dcdfe6;
}
.loc-text {
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}
.hint {
  font-size: 0.85rem;
  color: #909399;
  margin-bottom: 0.3rem;
}
.loc-actions {
  display: flex;
  gap: 0.6rem;
}
.loc-actions button {
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  border: 1px solid #409eff;
  background: #ecf5ff;
  color: #409eff;
  cursor: pointer;
  font-size: 0.85rem;
}
.loc-actions .btn-small {
  border-color: #dcdfe6;
  background: #fff;
  color: #606266;
}

/* 按钮 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
button {
  outline: none;
}
.btn-primary {
  padding: 0.45rem 1.2rem;
  border-radius: 4px;
  border: 1px solid #409eff;
  background-color: #409eff;
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-primary:not(:disabled):hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.btn-ghost {
  padding: 0.45rem 1.1rem;
  border-radius: 4px;
  border: 1px solid #409eff;
  background-color: transparent;
  color: #409eff;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-ghost:hover {
  background-color: #ecf5ff;
}

.btn-small {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
}

/* 我的投诉 */
.my-complaints {
  width: 100%;
  max-width: 900px;
}
.state-text {
  text-align: center;
  padding: 1.5rem 0;
  color: #909399;
  font-size: 0.9rem;
}

.complaint-item {
  background: #fff;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin-bottom: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.ci-header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.ci-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ci-type {
  font-weight: 600;
  font-size: 0.95rem;
  color: #303133;
}

/* ⭐ 月卡标记 */
.ci-reward-tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background-color: #fdf6ec;
  color: #e6a23c;
}

.ci-status {
  font-size: 0.8rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #dcdfe6;
}
.ci-status.status-未处理 {
  color: #e6a23c;
  border-color: #f3d19e;
}
.ci-status.status-已处理 {
  color: #67c23a;
  border-color: #c2e7b0;
}

.ci-desc {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 0.25rem;
}
.ci-meta {
  font-size: 0.8rem;
  color: #909399;
  display: flex;
  flex-direction: column;
}

/* 处理结果 */
.ci-result {
  margin-top: 0.4rem;
}
.ci-result-detail {
  margin-top: 0.4rem;
  font-size: 0.86rem;
  color: #606266;
}
.res-text {
  margin-bottom: 0.3rem;
}
.res-photo img {
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  margin-bottom: 0.3rem;
}
.res-location {
  font-size: 0.85rem;
}

/* ⭐ 奖励提示 */
.reward-tip {
  margin-top: 0.3rem;
  font-size: 0.86rem;
  color: #e6a23c;
}

/* 响应式 */
@media (max-width: 600px) {
  .complaint-view {
    padding: 1rem;
  }
  .cv-form {
    padding: 1.2rem;
  }
  .actions {
    flex-direction: column;
  }
  .actions .btn-primary,
  .actions .btn-ghost {
    width: 100%;
  }
}
</style>
