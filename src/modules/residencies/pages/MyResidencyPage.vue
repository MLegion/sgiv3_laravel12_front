<template>
    <div class="space-y-5">
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
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avance</p>
                    <p class="text-sm font-bold text-blue-600">{{ completedCount }} / {{ sections.length }} etapas</p>
                    <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full bg-blue-500 transition-all" :style="{ width: `${(completedCount / sections.length) * 100}%` }"></div>
                    </div>
                </div>
            </div>

            <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

            <!-- Pendiente de activación: portal bloqueado hasta que el coordinador active -->
            <div v-if="isPending" class="rounded-xl border bg-amber-50 border-amber-200 p-6 flex items-start gap-4">
                <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                    </svg>
                </div>
                <div>
                    <h2 class="text-base font-bold text-amber-800 uppercase">Residencia pendiente de activación</h2>
                    <p class="text-sm text-amber-700 mt-1 max-w-xl">
                        Tu residencia ya está registrada, pero el coordinador de residencias aún no ha activado tu proceso.
                        En cuanto la active podrás capturar tu información y subir tus documentos; recibirás un aviso con el instructivo.
                    </p>
                </div>
            </div>

            <div v-show="!isPending" class="res-layout">
                <!-- Menú de etapas -->
                <nav class="res-nav rounded-xl border bg-white divide-y overflow-hidden">
                    <button v-for="s in sections" :key="s.key" type="button"
                        class="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed"
                        :class="active === s.key ? 'bg-blue-50/80 border-l-[3px] border-blue-500' : 'border-l-[3px] border-transparent hover:bg-slate-50'"
                        :disabled="stepStatus[s.key] === 'locked'"
                        @click="active = s.key">
                        <span class="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0"
                              :class="numberClass(s.key)">{{ s.n }}</span>
                        <span class="flex-1 min-w-0">
                            <span class="block text-sm font-medium truncate" :class="stepStatus[s.key] === 'locked' ? 'text-slate-400' : 'text-slate-700'">{{ s.title }}</span>
                            <span class="block text-[10px] font-bold uppercase" :class="chipMeta(stepStatus[s.key]).text">{{ chipMeta(stepStatus[s.key]).label }}</span>
                        </span>
                    </button>
                </nav>

                <!-- Panel de la etapa activa -->
                <section class="res-content rounded-xl border bg-white p-5">
                    <!-- 1. Datos personales -->
                    <div v-if="active === 'personal'" class="space-y-4">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Datos personales</h2>
                        <StudentContactPhotoPanel>
                            <template #extra>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">NSS (IMSS)</label>
                                <input v-model="form.nss" placeholder="Número de seguridad social"
                                       class="border rounded-md px-3 py-2 text-sm w-full sm:w-64" @change="saveProcess" />
                                <p class="text-[11px] text-slate-400 mt-1">Tu número de seguridad social para el trámite de residencia.</p>
                            </template>
                        </StudentContactPhotoPanel>
                    </div>

                    <!-- 2. Empresa -->
                    <div v-else-if="active === 'company'" class="space-y-4">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Empresa</h2>

                        <!-- Empresa seleccionada -->
                        <div class="rounded-lg border bg-slate-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                            <div class="min-w-0">
                                <p v-if="selectedCompany" class="text-sm font-semibold text-slate-700">{{ selectedCompany.name }}</p>
                                <p v-else class="text-sm text-slate-400 italic">Ninguna empresa seleccionada</p>
                                <p v-if="selectedCompany" class="text-[11px] text-slate-400">
                                    <span v-if="selectedCompany.rfc">RFC {{ selectedCompany.rfc }} · </span>{{ selectedCompany.address ?? '' }}
                                </p>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <button type="button" class="text-xs px-3 py-2 border rounded-md hover:bg-white inline-flex items-center gap-1" @click="companyPickerOpen = true">
                                    <MagnifyingGlassIcon class="w-4 h-4" /> Buscar empresa
                                </button>
                                <button type="button" class="text-xs px-3 py-2 border rounded-md hover:bg-white" @click="showNewCompany = !showNewCompany">
                                    {{ showNewCompany ? 'Cancelar' : '+ Proponer' }}
                                </button>
                                <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        :disabled="saving" @click="saveProcess">Guardar</button>
                            </div>
                        </div>
                        <div v-if="showNewCompany" class="rounded-lg border bg-slate-50 p-4 grid sm:grid-cols-2 gap-3">
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
                                    :disabled="!newCompany.name || savingCompany" @click="proposeCompany">Enviar para validación</button>
                                <span class="text-[11px] text-slate-400">Pendiente hasta que el coordinador la apruebe.</span>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Asesor externo -->
                    <div v-else-if="active === 'advisor'" class="space-y-4">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Asesor externo</h2>
                        <div class="flex flex-wrap items-center gap-2">
                            <select v-model.number="form.company_advisor_id" class="border rounded-md px-3 py-2 text-sm w-full sm:w-80">
                                <option :value="null">— Selecciona asesor aprobado —</option>
                                <option v-for="a in advisors" :key="a.id" :value="a.id">{{ a.name }}<span v-if="a.position"> · {{ a.position }}</span></option>
                            </select>
                            <button type="button" class="text-xs px-3 py-2 border rounded-md hover:bg-slate-50" @click="showNewAdvisor = !showNewAdvisor">
                                {{ showNewAdvisor ? 'Cancelar' : '+ Proponer asesor' }}
                            </button>
                            <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    :disabled="saving" @click="saveProcess">Guardar</button>
                        </div>
                        <div v-if="showNewAdvisor" class="rounded-lg border bg-slate-50 p-4 grid sm:grid-cols-2 gap-3">
                            <input v-model="newAdvisor.name" placeholder="Nombre del asesor *" class="border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                            <input v-model="newAdvisor.position" placeholder="Cargo / puesto" class="border rounded-md px-3 py-2 text-sm" />
                            <input v-model="newAdvisor.phone" placeholder="Teléfono" class="border rounded-md px-3 py-2 text-sm" />
                            <input v-model="newAdvisor.email" placeholder="Correo" class="border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                            <div class="sm:col-span-2">
                                <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    :disabled="!newAdvisor.name || savingAdvisor" @click="proposeAdvisor">Enviar para validación</button>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Proyecto -->
                    <div v-else-if="active === 'project'" class="space-y-3">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Proyecto</h2>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Modalidad</label>
                            <select v-model="form.project_option" class="border rounded-md px-3 py-2 text-sm w-full sm:w-72">
                                <option :value="null">— Selecciona —</option>
                                <option value="worker">Trabajador (en mi empresa)</option>
                                <option value="own">Propuesta propia</option>
                                <option value="bank">Del banco de proyectos</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Proyecto</label>
                            <select v-if="form.project_option === 'bank'" v-model.number="form.project_id" class="border rounded-md px-3 py-2 text-sm w-full">
                                <option :value="null">— Selecciona proyecto del banco —</option>
                                <option v-for="p in availableProjects" :key="p.id" :value="p.id" :disabled="p.available <= 0">
                                    {{ p.title }} ({{ p.company }}) · {{ p.available }} de {{ p.slots }} lugares
                                </option>
                            </select>
                            <input v-else v-model="form.project_title" placeholder="Título del proyecto" class="border rounded-md px-3 py-2 text-sm w-full" />
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" class="text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    :disabled="saving" @click="saveProcess">Guardar proyecto</button>
                            <span class="text-[11px] text-slate-400">Lo avala el jefe de carrera.</span>
                        </div>
                    </div>

                    <!-- 5. Asesor interno (comisión) -->
                    <div v-else-if="active === 'commission'" class="space-y-3">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Asesor interno (comisión revisora)</h2>
                        <ul v-if="residency.advisors?.length" class="space-y-1.5">
                            <li v-for="a in residency.advisors" :key="a.id" class="flex items-center gap-2 text-sm">
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{{ a.advisorTypeLabel ?? advisorTypeLabel(a.advisorType) }}</span>
                                <span class="text-slate-700">{{ a.advisorName ?? '—' }}</span>
                            </li>
                        </ul>
                        <p v-else class="text-sm text-slate-400 italic">Aún no asignada. La designa el jefe de carrera.</p>
                    </div>

                    <!-- 6. Oficio de asignación -->
                    <div v-else-if="active === 'letter'" class="space-y-3">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Oficio de asignación</h2>
                        <div class="flex items-center gap-3">
                            <button type="button"
                                    class="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
                                    :disabled="generatingLetter" @click="downloadAssignmentLetter">
                                {{ generatingLetter ? 'Generando…' : 'DESCARGAR OFICIO' }}
                            </button>
                            <span class="text-[11px] text-slate-400">Documento oficial para presentarte en la empresa.</span>
                        </div>
                    </div>

                    <!-- 7. Documentación -->
                    <div v-else-if="active === 'docs'" class="space-y-3">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Documentación</h2>
                        <p v-if="docMsg" class="text-xs" :class="docError ? 'text-red-600' : 'text-emerald-600'">{{ docMsg }}</p>
                        <p v-if="docsLoading" class="text-xs text-slate-400">Cargando documentos…</p>
                        <ul v-else class="space-y-2">
                            <li v-for="item in checklist" :key="item.typeId"
                                class="flex items-center justify-between rounded-lg border px-4 py-3"
                                :class="item.document ? 'bg-slate-50' : 'bg-white'">
                                <div class="space-y-0.5 min-w-0">
                                    <p class="text-sm font-medium text-slate-700">{{ item.name }}</p>
                                    <p v-if="item.document" class="text-xs text-slate-400">{{ item.document.originalName }} · {{ formatSize(item.document.sizeKb) }}</p>
                                    <p v-else class="text-xs text-slate-400 italic">Sin subir</p>
                                    <p v-if="item.document?.status === 'rejected' && item.document.rejectionReason" class="text-xs text-red-600">Rechazado: {{ item.document.rejectionReason }}</p>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <span v-if="item.document" class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(item.document.status)">
                                        {{ approvalLabel(item.document.status) }}
                                    </span>
                                    <a v-if="item.document" :href="downloadUrl(item.document.id)" target="_blank" class="text-xs px-2 py-1.5 border rounded-md hover:bg-slate-100">Ver</a>
                                    <label v-if="!item.document || item.document.status !== 'approved'" class="text-xs px-2 py-1.5 border rounded-md cursor-pointer hover:bg-slate-100">
                                        {{ item.document ? 'Reemplazar' : 'Subir' }}
                                        <input type="file" class="hidden"
                                               :accept="item.acceptsFormats ? item.acceptsFormats.map(f => `.${f}`).join(',') : ''"
                                               @change="(e) => uploadDoc(e, item.typeId)" />
                                    </label>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </template>

        <CompanyPickerModal v-model="companyPickerOpen" :companies="companies" :selected-id="form.company_id" @select="onCompanyPicked" />
        <FormatUnavailableModal v-model="formatUnavailableOpen" :code="formatUnavailableInfo.code" :reason="formatUnavailableInfo.reason" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import StudentContactPhotoPanel from '@/modules/advising/components/StudentContactPhotoPanel.vue'
