<template>
    <div class="space-y-4">
        <!-- Error: no es docente -->
        <div v-if="teacherChecked && !isTeacher" class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <svg class="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <p class="text-sm font-bold text-red-700 uppercase">{{ teacherError }}</p>
        </div>

        <!-- Cargando estado de docente -->
        <div v-if="!teacherChecked" class="flex justify-center py-12">
            <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Contenido si es docente -->
        <template v-if="teacherChecked && isTeacher">

        <!-- Info del docente -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span class="text-sm font-bold text-blue-800 uppercase">{{ teacherName }}</span>
            </div>
        </div>

        <!-- Periodo (auto-detectado) -->
        <div v-if="activePeriodName" class="flex items-center gap-2 border-2 border-emerald-200 bg-emerald-50 rounded-xl px-4 py-2.5">
            <svg class="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
            <span class="text-sm font-bold uppercase text-emerald-800">{{ activePeriodName }}</span>
            <span class="text-[10px] text-emerald-600 font-semibold">(Fase de solicitud activa)</span>
        </div>
        <div v-else-if="!loadingActiveConfigs && teacherChecked && isTeacher" class="bg-amber-50 border-2 border-amber-300 rounded-xl px-6 py-8 text-center space-y-2">
            <svg class="w-10 h-10 mx-auto text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <p class="text-sm font-bold text-amber-800 uppercase">No hay solicitud de materias activa</p>
            <p class="text-xs text-amber-600">Actualmente no hay un periodo académico con la fase de solicitud de materias habilitada. Comuníquese con el coordinador de carga académica.</p>
        </div>

        <template v-if="selectedPeriodId">

        <!-- Filtros: Campus + Tipo Modalidad -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">CAMPUS</label>
                <select v-model="selectedCampusId" @change="onCampusOrTypeChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">TIPO MODALIDAD</label>
                <select v-model="selectedModalityTypeId" @change="onCampusOrTypeChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                </select>
            </div>
        </div>

        <!-- Alerta si no hay config o fase no activa -->
        <div v-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
        </div>

        <!-- Modo apertura tardía -->
        <div v-if="resolvedConfigId && unlockedByLateOpening" class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p class="text-xs text-amber-700 font-semibold uppercase">
                Fase de Solicitud de Materias cerrada — operando bajo apertura tardía aprobada.
            </p>
        </div>

        <template v-if="resolvedConfigId && !configError">

        <!-- Tabs: Mis Solicitudes / Materias Disponibles -->
        <div class="flex border-b-2 border-slate-200">
            <button
                class="px-6 py-3 text-sm font-bold uppercase transition border-b-2 -mb-[2px]"
                :class="panel === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="panel = 'requests'">
                Mis Solicitudes ({{ requestItems.length }})
            </button>
            <button
                class="px-6 py-3 text-sm font-bold uppercase transition border-b-2 -mb-[2px]"
                :class="panel === 'available' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="switchToAvailable">
                Agregar Materias
            </button>
        </div>

        <!-- Panel: Mis solicitudes -->
        <div v-if="panel === 'requests'" class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Solicitadas</h2>
                <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">{{ requestItems.length }} materias</span>
                    <ReportGenerateButton
                        :report-code="ReportCode.TEACHER_SUBJECT_REQUEST"
                        :params="{ teacher_id: teacherId, period_id: selectedPeriodId, modality_id: resolvedModalityId }"
                        :disabled="requestItems.length === 0"
                        format="pdf"
                        label="IMPRIMIR SOLICITUD"
                        button-class="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                    />
                </div>
            </div>

            <!-- Header tabla -->
            <div class="hidden lg:grid grid-cols-[1fr_80px_80px_80px_60px_60px] gap-2 px-4 py-2 bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                <span>Materia</span>
                <span class="text-center">Semestre</span>
                <span class="text-center">Grupos Disp.</span>
                <span class="text-center">Grupos Sol.</span>
                <span class="text-center">Demanda</span>
                <span></span>
            </div>

            <div v-if="loadingRequests" class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else class="divide-y max-h-[60vh] overflow-y-auto">
                <div v-for="item in requestItems" :key="item.id"
                    class="px-4 py-3 hover:bg-slate-50 transition">
                    <div class="grid grid-cols-1 lg:grid-cols-[1fr_80px_80px_80px_60px_60px] gap-2 items-center">
                        <!-- Materia -->
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-slate-800 uppercase">{{ item.subjectPackage?.subject?.name ?? '—' }}</span>
                                <span v-if="item.subjectPackage?.isRepeat" class="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-black">REPETIDA</span>
                            </div>
                            <div class="text-[10px] text-slate-400 font-semibold space-x-2">
                                <span>{{ item.subjectPackage?.subject?.officialCode }}</span>
                                <span v-if="item.subjectPackage?.subject?.credits">| {{ item.subjectPackage.subject.credits }} cr</span>
                                <span v-if="item.subjectPackage?.subject?.ht != null">| HT: {{ item.subjectPackage.subject.ht }}</span>
                                <span v-if="item.subjectPackage?.subject?.hp != null">HP: {{ item.subjectPackage.subject.hp }}</span>
                            </div>
                        </div>
                        <!-- Semestre -->
                        <div class="text-center text-sm font-bold text-slate-600">{{ item.subjectPackage?.targetSemester ?? '—' }}</div>
                        <!-- Grupos disponibles -->
                        <div class="text-center text-sm text-slate-500">{{ item.subjectPackage?.numGroups ?? '—' }}</div>
                        <!-- Grupos solicitados -->
                        <div>
                            <input type="number" :value="item.numGroups"
                                min="1" :max="item.subjectPackage?.numGroups ?? 20"
                                class="w-full border rounded-lg px-2 py-1 text-sm text-center"
                                @change="updateRequest(item.id, Number(($event.target as HTMLInputElement).value))"
                            />
                        </div>
                        <!-- Demanda -->
                        <div class="text-center text-xs text-orange-500 font-bold">{{ item.subjectPackage?.demand ?? 0 }}</div>
                        <!-- Quitar -->
                        <div class="flex justify-center">
                            <button class="text-red-400 hover:text-red-600 transition" @click="removeRequest(item.id)" title="Quitar solicitud">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="requestItems.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                    No has solicitado materias aún. Usa "Agregar Materias" para comenzar.
                </div>
            </div>
        </div>

        <!-- Panel: Materias disponibles -->
        <div v-if="panel === 'available'" class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Disponibles</h2>
                <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">{{ availableItems.length }} disponibles</span>
                    <!-- Búsqueda -->
                    <div class="relative">
                        <input type="text" v-model="searchQuery" placeholder="Buscar..."
                            class="border rounded-lg pl-8 pr-3 py-1.5 text-xs w-48 focus:border-blue-500 outline-none" />
                        <svg class="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>
            </div>

            <div v-if="loadingAvailable" class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else class="divide-y max-h-[60vh] overflow-y-auto">
                <template v-for="(subjects, semester) in groupedAvailable" :key="semester">
                    <div class="bg-slate-100 px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        Semestre {{ semester }}
                    </div>
                    <div v-for="item in subjects" :key="item.id"
                        class="px-4 py-3 hover:bg-blue-50 transition cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                        @click="addRequest(item)">
                        <div class="flex items-center gap-3">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-bold text-slate-800 uppercase">{{ item.subjectName }}</span>
                                    <span v-if="item.isRepeat" class="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-black">REPETIDA</span>
                                    <span v-if="item.specialtyName" class="text-[8px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-600 font-black">{{ item.specialtyName }}</span>
                                    <span v-if="item.optionalGroupName" class="text-[8px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-black">{{ item.optionalGroupName }}</span>
                                </div>
                                <div class="text-[10px] text-slate-400 font-semibold space-x-2">
                                    <span>{{ item.subjectCode }}</span>
                                    <span v-if="item.credits">| {{ item.credits }} cr</span>
                                    <span v-if="item.ht != null">| HT: {{ item.ht }}</span>
                                    <span v-if="item.hp != null">HP: {{ item.hp }}</span>
                                    <span class="text-orange-500 font-bold">| Demanda: {{ item.demand }}</span>
                                    <span>| Grupos: {{ item.numGroups }}</span>
                                </div>
                            </div>
                            <button class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 uppercase flex-shrink-0"
                                :disabled="addingId === item.id"
                                @click.stop="addRequest(item)">
                                {{ addingId === item.id ? '...' : 'Solicitar' }}
                            </button>
                        </div>
                    </div>
                </template>

                <div v-if="filteredAvailable.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                    {{ availableItems.length === 0 ? 'No hay materias disponibles para solicitar' : 'Sin resultados para la búsqueda' }}
                </div>
            </div>
        </div>

        </template><!-- fin resolvedConfigId -->
        </template><!-- fin periodLocked -->
        </template><!-- fin isTeacher -->
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ReportGenerateButton from '@/modules/reports/components/ReportGenerateButton.vue'
import { ReportCode } from '@/modules/reports/types/reportCodes'

