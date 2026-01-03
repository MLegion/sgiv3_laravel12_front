<template>
  <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4 hover:shadow-md transition"
  >
    <!-- Icon -->
    <div
        v-if="icon"
        class="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 text-xl"
        :class="icon"
    />

    <!-- Content -->
    <div class="flex-1">
      <p class="text-sm text-slate-500">
        {{ title }}
      </p>

      <p class="mt-1 text-2xl font-semibold text-slate-800">
        {{ value }}
      </p>

      <p v-if="description" class="mt-1 text-sm text-slate-400">
        {{ description }}
      </p>

      <!-- Slot opcional -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  description?: string
  /**
   * Clase CSS del icono
   * Ej: "i-heroicons-users"
   * Ej: "i-tabler-building"
   */
  icon?: string
}

defineProps<Props>()
</script>
