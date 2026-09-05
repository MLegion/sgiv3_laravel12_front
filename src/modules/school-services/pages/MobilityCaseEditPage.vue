<template>
    <div class="p-6 space-y-5 max-w-5xl mx-auto">
        <div class="flex items-center gap-3">
            <router-link to="/school-services/mobility" class="text-slate-400 hover:text-slate-600 text-sm">← Movilidad</router-link>
        </div>

        <div v-if="loading" class="py-16 text-center text-slate-400">Cargando…</div>

        <template v-else-if="c">
            <!-- Encabezado -->
            <div class="rounded-xl border border-slate-200 p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-lg font-semibold text-slate-800">Expediente #{{ c.id }} · <span class="capitalize">{{ c.process_type }}</span></h1>
                        <p class="text-sm text-slate-500">Plantel C{{ c.origin_college_id ?? '—' }} → C{{ c.destination_college_id ?? '—' }} · Alumno origen #{{ c.origin_student_id ?? '—' }}</p>
                    </div>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
                </div>
                <div v-if="c.dictamen_number" class="mt-2 text-sm text-slate-500">Dictamen: <span class="font-medium text-slate-700">{{ c.dictamen_number }}</span> · {{ c.resolution_date }}</div>
                <div v-if="c.status === 'applied'" class="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                    Aplicado. Alumno receptor #{{ c.student_id }} · afiliación #{{ c.new_affiliation_id }} · {{ c.recognized_count }} materias asentadas.
                </div>
            </div>

            <!-- Convalidación / dictamen -->
            <div class="rounded-xl border border-slate-200 p-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="font-semibold text-slate-800">Dictamen ({{ items.length }} materias · {{ recognizedCount }} reconocidas)</h2>
                    <div v-if="canEdit && !isExternal" class="flex items-center gap-2">
                        <input v-model.number="destPlanId" type="number" placeholder="ID plan destino" class="h-9 w-40 rounded-lg border border-slate-300 px-3 text-sm" />
                        <button class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40" :disabled="!destPlanId || busy" @click="autoMatch">Convalidar por clave</button>
                    </div>
                    <button v-if="canEdit && isExternal" class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700" @click="addRow">+ Agregar materia</button>
                </div>

                <div class="overflow-hidden rounded-lg border border-slate-100">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500">
                            <tr>
                                <th class="text-left px-3 py-2 font-medium">Materia origen</th>
                                <th class="text-left px-3 py-2 font-medium">Cal.</th>
                                <th class="text-left px-3 py-2 font-medium">Materia destino</th>
                                <th class="text-left px-3 py-2 font-medium">Reconocida</th>
                                <th class="text-left px-3 py-2 font-medium">Decisión</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!items.length"><td colspan="5" class="px-3 py-6 text-center text-slate-400">Sin materias. Usa “Convalidar por clave”.</td></tr>
                            <tr v-for="(it, idx) in items" :key="it.id ?? ('n' + idx)" class="border-t border-slate-100">
                                <td class="px-3 py-2">
                                    <template v-if="canEdit && isExternal">
                                        <input v-model="it.origin_subject_code" placeholder="Clave" class="mb-1 w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono" />
                                        <input v-model="it.origin_subject_name" placeholder="Nombre materia origen" class="w-full rounded border border-slate-200 px-2 py-1 text-xs" />
                                    </template>
                                    <template v-else>
                                        <span class="font-mono text-xs text-slate-400">{{ it.origin_subject_code || '—' }}</span>
                                        <span class="block text-slate-700">{{ it.origin_subject_name || ('#' + it.origin_subject_id) }}</span>
                                    </template>
                                </td>
                                <td class="px-3 py-2 text-slate-600">
                                    <input v-if="canEdit && isExternal" v-model.number="it.origin_grade" type="number" class="w-16 rounded border border-slate-200 px-2 py-1 text-xs" />
                                    <span v-else>{{ it.origin_grade ?? '—' }}</span>
                                </td>
                                <td class="px-3 py-2 text-slate-600">
                                    <input v-if="canEdit && isExternal" v-model.number="it.destination_subject_id" type="number" placeholder="ID" class="w-20 rounded border border-slate-200 px-2 py-1 text-xs" />
                                    <template v-else>#{{ it.destination_subject_id ?? '—' }} <span v-if="it.is_auto" class="text-[10px] rounded bg-blue-50 text-blue-600 px-1">auto</span></template>
                                </td>
                                <td class="px-3 py-2 text-slate-700">
                                    <input v-if="canEdit && isExternal" v-model.number="it.recognized_grade" type="number" class="w-16 rounded border border-slate-200 px-2 py-1 text-xs" />
                                    <span v-else>{{ it.recognized_grade ?? '—' }}</span>
                                </td>
                                <td class="px-3 py-2">
                                    <div class="flex items-center gap-2">
                                        <select v-if="canEdit" v-model="it.decision" class="rounded border border-slate-300 text-xs px-2 py-1">
                                            <option value="recognized">Reconocida</option>
                                            <option value="not_recognized">No reconocida</option>
                                            <option value="pending">Pendiente</option>
                                        </select>
                                        <span v-else class="text-xs" :class="it.decision === 'recognized' ? 'text-emerald-600' : 'text-slate-400'">{{ decisionLabel(it.decision) }}</span>
                                        <button v-if="canEdit && isExternal" class="text-rose-500 hover:text-rose-700 text-xs" @click="items.splice(idx, 1)">✕</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="canEdit && items.length" class="flex justify-end">
                    <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40" :disabled="busy" @click="saveItems">Guardar dictamen</button>
                </div>
            </div>

            <!-- Acciones de flujo -->
            <div class="rounded-xl border border-slate-200 p-5">
                <h2 class="font-semibold text-slate-800 mb-3">Acciones</h2>
                <div class="flex flex-wrap items-center gap-2">
                    <button v-if="c.status === 'draft'" class="btn-primary" :disabled="busy" @click="act('send')">Enviar al plantel destino</button>
                    <button v-if="c.status === 'sent'" class="btn-primary" :disabled="busy" @click="act('review')">Tomar para revisión</button>

                    <template v-if="c.status === 'in_review'">
                        <input v-model="dictamen" placeholder="No. dictamen" class="h-9 w-40 rounded-lg border border-slate-300 px-3 text-sm" />
                        <input v-model="resolutionDate" type="date" class="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
                        <button class="btn-primary" :disabled="busy" @click="approve">Aprobar dictamen</button>
                    </template>

                    <template v-if="c.status === 'approved'">
                        <button class="btn-secondary" :disabled="busy" @click="signOpen = true">Firmar dictamen</button>
                        <input v-model="numControl" placeholder="Núm. control (opc.)" class="h-9 w-44 rounded-lg border border-slate-300 px-3 text-sm" />
                        <input v-model.number="periodNumber" type="number" placeholder="Semestre" class="h-9 w-28 rounded-lg border border-slate-300 px-3 text-sm" />
                        <button class="btn-primary" :disabled="busy" @click="apply">Aplicar traslado</button>
                    </template>

                    <button v-if="['sent','in_review'].includes(c.status)" class="btn-danger" :disabled="busy" @click="reject">Rechazar</button>
                    <button v-if="['draft','sent','in_review','approved'].includes(c.status)" class="btn-ghost" :disabled="busy" @click="act('cancel')">Cancelar</button>
                </div>
                <p v-if="c.status === 'approved'" class="mt-2 text-xs text-amber-600">El traslado no se aplica sin una firma válida del dictamen.</p>
            </div>
        </template>

        <SignDocumentModal
            v-model="signOpen"
            :signable-type="SIGNABLE_TYPE"
            :signable-id="id"
            purpose="aplicar_traslado"
            label="Dictamen de traslado"
            @signed="onSigned"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import SignDocumentModal from '@/modules/signatures/modals/SignDocumentModal.vue'
