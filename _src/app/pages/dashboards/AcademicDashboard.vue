<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-semibold">
      Bienvenido, {{ userName }}
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DashboardCard title="Colegios" value="12" />
      <DashboardCard title="Carreras" value="48" />
      <DashboardCard title="Planes activos" value="32" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/modules/auth/auth.store.ts'
import DashboardCard from '@/app/components/dashboard/DashboardCard.vue'

const auth = useAuthStore()
const userName = auth.userName
</script>
