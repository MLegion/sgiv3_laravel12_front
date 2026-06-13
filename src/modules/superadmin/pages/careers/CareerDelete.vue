<template>
  <div class="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow">
    <h2 class="text-xl font-bold text-gray-800 mb-2">Eliminar Carrera</h2>

    <div v-if="loading" class="text-gray-500 py-6 text-center">Cargando...</div>

    <template v-else-if="career">
      <p class="text-gray-600 mb-4">
        ¿Estás seguro de que deseas eliminar la siguiente carrera? Esta acción no se puede deshacer.
      </p>
      <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
        <div><span class="font-semibold">Nombre:</span> {{ career.name }}</div>
        <div><span class="font-semibold">Código oficial:</span> {{ career.officialCode }}</div>
        <div><span class="font-semibold">Abreviatura:</span> {{ career.shortName }}</div>
        <div v-if="career.college?.name">
          <span class="font-semibold">Colegio:</span> {{ career.college.name }}
        </div>
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

    <div v-else class="text-gray-500 py-6 text-center">
      No se encontró la carrera.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import API from '@/modules/superadmin/api/superadmin.api'
import { useToast } from '@/app/composables/useToast'
import type { CareerType } from '@/modules/superadmin/types/career.type'

const route  = useRoute()
const router = useRouter()
const toast  = useToast()

const career       = ref<CareerType | null>(null)
const loading      = ref(true)
const deleting     = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get(API.api.careers.byId(route.params.id as string))
    career.value = data
  } catch (e: any) {
    errorMessage.value = e?.response?.data?.message ?? 'No se pudo cargar la carrera.'
  } finally {
    loading.value = false
  }
})

async function confirmDelete() {
  deleting.value     = true
  errorMessage.value = ''
  try {
    await api.delete(API.api.careers.delete(route.params.id as string))
    toast.success('Carrera eliminada correctamente.')
    router.push({ name: 'superadmin.careers' })
  } catch (e: any) {
    errorMessage.value = e?.response?.data?.message ?? 'No se pudo eliminar la carrera.'
    toast.error(errorMessage.value)
  } finally {
    deleting.value = false
  }
}
</script>
