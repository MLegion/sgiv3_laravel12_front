<template>
    <div class="space-y-6 max-w-4xl">
        <div class="flex items-center gap-3">
            <button type="button" class="text-xs px-2 py-1 border rounded-md hover:bg-slate-50" @click="router.back()">← Volver</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Detalle de Residencia</h1>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>

        <template v-else-if="residency">
            <!-- Datos generales -->
            <div class="rounded-xl border bg-white p-5 grid sm:grid-cols-2 gap-4 text-sm">
                <Field label="Residente" :value="residency.studentName" :sub="residency.numControl" />
                <Field label="Carrera" :value="residency.career" />
                <Field label="Empresa" :value="residency.company" />
                <Field label="Asesor externo" :value="residency.companyAdvisor" />
                <Field label="Modalidad" :value="optionLabel(residency.projectOption)" />
                <Field label="NSS" :value="residency.nss" />
                <div class="sm:col-span-2">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Proyecto</p>
                    <p class="text-sm text-slate-700">{{ residency.project ?? residency.projectTitle ?? '—' }}</p>
                </div>
            </div>

            <!-- Activación + instructivo -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Estado de activación</h2>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          :class="residency.status === 'pending_activation' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">
                        {{ residency.status === 'pending_activation' ? 'Pendiente de activación' : 'Activada' }}
                    </span>
                </div>
                <div v-if="canManage" class="flex items-center gap-2">
                    <button v-if="residency.status === 'pending_activation'" type="button"
                        class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" @click="activate">
                        Activar residencia
                    </button>
                    <button v-else type="button"
                        class="text-xs px-3 py-2 border rounded-md hover:bg-slate-50" @click="resendInstructions">
                        Reenviar instructivo
                    </button>
                </div>
                <p v-if="actionMsg" class="text-xs" :class="actionErr ? 'text-red-600' : 'text-emerald-600'">{{ actionMsg }}</p>
            </div>

            <!-- Aval del proyecto -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Aval del proyecto</h2>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(residency.projectApprovalStatus)">
                        {{ approvalLabel(residency.projectApprovalStatus) }}
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" class="text-xs px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        @click="approveProject">Avalar proyecto</button>
                    <button type="button" class="text-xs px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        @click="openReason('project')">Rechazar</button>
                </div>
            </div>

            <!-- Comisión de asesores internos -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Comisión de asesores internos</h2>

                <ul v-if="residency.advisors.length" class="space-y-1.5">
                    <li v-for="a in residency.advisors" :key="a.id" class="flex items-center justify-between text-sm">
                        <div>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 mr-2">{{ a.advisorTypeLabel }}</span>
                            <span class="text-slate-700">{{ a.advisorName ?? ('usuario #' + a.advisorUserId) }}</span>
                        </div>
                        <button type="button" class="text-xs px-2 py-1 border rounded-md text-red-600 hover:bg-red-50" @click="removeAdvisor(a.id)">Quitar</button>
                    </li>
                </ul>
                <p v-else class="text-xs text-slate-400 italic">Sin asesores asignados.</p>

                <div class="flex flex-wrap items-end gap-2 border-t pt-3">
                    <select v-model="advisorType" class="border rounded-md px-3 py-2 text-sm">
                        <option v-for="o in ADVISOR_TYPE_OPTIONS" :key="o.value" :value="o.value"
                            :disabled="residency.advisors.some(a => a.advisorType === o.value)">{{ o.label }}</option>
                    </select>
                    <div class="w-72">
                        <FormRemoteSelect
                            v-model="advisorUserId"
                            :endpoint="R.residency.advisorCandidates"
                            item-value="userId"
                            item-label="name"
                            :item-searchs="['name']"
                            placeholder="Buscar docente/empleado…" />
                    </div>
                    <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        :disabled="!advisorUserId || assigning" @click="assignAdvisor">Asignar</button>
                </div>
                <p v-if="advisorMsg" class="text-xs" :class="advisorError ? 'text-red-600' : 'text-emerald-600'">{{ advisorMsg }}</p>
            </div>

            <!-- Evaluación -->
            <ResidencyEvaluationCard :residency-id="props.id" :can-confirm="true" @confirmed="load" />

            <!-- Carta de presentación -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Carta de presentación</h2>
                <p class="text-xs text-slate-500">
                    Se habilita cuando el proyecto está avalado y el kardex sellado y la vigencia del IMSS están aprobados.
                </p>
                <div v-if="canGenerateLetter">
                    <ReportGenerateButton
                        :report-code="ReportCode.RESIDENCY_PRESENTATION_LETTER"
                        :params="{ residency_id: Number(props.id) }"
                        format="docx"
                        label="Generar carta (DOCX)"
                        :filename="`carta-presentacion-${residency.numControl ?? props.id}`" />
                </div>
                <p v-else class="text-xs text-amber-600">
                    Falta: {{ letterMissing.join(', ') }}.
                </p>
            </div>

            <!-- Documentos -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Documentos</h2>
                <ul class="space-y-2">
                    <li v-for="item in checklist" :key="item.typeId"
                        class="flex items-center justify-between rounded-lg border px-4 py-3"
                        :class="item.document ? 'bg-slate-50' : 'bg-white'">
                        <div class="space-y-0.5">
                            <p class="text-sm font-medium text-slate-700">{{ item.name }}</p>
                            <p v-if="item.document" class="text-xs text-slate-400">{{ item.document.originalName }}</p>
                            <p v-else class="text-xs text-slate-400 italic">Sin subir</p>
                            <p v-if="item.document?.status === 'rejected' && item.document.rejectionReason" class="text-xs text-red-600">
                                Rechazado: {{ item.document.rejectionReason }}
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span v-if="item.document" class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(item.document.status)">
                                {{ approvalLabel(item.document.status) }}
                            </span>
                            <template v-if="item.document">
                                <a :href="downloadUrl(item.document.id)" target="_blank" class="text-xs px-2 py-1.5 border rounded-md hover:bg-slate-100">Ver</a>
                                <button type="button" class="text-xs px-2 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                    @click="approveDoc(item.document.id)">Aprobar</button>
                                <button type="button" class="text-xs px-2 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    @click="openReason('doc', item.document.id)">Rechazar</button>
                            </template>
                        </div>
                    </li>
                </ul>
            </div>
        </template>

        <!-- Modal de motivo (rechazo) -->
        <Teleport to="body">
            <div v-if="reason.open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="reason.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-semibold text-slate-800">Motivo del rechazo</h3>
                    <textarea v-model="reason.text" rows="3" class="border rounded-md w-full px-3 py-2 text-sm"
                        placeholder="Explica por qué se rechaza…"></textarea>
                    <p v-if="reason.error" class="text-xs text-red-600">{{ reason.error }}</p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="reason.open = false">Cancelar</button>
                        <button type="button" class="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700" @click="submitReason">Rechazar</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import ReportGenerateButton from '@/modules/reports/components/ReportGenerateButton.vue'
