<template>
    <div class="p-6 space-y-5 max-w-5xl mx-auto">
        <div class="flex items-center gap-3">
            <router-link to="/school-services/mobility" class="text-slate-400 hover:text-slate-600 text-sm">← Movilidad</router-link>
        </div>

        <div v-if="loading" class="py-16 text-center text-slate-400">Cargando…</div>

        <template v-else-if="c">
            <!-- Encabezado -->
            <div class="rounded-xl border border-slate-200 p-5">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-lg font-semibold text-slate-800">Expediente #{{ c.id }}</h1>
                            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="mobilityKind(c).cls">{{ mobilityKind(c).label }}</span>
                        </div>
                        <p class="text-sm text-slate-500 mt-1">{{ mobilityKind(c).desc }}</p>
                        <p class="text-xs text-slate-400 mt-1">Plantel C{{ c.origin_college_id ?? '—' }} → C{{ c.destination_college_id ?? '—' }} · Alumno origen #{{ c.origin_student_id ?? '—' }}</p>
                    </div>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold shrink-0" :class="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
                </div>
                <div v-if="c.dictamen_number" class="mt-2 text-sm text-slate-500">Dictamen: <span class="font-medium text-slate-700">{{ c.dictamen_number }}</span> · {{ c.resolution_date }}</div>
                <div v-if="c.status === 'applied'" class="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                    Aplicado. Alumno receptor #{{ c.student_id }} · afiliación #{{ c.new_affiliation_id }} · {{ c.recognized_count }} materias asentadas.
                </div>
            </div>

            <!-- Datos del alumno capturados (traslado externo: alta al aplicar) -->
            <div v-if="c.incoming_student && c.status !== 'applied'" class="rounded-xl border border-slate-200 p-5">
                <h2 class="font-semibold text-slate-800 mb-1">Alumno por dar de alta</h2>
                <p class="text-xs text-slate-400 mb-3">Estos datos se registraron en el expediente. El alta (número de control nuevo) se hará al aplicar.</p>
                <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div><span class="text-slate-400">Nombre:</span> <span class="text-slate-700">{{ c.incoming_student.names }} {{ c.incoming_student.first_surname }} {{ c.incoming_student.second_surname }}</span></div>
                    <div><span class="text-slate-400">Correo:</span> <span class="text-slate-700">{{ c.incoming_student.email }}</span></div>
                    <div v-if="c.incoming_student.curp"><span class="text-slate-400">CURP:</span> <span class="text-slate-700">{{ c.incoming_student.curp }}</span></div>
                    <div><span class="text-slate-400">Institución de origen:</span> <span class="text-slate-700">{{ c.external_institution_name }} <span v-if="c.external_institution_place">· {{ c.external_institution_place }}</span></span></div>
                </div>
            </div>

            <!-- Certificado parcial (salida externa) -->
            <div v-if="isOutbound" class="rounded-xl border border-slate-200 p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="font-semibold text-slate-800">Certificado parcial de estudios</h2>
                    <span class="text-sm text-slate-500">Destino: {{ c.external_institution_name }}</span>
                </div>
                <div v-if="cert" class="overflow-hidden rounded-lg border border-slate-100">
                    <div class="px-3 py-2 bg-slate-50 text-sm text-slate-600">
                        {{ cert.student?.name }} · N.C. {{ cert.student?.num_control }} · {{ cert.grades.length }} materias
                    </div>
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500"><tr>
                            <th class="text-left px-3 py-2 font-medium">Clave</th>
                            <th class="text-left px-3 py-2 font-medium">Materia</th>
                            <th class="text-left px-3 py-2 font-medium">Cal.</th>
                            <th class="text-left px-3 py-2 font-medium">Tipo</th>
                        </tr></thead>
                        <tbody>
                            <tr v-for="(g, i) in cert.grades" :key="i" class="border-t border-slate-100">
                                <td class="px-3 py-1.5 font-mono text-xs text-slate-400">{{ g.code }}</td>
                                <td class="px-3 py-1.5 text-slate-700">{{ g.subject }}</td>
                                <td class="px-3 py-1.5 text-slate-600">{{ g.grade ?? '—' }}</td>
                                <td class="px-3 py-1.5 text-slate-500 text-xs">{{ g.approval || '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-else class="text-sm text-slate-400">Cargando certificado…</p>
            </div>

            <!-- Convalidación / dictamen -->
            <div v-if="!isOutbound" class="rounded-xl border border-slate-200 p-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="font-semibold text-slate-800">Dictamen ({{ items.length }} materias · {{ recognizedCount }} reconocidas)</h2>
                    <div v-if="canEdit && !isExternal" class="flex items-end gap-2">
                        <div class="w-64">
                            <FormRemoteSelect
                                :key="c.destination_college_id"
                                v-model="destPlanId"
                                label="Plan destino"
                                :endpoint="API.SCHOOL_SERVICES_API.mobility.studyPlans"
                                :params="{ college_id: c.destination_college_id }"
                                item-label="label"
                                item-value="id"
                                placeholder="Selecciona plan…"
                            />
                        </div>
                        <button class="h-10 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40" :disabled="!destPlanId || busy" @click="autoMatch">Convalidar por clave</button>
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

            <!-- Documentos / Evidencia -->
            <div v-if="c.requirement_set_id" class="rounded-xl border border-slate-200 p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="font-semibold text-slate-800">Documentos / Evidencia</h2>
                    <span class="text-xs text-slate-400">Requisitos congelados según la normativa vigente al registrar</span>
                </div>
                <div v-if="docs" class="space-y-2">
                    <div v-for="it in docs.items" :key="it.document_type_id" class="rounded-lg border border-slate-100 p-3">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-slate-700">
                                    {{ it.document_type }}
                                    <span v-if="it.is_required" class="ml-1 text-[10px] rounded bg-rose-50 text-rose-600 px-1">requerido</span>
                                    <span v-else class="ml-1 text-[10px] rounded bg-slate-100 text-slate-500 px-1">opcional</span>
                                </p>
                                <p v-if="it.normativa" class="text-xs text-slate-400">{{ it.normativa }}</p>
                                <div v-for="f in it.files" :key="f.id" class="mt-1 flex items-center gap-2 text-xs">
                                    <button class="text-blue-600 hover:underline truncate" @click="downloadDoc(f)">{{ f.original_name }}</button>
                                    <span v-if="f.validated" class="text-emerald-600 shrink-0" :title="'Validado por ' + (f.validated_by || '')">✓ validado</span>
                                    <button v-else-if="canEdit" class="text-slate-500 hover:text-emerald-600 shrink-0" @click="validateDoc(f.id)">Validar</button>
                                    <button v-if="canEdit" class="text-rose-400 hover:text-rose-600 shrink-0" @click="deleteDoc(f.id)">✕</button>
                                </div>
                                <p v-if="!it.files.length" class="mt-1 text-xs" :class="it.is_required ? 'text-rose-500' : 'text-slate-400'">Sin subir</p>
                            </div>
                            <label v-if="canEdit" class="shrink-0 cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                                Subir
                                <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" @change="uploadDoc(it.document_type_id, $event)" />
                            </label>
                        </div>
                    </div>
                    <div v-if="docs.extra && docs.extra.length" class="pt-1">
                        <p class="text-xs text-slate-400 mb-1">Otros adjuntos</p>
                        <div v-for="f in docs.extra" :key="f.id" class="flex items-center gap-2 text-xs">
                            <button class="text-blue-600 hover:underline truncate" @click="downloadDoc(f)">{{ f.original_name }} <span class="text-slate-400">({{ f.document_type }})</span></button>
                            <button v-if="canEdit" class="text-rose-400 hover:text-rose-600" @click="deleteDoc(f.id)">✕</button>
                        </div>
                    </div>
                </div>
                <p v-else class="text-sm text-slate-400">Cargando documentos…</p>
            </div>

            <!-- Acciones de flujo -->
            <div class="rounded-xl border border-slate-200 p-5">
                <h2 class="font-semibold text-slate-800 mb-3">Acciones</h2>
                <div class="flex flex-wrap items-center gap-2">
                    <button v-if="c.status === 'draft'" class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="busy" @click="act('send')">Enviar al plantel destino</button>
                    <button v-if="c.status === 'sent'" class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="busy" @click="act('review')">Tomar para revisión</button>

                    <template v-if="c.status === 'in_review'">
                        <input v-model="dictamen" placeholder="No. dictamen" class="h-9 w-40 rounded-lg border border-slate-300 px-3 text-sm" />
                        <input v-model="resolutionDate" type="date" class="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
                        <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="busy" @click="approve">Aprobar dictamen</button>
                    </template>

                    <template v-if="c.status === 'approved'">
                        <input v-model="numControl" placeholder="Núm. control (opc.)" class="h-9 w-44 rounded-lg border border-slate-300 px-3 text-sm" />
                        <input v-model.number="periodNumber" type="number" placeholder="Semestre" class="h-9 w-28 rounded-lg border border-slate-300 px-3 text-sm" />
                        <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="busy" @click="apply">Aplicar traslado</button>
                    </template>

                    <button v-if="['sent','in_review'].includes(c.status)" class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40" :disabled="busy" @click="reject">Rechazar</button>
                    <button v-if="['draft','sent','in_review','approved'].includes(c.status)" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40" :disabled="busy" @click="act('cancel')">Cancelar</button>
                </div>
                <p v-if="c.status === 'approved'" class="mt-2 text-xs text-amber-600">El traslado no se aplica hasta reunir todas las firmas requeridas del dictamen.</p>
            </div>

            <!-- Firmas del dictamen (solo lectura: cada firmante firma desde su bandeja) -->
            <div v-if="signers.length" class="rounded-xl border border-slate-200 p-5 space-y-3">
                <h2 class="font-semibold text-slate-800">Firmas del dictamen</h2>
                <p class="text-xs text-slate-400">Estas firmas avalan el dictamen; hasta reunirlas todas no puede aplicarse. Cada firmante las realiza desde <b>Trámites → Movilidad → Por firmar</b>.</p>
                <div v-for="s in signers" :key="s.slot" class="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-700">{{ s.avala || s.slot }}</p>
                        <p class="text-xs text-slate-400">
                            {{ s.role_code }}<span v-if="s.context === 'career'"> · de la carrera del caso</span><span v-else-if="s.context === 'college'"> · del plantel</span>
                        </p>
                        <p v-if="s.signed" class="text-xs text-emerald-600 mt-1">✓ Firmado por {{ s.signed.signer_name }} · folio {{ s.signed.folio }}</p>
                        <p v-else class="text-xs text-amber-600 mt-1">Pendiente de firma</p>
                    </div>
                    <span class="shrink-0 text-xs font-semibold" :class="s.signed ? 'text-emerald-600' : 'text-amber-500'">{{ s.signed ? 'Firmado' : 'Pendiente' }}</span>
                </div>
            </div>

            <!-- Documentos (reporteador: DAO + plantilla .docx → PDF) -->
            <div class="rounded-xl border border-slate-200 p-5">
                <h2 class="font-semibold text-slate-800 mb-1">Documentos</h2>
                <p class="text-xs text-slate-400 mb-3">Formato estándar TecNM/DGAIR (Acuerdo 286) con folio de firma electrónica y ruta de verificación.</p>
                <div class="flex flex-wrap gap-2">
                    <ReportGenerateButton v-if="!isOutbound" report-code="RPT.MOV_DICTAMEN" :params="{ case_id: id }" format="pdf" label="Dictamen" :filename="`dictamen-${id}`" />
                    <ReportGenerateButton v-if="isOutbound" report-code="RPT.MOV_CERT_PARCIAL" :params="{ case_id: id }" format="pdf" label="Certificado parcial" :filename="`certificado-${id}`" />
                    <ReportGenerateButton v-if="isOutbound" report-code="RPT.MOV_OFICIO" :params="{ case_id: id }" format="pdf" label="Oficio de traslado" :filename="`oficio-${id}`" />
                </div>
            </div>
        </template>

    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import ReportGenerateButton from '@/modules/reports/components/ReportGenerateButton.vue'
import { statusClass, statusLabel } from '@/modules/school-services/mobility.status'
import { mobilityKind } from '@/modules/school-services/mobility.labels'

const route = useRoute()
const toast = useToast()
const { confirm } = useConfirm()
const id = Number(route.params.id)

const c = ref<any>(null)
const items = ref<any[]>([])
const loading = ref(true)
const busy = ref(false)
const signers = ref<any[]>([])
const destPlanId = ref<number | null>(null)
const dictamen = ref('')
const resolutionDate = ref('')
const numControl = ref('')
const periodNumber = ref<number | null>(null)

const cert = ref<any>(null)
const docs = ref<any>(null)
const canEdit = computed(() => c.value && ['draft', 'in_review'].includes(c.value.status))
const isExternal = computed(() => c.value?.scope === 'external')
const isOutbound = computed(() => c.value?.direction === 'outbound' && isExternal.value)
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
        if (isOutbound.value) {
            try { cert.value = (await api.get(API.SCHOOL_SERVICES_API.mobility.certificate(id))).data } catch { /* sin certificado */ }
        }
        if (data.requirement_set_id) await loadDocuments()
        await loadSignatures()
    } finally {
        loading.value = false
    }
}

