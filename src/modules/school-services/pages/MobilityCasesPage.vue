<template>
    <div class="p-6 space-y-5">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">Movilidad estudiantil</h1>
                <p class="text-sm text-slate-500">Traslado, equivalencia y revalidación de estudios.</p>
            </div>
            <div class="flex gap-2">
                <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" @click="openExternal = true">
                    Equivalencia externa
                </button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900" @click="openCreate = true">
                    Nuevo traslado
                </button>
            </div>
        </div>

        <div class="flex gap-2 border-b border-slate-200">
            <button v-for="t in tabs" :key="t.key" class="px-4 py-2 text-sm font-medium -mb-px border-b-2"
                :class="tab === t.key ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="tab = t.key; load()">{{ t.label }}</button>
        </div>

        <div class="rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500">
                    <tr>
                        <th class="text-left px-4 py-2 font-medium">#</th>
                        <th class="text-left px-4 py-2 font-medium">Proceso</th>
                        <th class="text-left px-4 py-2 font-medium">Origen → Destino</th>
                        <th class="text-left px-4 py-2 font-medium">Dictamen</th>
                        <th class="text-left px-4 py-2 font-medium">Estado</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="loading"><td colspan="6" class="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>
                    <tr v-else-if="!rows.length"><td colspan="6" class="px-4 py-8 text-center text-slate-400">Sin expedientes.</td></tr>
                    <tr v-for="r in rows" :key="r.id" class="border-t border-slate-100 hover:bg-slate-50">
                        <td class="px-4 py-2 text-slate-500">{{ r.id }}</td>
                        <td class="px-4 py-2 capitalize">{{ r.process_type }}</td>
                        <td class="px-4 py-2 text-slate-600">C{{ r.origin_college_id ?? '—' }} → C{{ r.destination_college_id ?? '—' }}</td>
                        <td class="px-4 py-2 text-slate-600">{{ r.dictamen_number || '—' }}</td>
                        <td class="px-4 py-2"><span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span></td>
                        <td class="px-4 py-2 text-right">
                            <router-link :to="`/school-services/mobility/${r.id}`" class="text-slate-700 hover:text-slate-900 font-medium">Abrir</router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <BaseModal v-model="openCreate" title="Nuevo traslado interno" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-500">Registra el traslado saliente de un alumno de este plantel hacia otro plantel del sistema.</p>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">ID del alumno de origen</label>
                    <input v-model.number="form.origin_student_id" type="number" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">ID del plantel destino</label>
                    <input v-model.number="form.destination_college_id" type="number" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Justificación (opcional)</label>
                    <textarea v-model="form.justification" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2"></textarea>
                </div>
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="openCreate = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="creating || !form.origin_student_id || !form.destination_college_id" @click="create">Crear</button>
            </template>
        </BaseModal>

        <BaseModal v-model="openExternal" title="Nueva equivalencia / revalidación externa" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-500">Reconocimiento de estudios de una institución fuera del sistema, sobre un alumno ya inscrito en este plantel.</p>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">ID del alumno (ya inscrito)</label>
                    <input v-model.number="ext.student_id" type="number" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Institución de origen</label>
                    <input v-model="ext.external_institution_name" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Estado / País</label>
                        <input v-model="ext.external_institution_place" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">ID plan destino</label>
                        <input v-model.number="ext.destination_study_plan_id" type="number" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                    <input v-model="ext.is_foreign" type="checkbox" /> Institución extranjera (revalidación)
                </label>
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="openExternal = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="creating || !ext.student_id || !ext.external_institution_name" @click="createExternal">Crear</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import { statusClass, statusLabel } from '@/modules/school-services/mobility.status'

const router = useRouter()
const toast = useToast()
const tabs = [{ key: 'mine', label: 'Todos' }, { key: 'incoming', label: 'Entrantes' }]
const tab = ref('mine')
const rows = ref<any[]>([])
const loading = ref(false)
const openCreate = ref(false)
const openExternal = ref(false)
const creating = ref(false)
const form = ref<{ origin_student_id: number | null; destination_college_id: number | null; justification: string }>({ origin_student_id: null, destination_college_id: null, justification: '' })
const ext = ref<{ student_id: number | null; external_institution_name: string; external_institution_place: string; destination_study_plan_id: number | null; is_foreign: boolean }>({ student_id: null, external_institution_name: '', external_institution_place: '', destination_study_plan_id: null, is_foreign: false })

async function load() {
    loading.value = true
    try {
        const url = tab.value === 'incoming' ? API.SCHOOL_SERVICES_API.mobility.incoming : API.SCHOOL_SERVICES_API.mobility.cases
        const { data } = await api.get(url)
        rows.value = data.data ?? []
    } finally {
        loading.value = false
    }
}

async function create() {
    creating.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.mobility.cases, form.value)
        toast.success('Expediente creado')
        openCreate.value = false
        router.push(`/school-services/mobility/${data.id}`)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo crear')
    } finally {
        creating.value = false
    }
}

async function createExternal() {
    creating.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.mobility.external, ext.value)
        toast.success('Expediente de equivalencia creado')
        openExternal.value = false
        router.push(`/school-services/mobility/${data.id}`)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo crear')
    } finally {
        creating.value = false
    }
}

onMounted(load)
</script>
