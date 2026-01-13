<template>
  <header class="h-14 bg-white border-b flex items-center justify-between px-6 shadow-sm">

    <!-- Left -->
    <div class="flex items-center gap-3 font-semibold text-indigo-600 text-lg">
      SGI v3
    </div>

    <!-- Right -->
    <div class="flex items-center gap-4">

      <div class="text-right">
        <div class="text-sm font-medium text-gray-700">
          {{ auth.userName }}
        </div>
      </div>

      <button
          class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center"
      >
        {{ auth.userName.charAt(0) }}
      </button>

      <button
          class="text-sm text-gray-600 hover:text-red-600"
          @click="logout"
      >
        Cerrar sesión
      </button>

    </div>

  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/modules/auth/auth.store.ts'

const auth = useAuthStore()

function logout() {
  auth.logout()
}
</script>