/* ── State: Teacher ──────────────────────────────────────────────── */
const teacherChecked = ref(false)
const isTeacher      = ref(false)
const teacherId      = ref<number | null>(null)
const teacherName    = ref('')
const teacherError   = ref('')

/* ── State: Filtros ──────────────────────────────────────────────── */
const selectedPeriodId       = ref<number | null>(null)
const activePeriodName       = ref<string>('')
const loadingActiveConfigs   = ref(false)
const activeRequestConfigs   = ref<any[]>([])

const selectedCampusId       = ref<number | null>(null)
const selectedModalityTypeId = ref<number | null>(null)

const campuses      = ref<any[]>([])
const modalityTypes = ref<any[]>([])
const modalities    = ref<any[]>([])

const resolvedModalityId = ref<number | null>(null)
const resolvedConfigId   = ref<number | null>(null)
const configError        = ref<string | null>(null)
const unlockedByLateOpening = ref(false)

/* ── State: Datos ────────────────────────────────────────────────── */
const panel           = ref<'requests' | 'available'>('requests')
const requestItems    = ref<any[]>([])
const availableItems  = ref<any[]>([])
const loadingRequests = ref(false)
const loadingAvailable = ref(false)
const searchQuery     = ref('')
const addingId        = ref<number | null>(null)

