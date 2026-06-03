<template>
    <div class="space-y-6 max-w-4xl">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Residencia</h1>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>

        <div v-else-if="!residency" class="rounded-lg border bg-amber-50 border-amber-200 px-4 py-6 text-sm text-amber-800">
            No tienes una residencia activa. Se da de alta al cargar la materia de residencia en tu reinscripción.
        </div>

        <template v-else>
            <!-- Encabezado de estado -->
            <div class="rounded-xl border bg-white p-5 grid sm:grid-cols-3 gap-4">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Residente</p>
                    <p class="text-sm font-bold text-slate-700">{{ residency.studentName ?? '—' }}</p>
                    <p class="text-xs font-mono text-slate-400">{{ residency.numControl }}</p>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carrera</p>
                    <p class="text-sm text-slate-700">{{ residency.career ?? '—' }}</p>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aval del proyecto</p>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(residency.projectApprovalStatus)">
                        {{ approvalLabel(residency.projectApprovalStatus) }}
                    </span>
                    <p v-if="residency.advisors?.length" class="text-[11px] text-emerald-600 mt-1">{{ residency.advisors.length }} asesor(es) interno(s) asignado(s)</p>
                </div>
            </div>

            <Tabs v-model="tab" :tabs="tabs" />

            <!-- ── Proceso ── -->
            <div v-if="tab === 'proceso'" class="rounded-xl border bg-white p-5 space-y-5">
                <p v-if="msg" class="text-xs" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>

                <!-- Modalidad de proyecto -->
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Modalidad del proyecto</label>
                    <select v-model="form.project_option" class="border rounded-md px-3 py-2 text-sm w-full sm:w-72">
                        <option :value="null">— Selecciona —</option>
                        <option value="worker">Trabajador (en mi empresa)</option>
                        <option value="own">Propuesta propia</option>
                        <option value="bank">Del banco de proyectos</option>
                    </select>
                </div>

                <!-- Empresa -->
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Empresa</label>
                    <div class="flex flex-wrap items-center gap-2">
                        <select v-model.number="form.company_id" class="border rounded-md px-3 py-2 text-sm w-full sm:w-72" @change="onCompanyChange">
                            <option :value="null">— Selecciona empresa aprobada —</option>
                            <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                        <button type="button" class="text-xs px-3 py-2 border rounded-md hover:bg-slate-50" @click="showNewCompany = !showNewCompany">
                            {{ showNewCompany ? 'Cancelar' : '+ Proponer empresa' }}
                        </button>
                    </div>

                    <!-- Proponer empresa -->
                    <div v-if="showNewCompany" class="mt-3 rounded-lg border bg-slate-50 p-4 grid sm:grid-cols-2 gap-3">
                        <input v-model="newCompany.name" placeholder="Razón social *" class="border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                        <input v-model="newCompany.rfc" placeholder="RFC" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newCompany.sector" placeholder="Giro / sector" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newCompany.address" placeholder="Domicilio" class="border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                        <input v-model="newCompany.titular_name" placeholder="Titular / responsable" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newCompany.titular_position" placeholder="Cargo del titular" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newCompany.phone" placeholder="Teléfono" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newCompany.email" placeholder="Correo" class="border rounded-md px-3 py-2 text-sm" />
                        <div class="sm:col-span-2 flex items-center gap-2">
                            <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                :disabled="!newCompany.name || savingCompany" @click="proposeCompany">
                                Enviar para validación
                            </button>
                            <span class="text-[11px] text-slate-400">Quedará pendiente hasta que el coordinador la apruebe.</span>
                        </div>
                    </div>
                </div>

                <!-- Asesor externo -->
                <div v-if="form.company_id">
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Asesor externo</label>
                    <div class="flex flex-wrap items-center gap-2">
                        <select v-model.number="form.company_advisor_id" class="border rounded-md px-3 py-2 text-sm w-full sm:w-72">
                            <option :value="null">— Selecciona asesor aprobado —</option>
                            <option v-for="a in advisors" :key="a.id" :value="a.id">{{ a.name }}<span v-if="a.position"> · {{ a.position }}</span></option>
                        </select>
                        <button type="button" class="text-xs px-3 py-2 border rounded-md hover:bg-slate-50" @click="showNewAdvisor = !showNewAdvisor">
                            {{ showNewAdvisor ? 'Cancelar' : '+ Proponer asesor' }}
                        </button>
                    </div>
                    <div v-if="showNewAdvisor" class="mt-3 rounded-lg border bg-slate-50 p-4 grid sm:grid-cols-2 gap-3">
                        <input v-model="newAdvisor.name" placeholder="Nombre del asesor *" class="border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                        <input v-model="newAdvisor.position" placeholder="Cargo / puesto" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newAdvisor.phone" placeholder="Teléfono" class="border rounded-md px-3 py-2 text-sm" />
                        <input v-model="newAdvisor.email" placeholder="Correo" class="border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                        <div class="sm:col-span-2">
                            <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                :disabled="!newAdvisor.name || savingAdvisor" @click="proposeAdvisor">
                                Enviar para validación
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Proyecto -->
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Proyecto</label>
                    <select v-if="form.project_option === 'bank'" v-model.number="form.project_id" class="border rounded-md px-3 py-2 text-sm w-full sm:w-full">
                        <option :value="null">— Selecciona proyecto del banco —</option>
                        <option v-for="p in availableProjects" :key="p.id" :value="p.id" :disabled="p.available <= 0">
                            {{ p.title }} ({{ p.company }}) · {{ p.available }} de {{ p.slots }} lugares
                        </option>
                    </select>
                    <input v-else v-model="form.project_title" placeholder="Título del proyecto" class="border rounded-md px-3 py-2 text-sm w-full" />
                </div>

                <!-- NSS -->
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">NSS (IMSS)</label>
                    <input v-model="form.nss" placeholder="Número de seguridad social" class="border rounded-md px-3 py-2 text-sm w-full sm:w-72" />
                </div>

                <div class="pt-2">
                    <button type="button" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        :disabled="saving" @click="saveProcess">
                        {{ saving ? 'Guardando…' : 'Guardar proceso' }}
                    </button>
                </div>
            </div>

            <!-- ── Documentos ── -->
            <div v-else class="rounded-xl border bg-white p-5 space-y-3">
                <p v-if="docMsg" class="text-xs" :class="docError ? 'text-red-600' : 'text-emerald-600'">{{ docMsg }}</p>
                <p v-if="docsLoading" class="text-xs text-slate-400">Cargando documentos…</p>

                <ul v-else class="space-y-2">
                    <li v-for="item in checklist" :key="item.typeId"
                        class="flex items-center justify-between rounded-lg border px-4 py-3"
                        :class="item.document ? 'bg-slate-50' : 'bg-white'">
                        <div class="space-y-0.5">
                            <p class="text-sm font-medium text-slate-700">{{ item.name }}</p>
                            <p v-if="item.document" class="text-xs text-slate-400">
                                {{ item.document.originalName }} · {{ formatSize(item.document.sizeKb) }}
                            </p>
                            <p v-else class="text-xs text-slate-400 italic">Sin subir</p>
                            <p v-if="item.document?.status === 'rejected' && item.document.rejectionReason"
                               class="text-xs text-red-600">Rechazado: {{ item.document.rejectionReason }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span v-if="item.document" class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(item.document.status)">
                                {{ approvalLabel(item.document.status) }}
                            </span>
                            <a v-if="item.document" :href="downloadUrl(item.document.id)" target="_blank"
                               class="text-xs px-2 py-1.5 border rounded-md hover:bg-slate-100">Ver</a>
                            <label v-if="!item.document || item.document.status !== 'approved'"
                                   class="text-xs px-2 py-1.5 border rounded-md cursor-pointer hover:bg-slate-100">
                                {{ item.document ? 'Reemplazar' : 'Subir' }}
                                <input type="file" class="hidden"
                                       :accept="item.acceptsFormats ? item.acceptsFormats.map(f => `.${f}`).join(',') : ''"
                                       @change="(e) => uploadDoc(e, item.typeId)" />
                            </label>
                        </div>
                    </li>
                </ul>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import Tabs from '@/app/components/ui/Tabs.vue'
import type {
    Residency, ResidencyDocumentChecklistItem, Company, CompanyAdvisor,
    ResidencyProject, ApprovalStatus, ProjectOption,
} from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const tab  = ref('proceso')
const tabs = [
    { key: 'proceso',     label: 'Proceso' },
    { key: 'documentos',  label: 'Documentos' },
]

const loading   = ref(true)
const residency = ref<Residency | null>(null)

const form = ref<{
    project_option: ProjectOption | null
    company_id: number | null
    company_advisor_id: number | null
    project_id: number | null
    project_title: string | null
    nss: string | null
}>({ project_option: null, company_id: null, company_advisor_id: null, project_id: null, project_title: null, nss: null })

const companies        = ref<Company[]>([])
const advisors         = ref<CompanyAdvisor[]>([])
const availableProjects = ref<ResidencyProject[]>([])

const saving   = ref(false)
const msg      = ref<string | null>(null)
const msgError = ref(false)

// Proponer empresa / asesor
const showNewCompany = ref(false)
const showNewAdvisor = ref(false)
const savingCompany  = ref(false)
const savingAdvisor  = ref(false)
const newCompany = ref<Record<string, string>>({ name: '', rfc: '', sector: '', address: '', titular_name: '', titular_position: '', phone: '', email: '' })
const newAdvisor = ref<Record<string, string>>({ name: '', position: '', phone: '', email: '' })

// Documentos
const checklist  = ref<ResidencyDocumentChecklistItem[]>([])
const docsLoading = ref(false)
const docMsg     = ref<string | null>(null)
const docError   = ref(false)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(R.residency.me)
        residency.value = data
        if (data) {
            form.value = {
                project_option:     data.projectOption ?? null,
                company_id:         data.companyId ?? null,
                company_advisor_id: data.companyAdvisorId ?? null,
                project_id:         data.projectId ?? null,
                project_title:      data.projectTitle ?? null,
                nss:                data.nss ?? null,
            }
            await Promise.all([loadCompanies(), loadAvailableProjects()])
            if (form.value.company_id) await loadAdvisors(form.value.company_id)
        }
    } finally { loading.value = false }
}