import { statusClass, statusLabel } from '@/modules/school-services/mobility.status'

const SIGNABLE_TYPE = 'Modules\\SchoolServices\\Infrastructure\\Models\\StudentMobilityCase'

const route = useRoute()
const toast = useToast()
const { confirm } = useConfirm()
const id = Number(route.params.id)

const c = ref<any>(null)
const items = ref<any[]>([])
const loading = ref(true)
const busy = ref(false)
const signOpen = ref(false)
const destPlanId = ref<number | null>(null)
const dictamen = ref('')
const resolutionDate = ref('')
const numControl = ref('')
const periodNumber = ref<number | null>(null)

const canEdit = computed(() => c.value && ['draft', 'in_review'].includes(c.value.status))
const isExternal = computed(() => c.value?.scope === 'external')
const recognizedCount = computed(() => items.value.filter((i) => i.decision === 'recognized').length)

function decisionLabel(d: string) { return d === 'recognized' ? 'Reconocida' : d === 'not_recognized' ? 'No reconocida' : 'Pendiente' }

function addRow() {
    items.value.push({ id: null, origin_subject_code: '', origin_subject_name: '', origin_grade: null, destination_subject_id: null, recognized_grade: null, decision: 'recognized', is_auto: false })
}

function hydrate(data: any) {
    c.value = data
    items.value = (data.items ?? []).map((i: any) => ({ ...i }))
    if (data.destination_study_plan_id) destPlanId.value = data.destination_study_plan_id
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.mobility.byId(id))
        hydrate(data)
    } finally {
        loading.value = false
    }
}

async function run(fn: () => Promise<any>, okMsg?: string) {
    busy.value = true
    try {
        const { data } = await fn()
        hydrate(data)
        if (okMsg) toast.success(okMsg)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'Operación no permitida')
    } finally {
        busy.value = false
    }
}

const autoMatch = () => run(() => api.post(API.SCHOOL_SERVICES_API.mobility.autoMatch(id), { destination_study_plan_id: destPlanId.value }), 'Convalidación generada')
const saveItems = () => run(() => api.put(API.SCHOOL_SERVICES_API.mobility.items(id), { items: items.value }), 'Dictamen guardado')
const act = (action: 'send' | 'review' | 'cancel') => run(() => api.post((API.SCHOOL_SERVICES_API.mobility as any)[action](id), {}))
const approve = () => run(() => api.post(API.SCHOOL_SERVICES_API.mobility.approve(id), { dictamen_number: dictamen.value || null, resolution_date: resolutionDate.value || null }), 'Dictamen aprobado')

async function reject() {
    const reason = window.prompt('Motivo del rechazo:')
    if (!reason) return
    await run(() => api.post(API.SCHOOL_SERVICES_API.mobility.reject(id), { reason }))
}

async function apply() {
    if (!await confirm({ title: 'Aplicar traslado', message: 'Se creará el alumno receptor, se asentará el kardex y se dará de baja en origen. ¿Continuar?', variant: 'warning' })) return
    await run(() => api.post(API.SCHOOL_SERVICES_API.mobility.apply(id), { num_control: numControl.value || null, current_period_number: periodNumber.value || null }), 'Traslado aplicado')
}

function onSigned() { toast.success('Dictamen firmado. Ya puedes aplicar el traslado.') }

onMounted(load)
</script>

<style scoped>
.btn-primary { @apply rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40; }
.btn-secondary { @apply rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40; }
.btn-danger { @apply rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40; }
.btn-ghost { @apply rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40; }
</style>