async function loadDocuments() {
    try { docs.value = (await api.get(API.SCHOOL_SERVICES_API.mobility.documents(id))).data } catch { /* sin requisitos */ }
}

async function uploadDoc(typeId: number, ev: Event) {
    const input = ev.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('document_type_id', String(typeId))
    fd.append('file', file)
    try {
        await api.post(API.SCHOOL_SERVICES_API.mobility.documents(id), fd)
        toast.success('Documento subido')
        await loadDocuments()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo subir el documento')
    } finally {
        input.value = ''
    }
}

async function downloadDoc(f: any) {
    try {
        const res = await api.get(API.SCHOOL_SERVICES_API.mobility.documentDownload(id, f.id), { responseType: 'blob' })
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url; a.download = f.original_name; a.click()
        URL.revokeObjectURL(url)
    } catch {
        toast.error('No se pudo descargar')
    }
}

async function deleteDoc(docId: number) {
    if (!await confirm({ title: 'Eliminar documento', message: '¿Eliminar este documento?', variant: 'danger' })) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.mobility.documentDelete(id, docId))
        await loadDocuments()
    } catch {
        toast.error('No se pudo eliminar')
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

async function loadSignatures() {
    try { signers.value = (await api.get(API.SCHOOL_SERVICES_API.mobility.signatures(id))).data.data ?? [] } catch { signers.value = [] }
}

async function validateDoc(docId: number) {
    try {
        await api.post(API.SCHOOL_SERVICES_API.mobility.documentValidate(id, docId))
        await loadDocuments()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo validar')
    }
}

onMounted(load)
</script>

