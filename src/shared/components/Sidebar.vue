<template>
  <aside class="bg-slate-800 text-white w-64 flex flex-col">
    <nav class="flex-1">
      <MenuItem
          v-for="item in auth.menus"
          :key="item.label"
          :item="item"
          :level="1"
      />
    </nav>

    <button
        class="p-4 border-t border-slate-700 text-red-400"
        @click="auth.logout"
    >
      Salir
    </button>
  </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/modules/auth/store'
import MenuItem from './MenuItem.vue'

const auth = useAuthStore()
</script>