import CompanyPickerModal from '@/modules/residencies/components/CompanyPickerModal.vue'
import FormatUnavailableModal from '@/modules/reports/components/FormatUnavailableModal.vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useReportGenerator, ReportFormatUnavailableError } from '@/modules/reports/composables/useReportGenerator'
import { ReportCode } from '@/modules/reports/types/reportCodes'
import type {
    Residency, ResidencyDocumentChecklistItem, Company, CompanyAdvisor,
    ResidencyProject, ApprovalStatus, ProjectOption,
} from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

type SectionKey = 'personal' | 'company' | 'advisor' | 'project' | 'commission' | 'letter' | 'docs'
const sections: { key: SectionKey; n: number; title: string }[] = [
    { key: 'personal',   n: 1, title: 'Datos personales' },
    { key: 'company',    n: 2, title: 'Empresa' },
    { key: 'advisor',    n: 3, title: 'Asesor externo' },
    { key: 'project',    n: 4, title: 'Proyecto' },
    { key: 'commission', n: 5, title: 'Asesor interno' },
    { key: 'letter',     n: 6, title: 'Oficio de asignación' },
    { key: 'docs',       n: 7, title: 'Documentación' },
]
const active = ref<SectionKey>('personal')

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

const companies         = ref<Company[]>([])
const advisors          = ref<CompanyAdvisor[]>([])
const availableProjects = ref<ResidencyProject[]>([])