import ResidencyEvaluationCard from '@/modules/residencies/components/ResidencyEvaluationCard.vue'
import { ReportCode } from '@/modules/reports/types/reportCodes'
import type { Residency, ResidencyDocumentChecklistItem, ApprovalStatus, ProjectOption, ResidencyAdvisorType } from '@/modules/residencies/types/residency.type'
import { ADVISOR_TYPE_OPTIONS } from '@/modules/residencies/types/residency.type'

const props = defineProps<{ id: string | number }>()
const R = API.RESIDENCIES_API
const router = useRouter()

const loading   = ref(true)
const residency = ref<Residency | null>(null)
const checklist = ref<ResidencyDocumentChecklistItem[]>([])

const actionMsg = ref('')
const actionErr = ref(false)
const canManage = ref(false)

const advisorUserId = ref<number | null>(null)
const advisorType   = ref<ResidencyAdvisorType>('principal')
const assigning     = ref(false)
const advisorMsg    = ref<string | null>(null)
const advisorError  = ref(false)

const reason = reactive<{ open: boolean; text: string; error: string | null; mode: 'project' | 'doc'; docId: number | null }>({
    open: false, text: '', error: null, mode: 'project', docId: null,
})

// Habilitación de la carta: proyecto avalado + kardex sellado + vigencia IMSS aprobados.
const letterMissing = computed<string[]>(() => {
    const missing: string[] = []
    if (residency.value?.projectApprovalStatus !== 'approved') missing.push('aval del proyecto')
    const docOk = (code: string) =>
        checklist.value.find(i => i.code === code)?.document?.status === 'approved'
    if (!docOk('KARDEX_SELLADO')) missing.push('kardex sellado aprobado')
    if (!docOk('VIGENCIA_IMSS')) missing.push('vigencia IMSS aprobada')
    return missing
})
const canGenerateLetter = computed(() => letterMissing.value.length === 0)

