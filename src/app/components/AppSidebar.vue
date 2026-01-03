<template>
  <aside
      class="bg-slate-900 text-white h-screen transition-all duration-300 flex flex-col"
      :class="isExpanded ? 'w-64' : 'w-16'"
      @mouseenter="layout.setHovered(true)"
      @mouseleave="layout.setHovered(false)"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800">
      <!-- Pin -->
      <button
          class="text-slate-400 hover:text-white transition"
          @click="layout.togglePin"
          title="Fijar menú"
      >
        <span
            class="text-lg"
            :class="layout.sidebarPinned
            ? 'i-heroicons-pin-solid'
            : 'i-heroicons-pin'"
        />
      </button>
    </div>

    <!-- Menu -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-1">
      <template v-for="item in menus" :key="item.label">
        <SidebarItem
            :item="item"
            :collapsed="!isExpanded"
        />
      </template>
    </nav>

    <!-- Logout fijo -->
    <div class="border-t border-slate-800 p-3">
      <button
          class="flex items-center gap-3 text-sm text-red-400 hover:text-red-300 w-full"
      >
        <span class="text-lg i-heroicons-arrow-right-on-rectangle" />
        <span v-if="isExpanded">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useAuthStore } from '@/modules/auth/store'
  import { useLayoutStore } from '@/app/stores/layout.store'
  import SidebarItem from './SidebarItem.vue'

  const auth = useAuthStore()
  const layout = useLayoutStore()

  const menus = auth.menus

  const isExpanded = computed(() => layout.isSidebarExpanded)
</script>
