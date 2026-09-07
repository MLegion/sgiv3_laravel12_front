<template>
    <div class="p-6 space-y-5">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">Movilidad estudiantil</h1>
                <p class="text-sm text-slate-500">Traslado, equivalencia y revalidación de estudios.</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="El alumno llega de una institución que NO está en el SGI; se da de alta al aplicar" @click="openTransfer = true">
                    Traslado externo
                </button>
                <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="Estudios de una institución fuera del sistema (nacional o extranjera), sobre un alumno ya inscrito" @click="openExternal = true">
                    Equivalencia / Revalidación
                </button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900" title="El alumno deja este plantel (a otro plantel del SGI o a una institución externa)" @click="openOutbound = true">
                    Salida por traslado
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

        <BaseModal v-model="openTransfer" title="Traslado externo (entrante)" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-500">El alumno llega de una institución que <b>no está en el SGI</b>. Sus datos quedan en el expediente y se da de alta al aplicar el traslado.</p>

                <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Datos del alumno</p>
                <div class="grid grid-cols-2 gap-3">
                    <div class="col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre(s) *</label>
                        <input v-uppercase v-model="xt.names" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Apellido paterno *</label>
                        <input v-uppercase v-model="xt.first_surname" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Apellido materno</label>
                        <input v-uppercase v-model="xt.second_surname" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Correo *</label>
                        <input v-model="xt.email" type="email" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">CURP</label>
                        <input v-uppercase v-model="xt.curp" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                </div>

                <p class="text-xs font-black text-slate-400 uppercase tracking-widest pt-1">Institución de origen y destino</p>
                <InstitutionPicker v-model="xt.origin_institution_id" label="Institución de origen *" />
                <FormRemoteSelect
                    v-model="xt.destination_study_plan_id"
                    label="Plan destino (nuestro)"
                    :endpoint="API.SCHOOL_SERVICES_API.mobility.studyPlans"
                    item-label="label"
                    item-value="id"
                    placeholder="Selecciona plan…"
                />
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="openTransfer = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="creating || !xt.names || !xt.first_surname || !xt.email || !xt.origin_institution_id" @click="createTransfer">Crear</button>
            </template>
        </BaseModal>

        <BaseModal v-model="openExternal" title="Nueva equivalencia / revalidación externa" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-500">Reconocimiento de estudios de una institución fuera del sistema. El alumno puede estar ya inscrito o darse de alta al aplicar.</p>

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">¿El alumno ya está inscrito?</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 text-sm text-slate-600"><input type="radio" value="existing" v-model="ext.mode" /> Ya inscrito</label>
                        <label class="flex items-center gap-2 text-sm text-slate-600"><input type="radio" value="new" v-model="ext.mode" /> Alumno nuevo (dar de alta)</label>
                    </div>
                </div>

                <FormRemoteSelect
                    v-if="ext.mode === 'existing'"
                    v-model="ext.student_id"
                    label="Alumno (ya inscrito)"
                    :endpoint="API.SCHOOL_SERVICES_API.mobility.students"
                    :item-searchs="['q']"
                    item-label="label"
                    item-value="id"
                    placeholder="Buscar por num. control, nombre, apellidos o carrera…"
                />

                <template v-else>
                    <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Datos del alumno nuevo</p>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="col-span-2">
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre(s) *</label>
                            <input v-uppercase v-model="ext.ns.names" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Apellido paterno *</label>
                            <input v-uppercase v-model="ext.ns.first_surname" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Apellido materno</label>
                            <input v-uppercase v-model="ext.ns.second_surname" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Correo *</label>
                            <input v-model="ext.ns.email" type="email" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">CURP</label>
                            <input v-uppercase v-model="ext.ns.curp" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                        </div>
                    </div>
                </template>

                <!-- La institución del catálogo determina nacional (equivalencia) vs extranjera (revalidación). -->
                <InstitutionPicker v-model="ext.origin_institution_id" label="Institución de origen *" @selected="ext.selected = $event" />
                <p v-if="ext.selected" class="text-xs font-semibold" :class="ext.selected.is_foreign ? 'text-purple-600' : 'text-blue-600'">
                    Este trámite se registrará como <b>{{ ext.selected.is_foreign ? 'Revalidación (institución extranjera)' : 'Equivalencia (institución nacional)' }}</b>.
                </p>

                <FormRemoteSelect
                    v-model="ext.destination_study_plan_id"
                    :label="ext.mode === 'new' ? 'Plan destino (de inscripción) *' : 'Plan destino'"
                    :endpoint="API.SCHOOL_SERVICES_API.mobility.studyPlans"
                    item-label="label"
                    item-value="id"
                    placeholder="Selecciona plan…"
                />
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="openExternal = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="creating || !externalValid" @click="createExternal">Crear</button>
            </template>
        </BaseModal>

        <BaseModal v-model="openOutbound" title="Salida por traslado" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-500">Registra la salida de un alumno de este plantel. Al aplicar se dará de baja por traslado.</p>
                <FormRemoteSelect
                    v-model="out.student_id"
                    label="Alumno saliente"
                    :endpoint="API.SCHOOL_SERVICES_API.mobility.students"
                    :item-searchs="['q']"
                    item-label="label"
                    item-value="id"
                    placeholder="Buscar por num. control, nombre, apellidos o carrera…"
                />

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">¿A dónde se traslada?</label>
                    <div class="flex flex-col gap-1.5">
                        <label class="flex items-center gap-2 text-sm text-slate-600">
                            <input type="radio" value="sgi" v-model="out.dest" /> Otro plantel del sistema (SGI)
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-600">
                            <input type="radio" value="external" v-model="out.dest" /> Institución externa (fuera del SGI)
                        </label>
                    </div>
                </div>

                <!-- Destino SGI: se crea un traslado interno (el plantel destino lo recibe) -->
                <FormRemoteSelect
                    v-if="out.dest === 'sgi'"
                    v-model="out.destination_college_id"
                    label="Plantel destino (SGI)"
                    :endpoint="API.SCHOOL_SERVICES_API.mobility.colleges"
                    item-label="label"
                    item-value="id"
                    placeholder="Selecciona plantel…"
                />

                <!-- Destino externo: se emite certificado parcial + oficio -->
                <template v-else>
                    <InstitutionPicker v-model="out.origin_institution_id" label="Institución de destino *" />
                </template>
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="openOutbound = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="creating || !outboundValid" @click="createOutbound">Crear</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import InstitutionPicker from '@/modules/school-services/components/InstitutionPicker.vue'
import { statusClass, statusLabel } from '@/modules/school-services/mobility.status'
import { mobilityKind, PROCESS_GLOSSARY } from '@/modules/school-services/mobility.labels'