// Componente inline de campo
const Field = (p: { label: string; value?: string | null; sub?: string | null }) => h('div', [
    h('p', { class: 'text-[10px] font-black text-slate-400 uppercase tracking-wider' }, p.label),
    h('p', { class: 'text-sm text-slate-700' }, p.value ?? '—'),
    p.sub ? h('p', { class: 'text-[10px] font-mono text-slate-400' }, p.sub) : null,
])

async function load() {
    loading.value = true
    try {
        const [{ data: r }, { data: docs }] = await Promise.all([
            api.get(R.residency.byId(props.id)),
            api.get(R.documents.forResidency(props.id)),
        ])
        residency.value = r
        checklist.value = docs ?? []
    } finally { loading.value = false }
}

// Solo el coordinador (res.residency.manage) puede activar/reenviar. Probe con
// el endpoint de auto-accept, gateado por el mismo permiso (oculta ante 403).
async function loadCanManage() {
    try { await api.get(R.documents.autoAccept); canManage.value = true }
    catch { canManage.value = false }
}

async function activate() {
    actionMsg.value = ''
    try {
        await api.post(R.residency.activate(props.id), {})
        await load()
        actionMsg.value = 'Residencia activada. Se envió el instructivo al residente.'
        actionErr.value = false
    } catch (e: any) {
        actionMsg.value = e?.response?.data?.message ?? 'No se pudo activar.'
        actionErr.value = true
    }
}

async function resendInstructions() {
    actionMsg.value = ''
    try {
        await api.post(R.residency.resendInstructions(props.id), {})
        actionMsg.value = 'Instructivo reenviado al residente.'
        actionErr.value = false
    } catch (e: any) {
        actionMsg.value = e?.response?.data?.message ?? 'No se pudo reenviar.'
        actionErr.value = true
    }
}

async function approveProject() {
    try {
        await api.post(R.residency.approveProject(props.id), {})
        await load()
        useToast().success('Proyecto aprobado.')
    } catch (e: any) {
        useToast().error(e?.response?.data?.message ?? 'No se pudo aprobar el proyecto.')
    }
}
async function assignAdvisor() {
    if (!advisorUserId.value) return
    assigning.value = true; advisorMsg.value = null
    try {
        await api.post(R.residency.assignAdvisor(props.id), { advisor_user_id: advisorUserId.value, advisor_type: advisorType.value })
        advisorError.value = false
        advisorMsg.value = 'Asesor asignado.'
        advisorUserId.value = null
        await load()
    } catch (e: any) {
        advisorError.value = true
        advisorMsg.value = e?.response?.data?.message ?? 'No se pudo asignar.'
    } finally { assigning.value = false }
}
async function removeAdvisor(advisorRowId: number) {
    try {
        await api.delete(R.residency.removeAdvisor(props.id, advisorRowId))
        await load()
        useToast().success('Asesor removido.')
    } catch (e: any) {
        useToast().error(e?.response?.data?.message ?? 'No se pudo remover al asesor.')
    }
}
async function approveDoc(id: number) {
    try {
        await api.post(R.documents.approve(id), {})
        await load()
        useToast().success('Documento aprobado.')
    } catch (e: any) {
        useToast().error(e?.response?.data?.message ?? 'No se pudo aprobar el documento.')
    }
}

function openReason(mode: 'project' | 'doc', docId: number | null = null) {
    reason.open = true; reason.text = ''; reason.error = null; reason.mode = mode; reason.docId = docId
}
async function submitReason() {
    if (!reason.text.trim()) { reason.error = 'El motivo es obligatorio.'; return }
    try {
        if (reason.mode === 'project') {
            await api.post(R.residency.rejectProject(props.id), { reason: reason.text })
        } else if (reason.docId) {
            await api.post(R.documents.reject(reason.docId), { reason: reason.text })
        }
        reason.open = false
        await load()
    } catch (e: any) {
        reason.error = e?.response?.data?.message ?? 'No se pudo rechazar.'
    }
}

function downloadUrl(id: number) { return R.documents.download(id) }

function optionLabel(o: ProjectOption | null): string {
    return ({ worker: 'Trabajador', own: 'Propuesta propia', bank: 'Banco de proyectos' } as Record<string, string>)[o ?? ''] ?? '—'
}
function approvalLabel(s: ApprovalStatus | null): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADO', rejected: 'RECHAZADO' } as Record<string, string>)[s ?? ''] ?? 'SIN PROPONER'
}
function approvalClass(s: ApprovalStatus | null): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s ?? ''] ?? 'bg-slate-100 text-slate-500'
}

load()
loadCanManage()
</script>
