import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 定义路由
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: "/aipgc",
    redirect: "/aipgc/login",
    children: [
      {
        path: "login",
        name: "ptLogin",
        component: () => import("@/views/PTLogin.vue"),
        meta: {
          title: "AIP/GC",
          icon: "el-icon-smoking",
        },
      },
      {
        path: "search",
        name: "AipSearch",
        component: () => import("@/views/AipSearch.vue"),
        meta: {
          hidden: true,
        },
      },
      {
        path: "info/:code",
        name: "aipInfo",
        component: () => import("@/views/AipInfo.vue"),
        props: true,
        meta: {
          hidden: true,
        },
      },
    ],
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '关于'
    }
  },
  {
    path: '/element-demo',
    name: 'ElementDemo',
    component: () => import('@/views/ElementDemo.vue'),
    meta: {
      title: 'Element-Plus 示例'
    }
  },
  // 重定向到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Bear Electron`
  }
  next()
})

export default router