const companyPickerOpen = ref(false)
const selectedCompany = computed<Company | null>(() => companies.value.find(c => c.id === form.value.company_id) ?? null)

async function onCompanyPicked(companyId: number) {
    form.value.company_id = companyId
    await onCompanyChange()
}

const saving   = ref(false)
const msg      = ref<string | null>(null)
const msgError = ref(false)

const showNewCompany = ref(false)
const showNewAdvisor = ref(false)
const savingCompany  = ref(false)
const savingAdvisor  = ref(false)
const newCompany = ref<Record<string, string>>({ name: '', rfc: '', sector: '', address: '', titular_name: '', titular_position: '', phone: '', email: '' })
const newAdvisor = ref<Record<string, string>>({ name: '', position: '', phone: '', email: '' })

const checklist   = ref<ResidencyDocumentChecklistItem[]>([])
const docsLoading = ref(false)
const docMsg      = ref<string | null>(null)
const docError    = ref(false)

const { generatePdf } = useReportGenerator()
const generatingLetter = ref(false)
const formatUnavailableOpen = ref(false)
const formatUnavailableInfo = ref<{ code: string; reason: 'missing' | 'inactive' }>({ code: '', reason: 'missing' })

/* ── Gating / estado por etapa ───────────────────────────────────── */
// Pendiente de activación por el coordinador: el portal queda bloqueado.
const isPending = computed(() => residency.value?.status === 'pending_activation')
const companyDone = computed(() => !!form.value.company_id)
const advisorDone = computed(() => !!form.value.company_advisor_id)
const projectSet  = computed(() => form.value.project_option === 'bank' ? !!form.value.project_id : !!(form.value.project_title && form.value.project_title.trim()))
const projectOk   = computed(() => residency.value?.projectApprovalStatus === 'approved')
const allApproved = computed(() => companyDone.value && advisorDone.value && projectOk.value && !!form.value.nss)