async function loadCompanies() {
    const { data } = await api.get(R.companies.options)
    companies.value = data ?? []
}
async function loadAdvisors(companyId: number) {
    const { data } = await api.get(R.companies.advisors(companyId), { params: { status: 'approved' } })
    advisors.value = data ?? []
}
async function loadAvailableProjects() {
    const { data } = await api.get(R.projects.available)
    availableProjects.value = data ?? []
}

async function onCompanyChange() {
    form.value.company_advisor_id = null
    advisors.value = []
    if (form.value.company_id) await loadAdvisors(form.value.company_id)
}

async function saveProcess() {
    saving.value = true; msg.value = null
    try {
        const { data } = await api.put(R.residency.me, form.value)
        residency.value = data
        msgError.value = false
        msg.value = 'Proceso guardado.'
    } catch (e: any) {
        msgError.value = true
        msg.value = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally { saving.value = false }
}

async function proposeCompany() {
    savingCompany.value = true; msg.value = null
    try {
        await api.post(R.companies.create, newCompany.value)
        showNewCompany.value = false
        newCompany.value = { name: '', rfc: '', sector: '', address: '', titular_name: '', titular_position: '', phone: '', email: '' }
        msgError.value = false
        msg.value = 'Empresa enviada para validación del coordinador.'
    } catch (e: any) {
        msgError.value = true
        msg.value = e?.response?.data?.message ?? 'No se pudo enviar la empresa.'
    } finally { savingCompany.value = false }
}

async function proposeAdvisor() {
    if (!form.value.company_id) return
    savingAdvisor.value = true; msg.value = null
    try {
        await api.post(R.companies.createAdvisor(form.value.company_id), newAdvisor.value)
        showNewAdvisor.value = false
        newAdvisor.value = { name: '', position: '', phone: '', email: '' }
        msgError.value = false
        msg.value = 'Asesor enviado para validación del coordinador.'
    } catch (e: any) {
        msgError.value = true
        msg.value = e?.response?.data?.message ?? 'No se pudo enviar el asesor.'
    } finally { savingAdvisor.value = false }
}

// ── Documentos ──
async function loadDocs() {
    docsLoading.value = true
    try {
        const { data } = await api.get(R.documents.mine)
        checklist.value = data ?? []
    } finally { docsLoading.value = false }
}

async function uploadDoc(event: Event, typeId: number) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    docMsg.value = null
    try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('residency_document_type_id', String(typeId))
        await api.post(R.documents.uploadMine, fd)
        await loadDocs()
        docError.value = false
        docMsg.value = 'Documento subido.'
    } catch (e: any) {
        docError.value = true
        docMsg.value = e?.response?.data?.message ?? 'Error al subir.'
    }
}

function downloadUrl(id: number) { return R.documents.downloadMine(id) }

watch(tab, (t) => { if (t === 'documentos' && !checklist.value.length) loadDocs() })

function approvalLabel(s: ApprovalStatus | null): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADO', rejected: 'RECHAZADO' } as Record<string, string>)[s ?? ''] ?? 'SIN ENVIAR'
}
function approvalClass(s: ApprovalStatus | null): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s ?? ''] ?? 'bg-slate-100 text-slate-500'
}
function formatSize(kb?: number | null) {
    if (!kb) return ''
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

load()
</script>
