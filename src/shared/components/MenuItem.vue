<template>
  <div>
    <div
        class="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-700"
        @click="toggle"
    >
      <component
          v-if="item.icon && icons[item.icon]"
          :is="icons[item.icon]"
          class="w-5 h-5"
      />
      <span class="ml-3">{{ item.label }}</span>
    </div>

    <div v-if="open">
      <MenuItem
          v-for="child in item.children"
          :key="child.label"
          :item="child"
          :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { icons } from '@/shared/icons'
import MenuItem from './MenuItem.vue'

defineProps<{ item: any; level: number }>()

const open = ref(false)
const toggle = () => (open.value = !open.value)
</script>