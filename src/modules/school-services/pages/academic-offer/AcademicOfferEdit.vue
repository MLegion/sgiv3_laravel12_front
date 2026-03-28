<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Editar Oferta Académica</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="loading || submitting" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                <span class="text-sm text-slate-500 font-bold uppercase tracking-widest">{{ loading ? 'CARGANDO...' : 'GUARDANDO...' }}</span>
            </div>

            <form v-if="!loading" class="space-y-6" @submit.prevent="submit">
                <!-- Modalidad y carrera no se pueden cambiar, solo el status -->
                <div class="p-4 bg-slate-50 border border-dashed rounded-lg space-y-2 text-sm text-slate-600">
                    <p><strong>Modalidad ID:</strong> {{ form.modalityId }}</p>
                    <p><strong>Carrera ID:</strong> {{ form.careerId }}</p>
                    <p class="text-xs text-slate-400 italic">* La modalidad y carrera no se pueden modificar.</p>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">ESTADO</label>
                    <select v-model.number="form.status" class="w-full border rounded-lg px-3 py-2 text-sm">
                        <option :value="0">INACTIVA</option>
                        <option :value="1">ACTIVA</option>
                    </select>
                </div>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">ACTUALIZAR</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const form = reactive({ modalityId: null as number | null, careerId: null as number | null, status: 0 })

async function fetchOffer() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.byId(route.params.id as string))
        form.modalityId = data.modalityId
        form.careerId   = data.careerId
        form.status     = data.status
    } finally { loading.value = false }
}

async function submit() {
    submitting.value = true
    try {
        await api.put(API.SCHOOL_SERVICES_API.academicOffers.update(route.params.id as string), {
            modality_id: form.modalityId,
            career_id:   form.careerId,
            status:      form.status,
        })
        router.push({ name: 'school-services.academic-offers.show', params: { id: route.params.id } })
    } finally { submitting.value = false }
}

onMounted(fetchOffer)
</script>
