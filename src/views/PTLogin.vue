<template>
  <div class="login">
    <div class="login-container">
      <!-- Background decorations -->
      <div class="bg-decoration decoration-1" />
      <div class="bg-decoration decoration-2" />
      <div class="bg-decoration decoration-3" />

      <div class="login-content">
        <!-- Left side - Branding -->
        <div class="login-branding">
          <div class="brand-content">
            <div class="brand-icon">
              <el-icon size="80" color="#fff">
                <DataAnalysis />
              </el-icon>
            </div>
            <h1 class="brand-title">AIP/GC 分析平台</h1>
            <div class="feature-list">
              <div class="feature-item">
                <el-icon size="16" color="#67C23A">
                  <CircleCheck />
                </el-icon>
                <span>不智能</span>
              </div>
              <div class="feature-item">
                <el-icon size="16" color="#67C23A">
                  <CircleCheck />
                </el-icon>
                <span>还很慢</span>
              </div>
              <div class="feature-item">
                <el-icon size="16" color="#67C23A">
                  <CircleCheck />
                </el-icon>
                <span>在进步</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side - Login form -->
        <div class="login-form-container">
          <div class="form-wrapper">
            <div class="form-header">
              <h2 class="form-title">欢迎登录</h2>
              <p class="form-subtitle">请输入您的账户信息</p>
            </div>

            <el-form :model="loginData" class="login-form">
              <el-form-item prop="username">
                <div class="input-group">
                  <div class="input-icon">
                    <el-icon size="20" color="#909399">
                      <User />
                    </el-icon>
                  </div>
                  <el-input ref="username" v-model="loginData.username" placeholder="请输入用户名" name="username"
                    size="large" class="custom-input" />
                </div>
              </el-form-item>

              <el-tooltip :visible="isCapslock" content="大写锁定已开启" placement="right">
                <el-form-item prop="password">
                  <div class="input-group">
                    <div class="input-icon">
                      <el-icon size="20" color="#909399">
                        <Lock />
                      </el-icon>
                    </div>
                    <el-input v-model="loginData.password" placeholder="请输入密码" type="password" name="password"
                      size="large" class="custom-input" show-password @keyup="checkCapslock"
                      @keyup.enter="handleLoginSubmit" />
                  </div>
                </el-form-item>
              </el-tooltip>
              <el-checkbox v-model="isSavePassword" label="记住密码" size="large" />
              <el-button :loading="loading" type="primary" size="large" class="login-button"
                @click.prevent="handleLoginSubmit">
                <span v-if="!loading">立即登录</span>
                <span v-else>登录中...</span>
              </el-button>
            </el-form>

            <div class="form-footer">
              <p class="footer-text">
                <el-icon size="14" color="#909399">
                  <InfoFilled />
                </el-icon>
                登录您的中台账户
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PTApi, { type PTLoginData } from "@/api/platform";
import router from "@/router";
import { getPFToken, setPFToken } from "@/utils/auth";
import { User, Lock, DataAnalysis, CircleCheck, InfoFilled } from "@element-plus/icons-vue";
import { ref,reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";

const loading = ref(false);
const isCapslock = ref(false);
const isSavePassword = ref(true);
const loginData = reactive<PTLoginData>({
  username: "",
  password: "",
});
const emit = defineEmits<{
  loginSuccess: []
}>();
// 登录
async function handleLoginSubmit() {
  loading.value = true;
  PTApi.login(loginData)
    .then((data) => {
      const { access_token } = data;
      if (access_token !== "") {
        setPFToken(access_token);
        console.log("access token:", access_token);
        ElMessage.success("登录成功！");
        window.electronAPI.setPtUsername(loginData.username);
        if (isSavePassword.value) {
          window.electronAPI.setPtPassword(loginData.password);
        }
        emit('loginSuccess');
      } else {
        console.log("login respone:", data);
        ElMessage.error("登录失败，请检查账户信息");
      }
    })
    .catch((error) => {
      console.error("Login error:", error);
      ElMessage.error("登录失败，请重试");
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(async () => {
  loginData.username = await window.electronAPI.getPtUsername();
  loginData.password = await window.electronAPI.getPtPassword();


  if (loginData.password !== "") {
    isSavePassword.value = true;
  }

});

function checkCapslock(event: KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    isCapslock.value = event.getModifierState("CapsLock");
  }
}
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.decoration-1 {
  top: 10%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #fff 0%, transparent 70%);
  animation-delay: 0s;
}

.decoration-2 {
  top: 50%;
  right: 15%;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, #fff 0%, transparent 70%);
  animation-delay: 2s;
}

.decoration-3 {
  bottom: 20%;
  left: 20%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, #fff 0%, transparent 70%);
  animation-delay: 4s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.login-content {
  display: flex;
  width: 100%;
  max-width: 1100px;
  min-height: 600px;
  overflow: hidden;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(20px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgb(0 0 0 / 15%);
}

.login-branding {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-branding::before {
  position: absolute;
  inset: 0;
  content: "";
  background: radial-gradient(circle at 30% 30%, rgb(255 255 255 / 10%) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgb(255 255 255 / 5%) 0%, transparent 50%);
}

.brand-content {
  position: relative;
  z-index: 1;
  padding: 40px;
  color: white;
  text-align: center;
}

.brand-icon {
  margin-bottom: 30px;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.brand-title {
  margin: 0 0 15px;
  font-size: 42px;
  font-weight: 700;
  text-shadow: 0 4px 8px rgb(0 0 0 / 20%);
}

.brand-subtitle {
  margin: 0 0 40px;
  font-size: 18px;
  font-weight: 300;
  opacity: 0.9;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: flex-start;
  max-width: 280px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 16px;
  opacity: 0.9;
}

.login-form-container {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 40px;
  text-align: center;
}

.form-title {
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
}

.form-subtitle {
  margin: 0;
  font-size: 16px;
  color: #7f8c8d;
}

.login-form {
  margin-bottom: 30px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.input-group:hover {
  background: #fff;
  border-color: #667eea;
}

.input-group:focus-within {
  background: #fff;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgb(102 126 234 / 10%);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-right: 1px solid #e9ecef;
}

.custom-input {
  flex: 1;
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.login-button:hover {
  box-shadow: 0 10px 25px rgb(102 126 234 / 30%);
  transform: translateY(-2px);
}

.form-footer {
  text-align: center;
}

.footer-text {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 14px;
  color: #7f8c8d;
}

/* 响应式设计 */
@media (width <=968px) {
  .login-content {
    flex-direction: column;
    max-width: 500px;
  }

  .login-branding {
    min-height: 300px;
  }

  .brand-title {
    font-size: 32px;
  }

  .login-form-container {
    padding: 40px 30px;
  }
}

@media (width <=480px) {
  .login-container {
    padding: 10px;
  }

  .login-content {
    border-radius: 15px;
  }

  .brand-title {
    font-size: 28px;
  }

  .form-title {
    font-size: 24px;
  }

  .login-form-container {
    padding: 30px 20px;
  }
}

// 隐藏element-plus默认样式
:deep(.el-form-item) {
  margin-bottom: 25px;
}

:deep(.el-form-item__content) {
  margin-left: 0 !important;
}

:deep(.el-input__wrapper) {
  padding: 0 15px;
  background-color: transparent;
  border: none;
  box-shadow: none;
}

:deep(.el-input__inner) {
  font-size: 16px;
  color: #2c3e50;
}

:deep(.el-input__inner::placeholder) {
  color: #adb5bd;
}
</style>
