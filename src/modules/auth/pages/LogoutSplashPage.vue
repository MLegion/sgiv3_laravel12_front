<template>
  <div class="min-h-screen flex items-center justify-center" :style="backgroundStyle">
    <div class="text-center space-y-4 bg-white p-8 rounded-lg shadow-lg">
      <div class="text-slate-400 text-2xl font-semibold">
        Cerrando sesión
      </div>

      <div class="text-slate-400">
        Por favor espere…
      </div>

      <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
    </div>
  </div>
</template>

<script setup lang="ts">
const backgroundStyle = {
    backgroundImage: "url('/img/background.png')",
}

import { onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMenuStore } from '@/app/stores/menu.store'
import router from '@/app/router'

const auth = useAuthStore()
const menu = useMenuStore()

onMounted(async () => {
  // pequeña pausa para UX
  await new Promise(resolve => setTimeout(resolve, 3000))

  sessionStorage.removeItem('splash_done')
  auth.clearSession()
  menu.clearMenu()
  menu.loaded = false

  router.replace('/auth/login')
})
</script>
