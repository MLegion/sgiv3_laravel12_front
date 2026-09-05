<template>
    <div class="p-6 space-y-5">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">Movilidad estudiantil</h1>
                <p class="text-sm text-slate-500">Traslado, equivalencia y revalidación de estudios.</p>
            </div>
            <div class="flex gap-2">
                <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="El alumno deja este plantel hacia otra institución" @click="openOutbound = true">
                    Salida por traslado
                </button>
                <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="Estudios de una institución fuera del sistema (nacional o extranjera)" @click="openExternal = true">
                    Equivalencia / Revalidación
                </button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900" title="Recepción de otro plantel del sistema (SGIv3)" @click="openCreate = true">
                    Traslado interno
                </button>
            </div>
        </div>

        <!-- Leyenda: qué es cada proceso TecNM -->
        <details class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <summary class="cursor-pointer font-medium text-slate-600">¿Qué diferencia hay entre traslado, convalidación, equivalencia y revalidación?</summary>
            <ul class="mt-3 space-y-2">
                <li v-for="g in glossary" :key="g.key" class="flex gap-2">
                    <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold h-fit" :class="g.cls">{{ g.label }}</span>
                    <span class="text-slate-500">{{ g.desc }}</span>
                </li>
            </ul>
        </details>

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
                        <th class="text-left px-4 py-2 font-medium">Tipo de trámite</th>
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
                        <td class="px-4 py-2">
                            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="mobilityKind(r).cls" :title="mobilityKind(r).desc">{{ mobilityKind(r).label }}</span>
                        </td>
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
                <FormRemoteSelect
                    v-model="form.origin_student_id"
                    label="Alumno de origen"
                    :endpoint="API.SCHOOL_SERVICES_API.students.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.students.byId"
                    :item-searchs="['names', 'first_surname', 'num_control']"
                    :item-label="studentLabel"
                    item-value="id"
                    placeholder="Buscar alumno…"
                />
                <FormRemoteSelect
                    v-model="form.destination_college_id"
                    label="Plantel destino"
                    :endpoint="API.SCHOOL_SERVICES_API.mobility.colleges"
                    item-label="label"
                    item-value="id"
                    placeholder="Selecciona plantel…"
                />
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
                <FormRemoteSelect
                    v-model="ext.student_id"
                    label="Alumno (ya inscrito)"
                    :endpoint="API.SCHOOL_SERVICES_API.students.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.students.byId"
                    :item-searchs="['names', 'first_surname', 'num_control']"
                    :item-label="studentLabel"
                    item-value="id"
                    placeholder="Buscar alumno…"
                />
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Institución de origen</label>
                    <input v-model="ext.external_institution_name" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Estado / País</label>
                        <input v-model="ext.external_institution_place" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                    <FormRemoteSelect
                        v-model="ext.destination_study_plan_id"
                        label="Plan destino"
                        :endpoint="API.SCHOOL_SERVICES_API.mobility.studyPlans"
                        item-label="label"
                        item-value="id"
                        placeholder="Selecciona plan…"
                    />
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

        <BaseModal v-model="openOutbound" title="Salida externa (traslado a otra institución)" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-500">Registra la salida de un alumno de este plantel hacia una institución fuera del sistema. Al aplicar se dará de baja por traslado.</p>
                <FormRemoteSelect
                    v-model="out.student_id"
                    label="Alumno saliente"
                    :endpoint="API.SCHOOL_SERVICES_API.students.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.students.byId"
                    :item-searchs="['names', 'first_surname', 'num_control']"
                    :item-label="studentLabel"
                    item-value="id"
                    placeholder="Buscar alumno…"
                />
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Institución de destino</label>
                    <input v-model="out.external_institution_name" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Estado / País</label>
                    <input v-model="out.external_institution_place" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="openOutbound = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="creating || !out.student_id || !out.external_institution_name" @click="createOutbound">Crear</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { statusClass, statusLabel } from '@/modules/school-services/mobility.status'
import { mobilityKind, PROCESS_GLOSSARY } from '@/modules/school-services/mobility.labels'

const glossary = PROCESS_GLOSSARY

function studentLabel(s: any): string {
    return `${s.num_control ?? ''} — ${s.names ?? ''} ${s.first_surname ?? ''}`.trim()
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const tabs = [{ key: 'mine', label: 'Todos' }, { key: 'incoming', label: 'Entrantes' }]
const tab = ref(route.query.tab === 'incoming' ? 'incoming' : 'mine')

// El menú "Entrantes" navega con ?tab=incoming; reflejarlo aunque el componente no se remonte.
watch(() => route.query.tab, (t) => {
    const next = t === 'incoming' ? 'incoming' : 'mine'
    if (next !== tab.value) { tab.value = next; load() }
})
const rows = ref<any[]>([])
const loading = ref(false)
const openCreate = ref(false)
const openExternal = ref(false)
const openOutbound = ref(false)
const creating = ref(false)
const form = ref<{ origin_student_id: number | null; destination_college_id: number | null; justification: string }>({ origin_student_id: null, destination_college_id: null, justification: '' })
const ext = ref<{ student_id: number | null; external_institution_name: string; external_institution_place: string; destination_study_plan_id: number | null; is_foreign: boolean }>({ student_id: null, external_institution_name: '', external_institution_place: '', destination_study_plan_id: null, is_foreign: false })
const out = ref<{ student_id: number | null; external_institution_name: string; external_institution_place: string }>({ student_id: null, external_institution_name: '', external_institution_place: '' })

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

async function createOutbound() {
    creating.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.mobility.outbound, out.value)
        toast.success('Expediente de salida creado')
        openOutbound.value = false
        router.push(`/school-services/mobility/${data.id}`)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo crear')
    } finally {
        creating.value = false
    }
}

onMounted(load)
</script>