/* ── Auto-detección del periodo activo para solicitudes ──────────── */
async function fetchActiveRequestConfigs() {
    loadingActiveConfigs.value = true
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: { per_page: 50, search: { phase_request: 1 } },
        })
        const items = data?.items ?? data?.data ?? []
        activeRequestConfigs.value = items

        if (items.length > 0) {
            const first = items[0]
            const cap = first.collegeAcademicPeriod ?? first.college_academic_period
            selectedPeriodId.value = cap?.id ?? first.collegeAcademicPeriodId ?? first.college_academic_period_id
            activePeriodName.value = cap?.academicPeriod?.name ?? cap?.academic_period?.name ?? cap?.name ?? 'Periodo activo'
        }
    } catch { /* silent */ }
    finally { loadingActiveConfigs.value = false }
}

/* ── Computed ────────────────────────────────────────────────────── */
const filteredAvailable = computed(() => {
    if (!searchQuery.value) return availableItems.value
    const q = searchQuery.value.toLowerCase()
    return availableItems.value.filter((item: any) =>
        (item.subjectName ?? '').toLowerCase().includes(q) ||
        (item.subjectCode ?? '').toLowerCase().includes(q)
    )
})

const groupedAvailable = computed(() => {
    const groups: Record<number, any[]> = {}
    for (const item of filteredAvailable.value) {
        const sem = item.targetSemester ?? 0
        if (!groups[sem]) groups[sem] = []
        groups[sem].push(item)
    }
    return groups
})

/* ── Fetch ───────────────────────────────────────────────────────── */
async function checkTeacher() {
    try {
        const { data } = await api.get(API.SCA_API.teacherRequests.me)
        isTeacher.value = data.isTeacher
        teacherId.value = data.teacherId ?? null
        teacherName.value = data.employeeName ?? ''
        teacherError.value = data.message ?? 'No estás registrado como docente en el sistema.'
    } catch {
        isTeacher.value = false
        teacherError.value = 'Error al verificar tu registro de docente.'
    } finally {
        teacherChecked.value = true
    }
}

async function fetchCampuses() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } })
        campuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName ?? `Campus #${c.id}` }))
    } catch { campuses.value = [] }
}

async function fetchModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        modalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name ?? `Tipo #${mt.id}` }))
    } catch { modalityTypes.value = [] }
}

async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } })
        modalities.value = data?.items ?? data?.data ?? data ?? []
    } catch { modalities.value = [] }
}

