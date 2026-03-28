<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Detalle de Modalidad</h1>
            <div class="flex gap-2">
                <button
                    class="px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                    @click="router.push({ name: 'school-services.modalities.edit', params: { id: route.params.id } })"
                >EDITAR</button>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400">Cargando...</div>

        <div v-else-if="modality" class="bg-white border rounded-xl shadow-sm p-6">
            <h2 class="text-sm font-semibold text-slate-500 uppercase mb-4">Información General</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                    <dt class="text-slate-400 text-xs uppercase">Campus</dt>
                    <dd class="font-medium">{{ modality.campus?.name ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-slate-400 text-xs uppercase">Tipo de Modalidad</dt>
                    <dd class="font-medium">{{ modality.modalityType?.name ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-slate-400 text-xs uppercase">Estado</dt>
                    <dd>
                        <span
                            class="px-2 py-1 text-xs font-semibold rounded-full"
                            :class="modality.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                        >
                            {{ modality.status ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                    </dd>
                </div>
            </dl>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ModalityType } from '@/modules/school-services/types/academic-offer.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const modality = ref<ModalityType | null>(null)

async function fetchModality() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.byId(route.params.id as string))
        modality.value = data
    } finally {
        loading.value = false
    }
}

onMounted(fetchModality)
</script>