const glossary = PROCESS_GLOSSARY

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
const openExternal = ref(false)
const openTransfer = ref(false)
const openOutbound = ref(false)
const creating = ref(false)
type InstSel = { id: number; label: string; is_foreign: boolean; is_active: boolean } | null
const xt = ref<{ names: string; first_surname: string; second_surname: string; email: string; curp: string; origin_institution_id: number | null; destination_study_plan_id: number | null }>({ names: '', first_surname: '', second_surname: '', email: '', curp: '', origin_institution_id: null, destination_study_plan_id: null })
const ext = ref<{ mode: 'existing' | 'new'; student_id: number | null; ns: { names: string; first_surname: string; second_surname: string; email: string; curp: string }; origin_institution_id: number | null; selected: InstSel; destination_study_plan_id: number | null }>({ mode: 'existing', student_id: null, ns: { names: '', first_surname: '', second_surname: '', email: '', curp: '' }, origin_institution_id: null, selected: null, destination_study_plan_id: null })
const out = ref<{ student_id: number | null; dest: 'sgi' | 'external'; destination_college_id: number | null; origin_institution_id: number | null }>({ student_id: null, dest: 'sgi', destination_college_id: null, origin_institution_id: null })

const outboundValid = computed(() => {
    if (!out.value.student_id) return false
    return out.value.dest === 'sgi' ? !!out.value.destination_college_id : !!out.value.origin_institution_id
})

const externalValid = computed(() => {
    if (!ext.value.origin_institution_id) return false
    if (ext.value.mode === 'existing') return !!ext.value.student_id
    // Alumno nuevo: nombre + apellido + correo + plan de inscripción.
    return !!ext.value.ns.names && !!ext.value.ns.first_surname && !!ext.value.ns.email && !!ext.value.destination_study_plan_id
})

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

async function createExternal() {
    creating.value = true
    try {
        const payload: Record<string, any> = {
            origin_institution_id: ext.value.origin_institution_id,
            destination_study_plan_id: ext.value.destination_study_plan_id,
        }
        if (ext.value.mode === 'existing') {
            payload.student_id = ext.value.student_id
        } else {
            payload.incoming_student = {
                names: ext.value.ns.names,
                first_surname: ext.value.ns.first_surname,
                second_surname: ext.value.ns.second_surname || null,
                email: ext.value.ns.email,
                curp: ext.value.ns.curp || null,
            }
        }
        const { data } = await api.post(API.SCHOOL_SERVICES_API.mobility.external, payload)
        toast.success('Expediente de equivalencia creado')
        openExternal.value = false
        router.push(`/school-services/mobility/${data.id}`)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo crear')
    } finally {
        creating.value = false
    }
}

async function createTransfer() {
    creating.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.mobility.externalTransfer, {
            origin_institution_id: xt.value.origin_institution_id,
            destination_study_plan_id: xt.value.destination_study_plan_id,
            incoming_student: {
                names: xt.value.names,
                first_surname: xt.value.first_surname,
                second_surname: xt.value.second_surname || null,
                email: xt.value.email,
                curp: xt.value.curp || null,
            },
        })
        toast.success('Traslado externo creado')
        openTransfer.value = false
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
        let data: any
        if (out.value.dest === 'sgi') {
            // Salida a otro plantel del SGI = traslado interno (el destino lo recibe en "Entrantes").
            ({ data } = await api.post(API.SCHOOL_SERVICES_API.mobility.cases, {
                origin_student_id: out.value.student_id,
                destination_college_id: out.value.destination_college_id,
            }))
        } else {
            // Salida a institución externa: se emite certificado parcial + oficio.
            ({ data } = await api.post(API.SCHOOL_SERVICES_API.mobility.outbound, {
                student_id: out.value.student_id,
                origin_institution_id: out.value.origin_institution_id,
            }))
        }
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
