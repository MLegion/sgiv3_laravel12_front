<template>
  <component :is="dashboardComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/modules/auth/auth.store.ts'

import DefaultDashboard from './dashboards/DefaultDashboard.vue'
import AcademicDashboard from './dashboards/AcademicDashboard.vue'
import HrDashboard from './dashboards/HrDashboard.vue'
import AdminDashboard from './dashboards/AdminDashboard.vue'

const auth = useAuthStore()

const dashboardComponent = computed(() => {
  switch (auth.dashboard) {
    case 'academic':
      return AcademicDashboard
    case 'hr':
      return HrDashboard
    case 'admin':
      return AdminDashboard
    default:
      return DefaultDashboard
  }
})
</script>
