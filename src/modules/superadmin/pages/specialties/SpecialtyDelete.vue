<template>
  <div class="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow">
    <h2 class="text-xl font-bold text-gray-800 mb-2">Eliminar Especialidad</h2>

    <div v-if="loading" class="text-gray-500 py-6 text-center">Cargando...</div>

    <template v-else-if="specialty">
      <p class="text-gray-600 mb-4">
        ¿Estás seguro de que deseas eliminar la siguiente especialidad? Esta acción no se puede deshacer.
      </p>
      <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
        <div><span class="font-semibold">Nombre:</span> {{ specialty.name }}</div>
        <div><span class="font-semibold">Abreviatura:</span> {{ specialty.shortName }}</div>
        <div><span class="font-semibold">Código:</span> {{ specialty.officialCode }}</div>
      </div>

      <div v-if="errorMessage" class="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4 text-sm">
        {{ errorMessage }}
      </div>

      <div class="flex gap-3">
        <button
          @click="router.back()"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          @click="confirmDelete"
          :disabled="deleting"
          class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          {{ deleting ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/shared/api/axios'
import API from '@/modules/superadmin/api/superadmin.api'
import type { SpecialtyType } from '@/modules/superadmin/types/specialty.type'

const route  = useRoute()
const router = useRouter()

const specialty    = ref<SpecialtyType | null>(null)
const loading      = ref(true)
const deleting     = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get(API.api.specialties.byId(route.params.id as string))
    specialty.value = data
  } finally {
    loading.value = false
  }
})

async function confirmDelete() {
  deleting.value     = true
  errorMessage.value = ''
  try {
    await api.delete(API.api.specialties.delete(route.params.id as string))
    router.push({ name: 'superadmin.specialties' })
  } catch (e: any) {
    errorMessage.value = e?.response?.data?.message ?? 'No se pudo eliminar la especialidad.'
  } finally {
    deleting.value = false
  }
}
</script>
