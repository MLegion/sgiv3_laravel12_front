<script setup lang="ts">
import DashboardCard from '@/app/components/dashboard/DashboardCard.vue'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <DashboardCard
        title="Usuarios"
        value="0"
        description="Usuarios registrados"
        icon="i-heroicons-users"
    />

    <DashboardCard
        title="Colleges"
        value="0"
        description="Instituciones activas"
        icon="i-heroicons-building-library"
    />

    <DashboardCard
        title="Empleados"
        value="0"
        description="Personal activo"
        icon="i-heroicons-briefcase"
    />
  </div>
</template>