function resolveModality() {
    resolvedModalityId.value = null
    configError.value = null
    resolvedConfigId.value = null
    requestItems.value = []
    availableItems.value = []

    if (!selectedCampusId.value || !selectedModalityTypeId.value) return

    const match = modalities.value.find((m: any) =>
        (m.campusId === selectedCampusId.value || m.campus_id === selectedCampusId.value) &&
        (m.modalityTypeId === selectedModalityTypeId.value || m.modality_type_id === selectedModalityTypeId.value)
    )

    if (match) {
        resolvedModalityId.value = match.id
        resolveConfig()
    }
}

async function resolveConfig() {
    resolvedConfigId.value = null
    configError.value = null

    if (!selectedPeriodId.value || !resolvedModalityId.value) return

    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: {
                per_page: 1,
                search: {
                    college_academic_period_id: selectedPeriodId.value,
                    modality_id: resolvedModalityId.value,
                },
            },
        })
        const items = data?.items ?? data?.data ?? []
        if (items.length === 0) {
            configError.value = 'No existe una configuración de carga académica para este periodo y modalidad.'
            return
        }
        const config = items[0]
        const requestPhase = !!(config.phaseRequest ?? config.phase_request)
        if (!requestPhase) {
            const hasLateOpening = await hasActiveLateOpeningForConfig(config.id)
            if (!hasLateOpening) {
                configError.value = 'La fase de Solicitud de Materias no está habilitada y no cuenta con una apertura tardía aprobada.'
                return
            }
            unlockedByLateOpening.value = true
        } else {
            unlockedByLateOpening.value = false
        }
        resolvedConfigId.value = config.id
        fetchRequests()
    } catch {
        configError.value = 'Error al buscar la configuración de carga académica.'
    }
}

async function hasActiveLateOpeningForConfig(configId: number): Promise<boolean> {
    try {
        const { data } = await api.get(API.SCA_API.lateOpening.list, { params: { status: 'approved' } })
        const rows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
        return rows.some((r: any) =>
            (r.configId ?? r.config_id) === configId
            && r.status === 'approved'
            && (r.isActive ?? r.is_active)
        )
    } catch { return false }
}

async function fetchRequests() {
    if (!resolvedConfigId.value) return
    loadingRequests.value = true
    try {
        const { data } = await api.get(API.SCA_API.teacherRequests.list(resolvedConfigId.value))
        requestItems.value = data ?? []
    } catch { requestItems.value = [] }
    finally { loadingRequests.value = false }
}

async function fetchAvailable() {
    if (!resolvedConfigId.value) return
    loadingAvailable.value = true
    try {
        const { data } = await api.get(API.SCA_API.teacherRequests.available(resolvedConfigId.value))
        availableItems.value = data ?? []
    } catch { availableItems.value = [] }
    finally { loadingAvailable.value = false }
}

/* ── Actions ─────────────────────────────────────────────────────── */
async function addRequest(item: any) {
    addingId.value = item.id
    try {
        await api.post(API.SCA_API.teacherRequests.create, {
            subject_package_id: item.id,
            num_groups: 1,
        })
        await Promise.all([fetchRequests(), fetchAvailable()])
        panel.value = 'requests'
    } catch (e: any) {
        console.error('Error:', e?.response?.data?.message ?? e)
    } finally {
        addingId.value = null
    }
}

async function updateRequest(id: number, numGroups: number) {
    try {
        await api.put(API.SCA_API.teacherRequests.update(id), { num_groups: numGroups })
        await fetchRequests()
    } catch (e: any) {
        console.error('Error:', e?.response?.data?.message ?? e)
    }
}

async function removeRequest(id: number) {
    try {
        await api.delete(API.SCA_API.teacherRequests.delete(id))
        await Promise.all([fetchRequests(), fetchAvailable()])
    } catch (e: any) {
        console.error('Error:', e?.response?.data?.message ?? e)
    }
}

function switchToAvailable() {
    panel.value = 'available'
    if (availableItems.value.length === 0) {
        fetchAvailable()
    }
}

/* ── Filter events ───────────────────────────────────────────────── */

function onCampusOrTypeChange() {
    requestItems.value = []
    availableItems.value = []
    panel.value = 'requests'
    resolveModality()
}

/* ── Init ────────────────────────────────────────────────────────── */
onMounted(async () => {
    await checkTeacher()
    if (isTeacher.value) {
        await fetchActiveRequestConfigs()
    }
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
})
</script>
