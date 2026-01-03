<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white">
    <div class="text-center space-y-4">
      <div class="text-2xl font-semibold">
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
import { onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/store'
import router from '@/app/router'

const auth = useAuthStore()

onMounted(async () => {
  // pequeña pausa para UX
  await new Promise(resolve => setTimeout(resolve, 3000))

  auth.clearSession()

  router.replace('/auth/login')
})
</script>
