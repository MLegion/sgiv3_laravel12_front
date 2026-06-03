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

            <!-- Asesor interno -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Asesor interno</h2>
                <p v-if="residency.internalAdvisorId" class="text-xs text-emerald-600">Asesor asignado (usuario #{{ residency.internalAdvisorId }}).</p>
                <div class="flex items-center gap-2">
                    <input v-model.number="advisorUserId" type="number" min="1" placeholder="ID de usuario del docente/empleado"
                        class="border rounded-md px-3 py-2 text-sm w-72" />
                    <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        :disabled="!advisorUserId || assigning" @click="assignAdvisor">Asignar</button>
                </div>
                <p v-if="advisorMsg" class="text-xs" :class="advisorError ? 'text-red-600' : 'text-emerald-600'">{{ advisorMsg }}</p>
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
import { ref, reactive, h } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { Residency, ResidencyDocumentChecklistItem, ApprovalStatus, ProjectOption } from '@/modules/residencies/types/residency.type'

const props = defineProps<{ id: string | number }>()
const R = API.RESIDENCIES_API
const router = useRouter()

const loading   = ref(true)
const residency = ref<Residency | null>(null)
const checklist = ref<ResidencyDocumentChecklistItem[]>([])

const advisorUserId = ref<number | null>(null)
const assigning     = ref(false)
const advisorMsg    = ref<string | null>(null)
const advisorError  = ref(false)

const reason = reactive<{ open: boolean; text: string; error: string | null; mode: 'project' | 'doc'; docId: number | null }>({
    open: false, text: '', error: null, mode: 'project', docId: null,
})

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

async function approveProject() {
    await api.post(R.residency.approveProject(props.id), {})
    await load()
}
async function assignAdvisor() {
    if (!advisorUserId.value) return
    assigning.value = true; advisorMsg.value = null
    try {
        await api.post(R.residency.assignAdvisor(props.id), { advisor_user_id: advisorUserId.value })
        advisorError.value = false
        advisorMsg.value = 'Asesor asignado.'
        await load()
    } catch (e: any) {
        advisorError.value = true
        advisorMsg.value = e?.response?.data?.message ?? 'No se pudo asignar.'
    } finally { assigning.value = false }
}
async function approveDoc(id: number) {
    await api.post(R.documents.approve(id), {})
    await load()
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
</script>
