<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">
      Bienvenido, {{ userName }}
    </h1>

    <p class="text-slate-600">
      Seleccione una opción del menú para comenzar.
    </p>
  </div>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@/modules/auth/store'
  const auth = useAuthStore()
  const userName = auth.userName
</script>