type StepState = 'done' | 'pending' | 'todo' | 'locked'
const stepStatus = computed<Record<SectionKey, StepState>>(() => ({
    personal:   form.value.nss ? 'done' : 'todo',
    company:    companyDone.value ? 'done' : 'todo',
    advisor:    !companyDone.value ? 'locked' : (advisorDone.value ? 'done' : 'todo'),
    project:    !companyDone.value ? 'locked' : (projectOk.value ? 'done' : (projectSet.value ? 'pending' : 'todo')),
    commission: (!companyDone.value || !projectSet.value) ? 'locked' : (residency.value?.advisors?.length ? 'done' : 'pending'),
    letter:     !allApproved.value ? 'locked' : 'done',
    docs:       (!companyDone.value || !projectSet.value) ? 'locked' : 'pending',
}))
const completedCount = computed(() => sections.filter(s => stepStatus.value[s.key] === 'done').length)

function numberClass(key: SectionKey): string {
    const s = stepStatus.value[key]
    return s === 'done' ? 'bg-emerald-600 text-white' : s === 'locked' ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white'
}
function chipMeta(s: StepState): { label: string; text: string } {
    return ({
        done:    { label: 'Completo',      text: 'text-emerald-600' },
        pending: { label: 'En revisión',   text: 'text-amber-600' },
        todo:    { label: 'Por completar', text: 'text-blue-600' },
        locked:  { label: 'Bloqueado',     text: 'text-slate-400' },
    } as Record<StepState, { label: string; text: string }>)[s]
}

// Si la etapa activa se bloquea (p. ej. tras reiniciar empresa), vuelve a Datos.
watch(() => stepStatus.value[active.value], (s) => { if (s === 'locked') active.value = 'personal' })
// Cargar documentos al entrar a esa etapa.
watch(active, (a) => { if (a === 'docs') loadDocs() })

/* ── Carga ───────────────────────────────────────────────────────── */
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
    // Cascada: cambiar empresa reinicia asesor y proyecto (estilo v2).
    form.value.company_advisor_id = null
    form.value.project_id = null
    form.value.project_title = null
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
        setTimeout(() => msg.value = null, 3000)
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

async function downloadAssignmentLetter() {
    if (!residency.value || generatingLetter.value) return
    generatingLetter.value = true; msg.value = null
    try {
        const { blob } = await generatePdf({
            reportCode: ReportCode.ASSIGNMENT_OFFICIAL_LETTER,
            params: { residency_id: residency.value.id },
        })
        window.open(URL.createObjectURL(blob), '_blank')
    } catch (e: any) {
        if (e instanceof ReportFormatUnavailableError) {
            formatUnavailableInfo.value = { code: e.code, reason: e.reason }
            formatUnavailableOpen.value = true
        } else {
            msgError.value = true
            msg.value = e?.message ?? 'No se pudo generar el oficio.'
        }
    } finally { generatingLetter.value = false }
}

/* ── Documentos ──────────────────────────────────────────────────── */
async function loadDocs() {
    if (checklist.value.length || docsLoading.value) return
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
        checklist.value = []
        await loadDocs()
        docError.value = false
        docMsg.value = 'Documento subido.'
    } catch (e: any) {
        docError.value = true
        docMsg.value = e?.response?.data?.message ?? 'Error al subir.'
    }
}

function downloadUrl(id: number) { return R.documents.downloadMine(id) }

function advisorTypeLabel(t: string): string {
    return ({ principal: 'PRINCIPAL', vocal_1: 'VOCAL 1', vocal_2: 'VOCAL 2', vocal_suplente: 'SUPLENTE' } as Record<string, string>)[t] ?? t.toUpperCase()
}
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

<style scoped>
/* Menú a la izquierda en escritorio, arriba en móvil (CSS plano, sin depender del JIT). */
.res-layout {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    align-items: flex-start;
}
.res-nav { width: 100%; }
.res-content { width: 100%; min-width: 0; }

@media (min-width: 768px) {
    .res-layout { flex-direction: row; }
    .res-nav {
        width: 260px;
        flex-shrink: 0;
        position: sticky;
        top: 0.5rem;
    }
    .res-content { flex: 1 1 0%; }
}
</style>
