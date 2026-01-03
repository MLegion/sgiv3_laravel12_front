<template>
  <div>
    <!-- Item principal -->
    <div
        class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer
             hover:bg-slate-800 transition"
        @click="toggle"
        :title="collapsed ? item.label : undefined"
    >
      <!-- Icono -->
      <component
          v-if="Icon"
          :is="Icon"
          class="w-5 h-5 text-slate-300 shrink-0"
      />

      <!-- Label -->
      <span
          v-if="!collapsed"
          class="flex-1 text-sm"
      >
        {{ item.label }}
      </span>

      <!-- Flecha -->
      <span
          v-if="!collapsed && item.children"
          class="text-xs text-slate-400 transition-transform"
          :class="{ 'rotate-90': open }"
      >
        ▶
      </span>
    </div>

    <!-- Submenú -->
    <div
        v-if="open && item.children && !collapsed"
        class="ml-6 mt-1 space-y-1"
    >
      <SidebarItem
          v-for="child in item.children"
          :key="child.label"
          :item="child"
          :collapsed="collapsed"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import type { MenuItem } from '@/shared/types/menu'
  import { iconMap } from '@/shared/icons'

  const props = defineProps<{
    item: MenuItem
    collapsed?: boolean
  }>()

  const open = ref(false)

  /**
   * Cerrar automáticamente submenús
   * cuando el sidebar se colapsa
   */
  watch(
      () => props.collapsed,
      (collapsed) => {
        if (collapsed) {
          open.value = false
        }
      }
  )

  const Icon = computed(() =>
      props.item.icon ? iconMap[props.item.icon] : null
  )

  function toggle() {
    if (props.item.children && !props.collapsed) {
      open.value = !open.value
    }
  }
</script>
