<template>
    <section class="px-4 py-3 space-y-3 max-w-6xl mx-auto">
        <header class="flex items-center gap-3">
            <h1 class="text-lg font-semibold text-slate-800">Cierre de carga del periodo</h1>
            <button
                class="ml-auto text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                @click="load"
                :disabled="loading"
            >Recargar</button>
        </header>

        <div v-if="loading && !data" class="text-sm text-slate-500 italic">Cargando…</div>
        <div v-else-if="!data?.found" class="text-sm text-rose-700">Periodo no encontrado.</div>

        <template v-else-if="data">
            <!-- Resumen del periodo -->
            <div class="bg-white border border-slate-200 rounded-lg p-4">
                <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="text-base font-semibold text-slate-800">
                        {{ data.collegeShortName }} · {{ data.academicPeriodShortName ?? data.academicPeriodName }}
                    </span>
                    <span
                        class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded font-mono"
                        :class="statusBadgeClass(data.status)"
                    >{{ data.status }}</span>
                    <span class="text-xs text-slate-500 ml-auto">
                        {{ data.startDate }} → {{ data.endDate }}
                    </span>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div class="text-center">
                        <div class="text-xs text-slate-500 uppercase">Cobertura</div>
                        <div class="text-2xl font-bold" :class="data.coveragePct === 100 ? 'text-emerald-700' : 'text-amber-600'">
                            {{ data.coveragePct }}%
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-xs text-slate-500 uppercase">Inscripciones</div>
                        <div class="text-2xl font-bold text-slate-800">{{ data.enrolledCount }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xs text-slate-500 uppercase">Calificadas</div>
                        <div class="text-2xl font-bold text-emerald-700">{{ data.gradedCount }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xs text-slate-500 uppercase">Pendientes</div>
                        <div class="text-2xl font-bold" :class="data.missingCount === 0 ? 'text-slate-400' : 'text-rose-600'">
                            {{ data.missingCount }}
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-3 text-center">
                    <div>
                        <div class="text-xs text-slate-500 uppercase">Actas cerradas</div>
                        <div class="text-base font-semibold text-emerald-700">{{ data.closedActasCount }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-500 uppercase">Actas abiertas</div>
                        <div class="text-base font-semibold" :class="data.openActasCount === 0 ? 'text-slate-400' : 'text-amber-600'">
                            {{ data.openActasCount }}
                        </div>
                    </div>
                </div>

                <!-- Cierre formal -->
                <div class="mt-4 border-t border-slate-100 pt-3">
                    <div v-if="data.gradesLoadedAt" class="text-sm text-emerald-700">
                        ✓ Carga cerrada el {{ formatDate(data.gradesLoadedAt) }}
                        <span v-if="data.gradesLoadedByUserName" class="text-slate-500">
                            por {{ data.gradesLoadedByUserName }}
                        </span>
                    </div>
                    <div v-else class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm text-slate-700">Cierre formal:</span>
                        <button
                            class="text-xs px-3 py-1.5 rounded font-semibold transition"
                            :class="data.canClose
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'"
                            :disabled="!data.canClose || markingLoaded"
                            @click="confirmMarkLoaded"
                        >
                            {{ markingLoaded ? 'Cerrando…' : 'Cerrar carga del periodo' }}
                        </button>
                        <span v-if="!data.canClose" class="text-[11px] text-slate-500 italic">
                            Cobertura debe ser 100% y todas las actas cerradas.
                        </span>
                    </div>
                </div>

                <p v-if="closureError" class="mt-2 text-sm text-rose-700">{{ closureError }}</p>
                <p v-if="closureBanner" class="mt-2 text-sm text-emerald-700">{{ closureBanner }}</p>
            </div>

            <!-- Tabla de actas -->
            <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <header class="px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <h2 class="text-sm font-semibold text-slate-700">Actas docentes</h2>
                </header>
                <div v-if="data.actas.length === 0" class="px-3 py-4 text-sm text-slate-500 italic">
                    No hay asignaciones docentes con inscripciones para este periodo.
                </div>
                <div class="overflow-x-auto w-full"><table v-else class="w-full text-xs">
                    <thead class="bg-slate-100 text-slate-600">
                        <tr>
                            <th scope="col" class="text-left px-3 py-2">Grupo</th>
                            <th scope="col" class="text-left px-3 py-2">Materia</th>
                            <th scope="col" class="text-left px-3 py-2">Docente</th>
                            <th scope="col" class="text-right px-3 py-2">Inscritos</th>
                            <th scope="col" class="text-right px-3 py-2">Calificados</th>
                            <th scope="col" class="text-right px-3 py-2">Faltan</th>
                            <th scope="col" class="text-center px-3 py-2">Estado</th>
                            <th scope="col" class="text-right px-3 py-2">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="a in data.actas"
                            :key="a.teacherAssignmentId"
                            :class="a.actaClosedAt ? 'bg-emerald-50/50' : ''"
                        >
                            <td class="px-3 py-2 font-mono">{{ a.groupName }}</td>
                            <td class="px-3 py-2">{{ a.subjectName }}</td>
                            <td class="px-3 py-2 text-slate-600">{{ a.teacherName ?? '—' }}</td>
                            <td class="px-3 py-2 text-right">{{ a.enrolled }}</td>
                            <td class="px-3 py-2 text-right text-emerald-700">{{ a.graded }}</td>
                            <td class="px-3 py-2 text-right" :class="a.missing > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'">
                                {{ a.missing }}
                            </td>
                            <td class="px-3 py-2 text-center">
                                <span
                                    v-if="a.actaClosedAt"
                                    class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
                                >cerrada</span>
                                <span
                                    v-else
                                    class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700"
                                >abierta</span>
                            </td>
                            <td class="px-3 py-2 text-right">
                                <button
                                    v-if="!a.actaClosedAt"
                                    :disabled="busyActaIds.has(a.teacherAssignmentId)"
                                    class="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300"
                                    @click="closeActa(a.teacherAssignmentId)"
                                >
                                    Cerrar
                                </button>
                                <button
                                    v-else
                                    :disabled="busyActaIds.has(a.teacherAssignmentId) || !!data?.gradesLoadedAt"
                                    class="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                                    @click="reopenActa(a.teacherAssignmentId)"
                                >
                                    Reabrir
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>

            <!-- Reclasificación de estudiantes -->
            <div v-if="data.gradesLoadedAt" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <header class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <h2 class="text-sm font-semibold text-slate-700">Reclasificación de estudiantes</h2>
                    <button
                        v-if="!reclassPreview && !loadingReclass"
                        class="ml-auto text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                        @click="loadReclassPreview"
                    >Calcular preview</button>
                    <button
                        v-if="reclassPreview"
                        class="ml-auto text-[11px] px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300"
                        :disabled="applyingReclass"
                        @click="confirmReclassify"
                    >{{ applyingReclass ? 'Aplicando…' : 'Aplicar reclasificación' }}</button>
                </header>

                <div v-if="loadingReclass" class="px-3 py-4 text-sm text-slate-500 italic">Calculando…</div>

                <div v-else-if="reclassPreview" class="px-3 py-3 space-y-3">
                    <div class="text-xs text-slate-600">
                        Evaluadas <strong>{{ reclassPreview.totalAffiliations }}</strong> afiliaciones.
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="(count, rule) in reclassPreview.summaryByRule"
                            :key="rule"
                            class="text-[11px] px-2 py-0.5 rounded"
                            :class="ruleBadgeClass(String(rule))"
                        >
                            {{ ruleLabel(String(rule)) }}: {{ count }}
                        </span>
                    </div>

                    <div class="overflow-x-auto w-full"><table class="w-full text-xs">
                        <thead class="bg-slate-100 text-slate-600">
                            <tr>
                                <th scope="col" class="text-left px-3 py-2">Núm. control</th>
                                <th scope="col" class="text-left px-3 py-2">Alumno</th>
                                <th scope="col" class="text-left px-3 py-2">Status actual</th>
                                <th scope="col" class="text-left px-3 py-2">Status nuevo</th>
                                <th scope="col" class="text-left px-3 py-2">Regla</th>
                                <th scope="col" class="text-right px-3 py-2">Sem.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="it in reclassPreview.items" :key="it.affiliationId">
                                <td class="px-3 py-1.5 font-mono">{{ it.numControl ?? '—' }}</td>
                                <td class="px-3 py-1.5">{{ it.studentName }}</td>
                                <td class="px-3 py-1.5 text-slate-600">{{ it.currentStatusName }}</td>
                                <td class="px-3 py-1.5">
                                    <span v-if="it.newStatusName" :class="statusTextClass(it.newStatusName)">
                                        {{ it.newStatusName }}
                                    </span>
                                    <span v-else class="text-slate-400 italic">sin cambio</span>
                                </td>
                                <td class="px-3 py-1.5">
                                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono"
                                          :class="ruleBadgeClass(it.rule)">
                                        {{ it.rule }}
                                    </span>
                                </td>
                                <td class="px-3 py-1.5 text-right">
                                    <template v-if="it.newPeriodNumber">
                                        {{ it.currentPeriodNumber }} → <strong>{{ it.newPeriodNumber }}</strong>
                                    </template>
                                    <template v-else>{{ it.currentPeriodNumber }}</template>
                                </td>
                            </tr>
                        </tbody>
                    </table></div>
                </div>

                <p v-if="reclassError" class="px-3 py-2 text-sm text-rose-700">{{ reclassError }}</p>
                <p v-if="reclassBanner" class="px-3 py-2 text-sm text-emerald-700">{{ reclassBanner }}</p>
            </div>
        </template>

        <ConfirmModal
            v-model="confirmOpen"
            :title="confirmConfig.title"
            :message="confirmConfig.message"
            :confirm-text="confirmConfig.confirmText"
            :variant="confirmConfig.variant"
            @confirm="runConfirmedAction"
        />
    </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'

interface ActaRow {
    teacherAssignmentId: number
    groupId:             number
    groupName:           string
    subjectId:           number
    subjectName:         string
    teacherName:         string | null
    actaClosedAt:        string | null
    enrolled:            number
    graded:              number
    missing:             number
}

interface PeriodClosureData {
    found:                    true
    collegeAcademicPeriodId:  number
    collegeShortName:         string
    academicPeriodName:       string
    academicPeriodShortName:  string | null
    startDate:                string
    endDate:                  string
    status:                   string
    gradesLoadedAt:           string | null
    gradesLoadedByUserId:     number | null
    gradesLoadedByUserName:   string | null
    enrolledCount:            number
    gradedCount:              number
    missingCount:             number
    coveragePct:              number
    closedActasCount:         number
    openActasCount:           number
    actas:                    ActaRow[]
    canClose:                 boolean
}

const route = useRoute()
const capId = String(route.params.capId)

const loading = ref(false)
const data    = ref<PeriodClosureData | { found: false } | null>(null)

const markingLoaded = ref(false)
const busyActaIds   = ref<Set<number>>(new Set())
const closureError  = ref('')
const closureBanner = ref('')

async function load(): Promise<void> {
    loading.value = true
    closureError.value = ''
    try {
        const { data: payload } = await api.get(API.SCHOOL_SERVICES_API.periodClosure.status(capId))
        data.value = payload
    } catch {
        data.value = { found: false }
    } finally {
        loading.value = false
    }
}

const confirmOpen = ref(false)
const confirmConfig = reactive<{
    title:       string
    message:     string
    confirmText: string
    variant:     'warning' | 'info' | 'success'
    action:      null | (() => Promise<void>)
}>({
    title: '', message: '', confirmText: 'Confirmar', variant: 'warning', action: null,
})

function askConfirm(
    title: string, message: string, confirmText: string, variant: 'warning' | 'info' | 'success',
    action: () => Promise<void>,
): void {
    confirmConfig.title       = title
    confirmConfig.message     = message
    confirmConfig.confirmText = confirmText
    confirmConfig.variant     = variant
    confirmConfig.action      = action
    confirmOpen.value = true
}

async function runConfirmedAction(): Promise<void> {
    if (confirmConfig.action) await confirmConfig.action()
    confirmConfig.action = null
}

function confirmMarkLoaded(): void {
    askConfirm(
        'Cerrar carga del periodo',
        '¿Cerrar formalmente la carga de calificaciones de este periodo? La acción quedará auditada y bloqueará reaperturas de actas.',
        'Cerrar carga',
        'warning',
        async () => {
            markingLoaded.value = true
            closureError.value = ''
            closureBanner.value = ''
            try {
                await api.post(API.SCHOOL_SERVICES_API.periodClosure.markLoaded(capId), {})
                closureBanner.value = '✓ Carga cerrada correctamente.'
                await load()
            } catch (e: unknown) {
                closureError.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
                    ?? 'No se pudo cerrar la carga.'
            } finally {
                markingLoaded.value = false
            }
        },
    )
}

async function closeActa(taId: number): Promise<void> {
    busyActaIds.value.add(taId)
    try {
        await api.post(API.SCHOOL_SERVICES_API.periodClosure.closeActa(taId), {})
        await load()
    } catch (e: unknown) {
        closureError.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudo cerrar el acta.'
    } finally {
        busyActaIds.value.delete(taId)
    }
}

function reopenActa(taId: number): void {
    askConfirm(
        'Reabrir acta',
        '¿Reabrir esta acta? Permitirá editar calificaciones de esta materia.',
        'Reabrir',
        'warning',
        async () => {
            busyActaIds.value.add(taId)
            try {
                await api.post(API.SCHOOL_SERVICES_API.periodClosure.reopenActa(taId), {})
                await load()
            } catch (e: unknown) {
                closureError.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
                    ?? 'No se pudo reabrir el acta.'
            } finally {
                busyActaIds.value.delete(taId)
            }
        },
    )
}

// Reclassification state
interface ReclassItem {
    affiliationId:        number
    studentId:            number
    studentName:          string
    numControl:           string | null
    currentStatusId:      number
    currentStatusName:    string
    newStatusId:          number | null
    newStatusName:        string | null
    currentPeriodNumber:  number
    newPeriodNumber:      number | null
    exitPeriodId:         number | null
    rule:                 string
}
interface ReclassPreview {
    collegeAcademicPeriodId: number
    totalAffiliations:       number
    summaryByRule:           Record<string, number>
    items:                   ReclassItem[]
}

const reclassPreview  = ref<ReclassPreview | null>(null)
const loadingReclass  = ref(false)
const applyingReclass = ref(false)
const reclassError    = ref('')
const reclassBanner   = ref('')

async function loadReclassPreview(): Promise<void> {
    loadingReclass.value = true
    reclassError.value = ''
    try {
        const { data: payload } = await api.get(API.SCHOOL_SERVICES_API.periodClosure.reclassificationPreview(capId))
        reclassPreview.value = payload
    } catch (e: unknown) {
        reclassError.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudo cargar el preview.'
    } finally {
        loadingReclass.value = false
    }
}

function confirmReclassify(): void {
    askConfirm(
        'Aplicar reclasificación',
        '¿Aplicar los cambios de status y avance de semestre listados arriba? Esta acción modifica las afiliaciones de los alumnos.',
        'Aplicar',
        'warning',
        async () => {
            applyingReclass.value = true
            reclassError.value = ''
            reclassBanner.value = ''
            try {
                const { data: result } = await api.post(API.SCHOOL_SERVICES_API.periodClosure.reclassify(capId), {})
                reclassBanner.value = `✓ Aplicadas ${result.appliedCount}. Sin cambio ${result.skippedCount}.`
                await loadReclassPreview()
            } catch (e: unknown) {
                reclassError.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
                    ?? 'No se pudo aplicar.'
            } finally {
                applyingReclass.value = false
            }
        },
    )
}

function ruleLabel(rule: string): string {
    return {
        egresado:                'Egresado',
        prospecto_titulacion:    'Prospecto titulación',
        baja_max_attempts:       'Baja (N intentos)',
        baja_fail_all_subjects:  'Baja (reprobó todas)',
        baja_max_periods:        'Baja (exceso periodos)',
        advance_period:          'Avance de semestre',
        no_op_terminal_status:   'Sin acción',
    }[rule] ?? rule
}

function ruleBadgeClass(rule: string): string {
    if (rule.startsWith('baja_')) return 'bg-rose-100 text-rose-700'
    if (rule === 'egresado')      return 'bg-blue-100 text-blue-700'
    if (rule === 'prospecto_titulacion') return 'bg-cyan-100 text-cyan-700'
    if (rule === 'advance_period') return 'bg-emerald-100 text-emerald-700'
    return 'bg-slate-100 text-slate-700'
}

function statusTextClass(name: string): string {
    if (name.startsWith('BAJA')) return 'text-rose-700 font-semibold'
    if (name === 'EGRESADO') return 'text-blue-700 font-semibold'
    if (name === 'PROSPECTO TITULACION') return 'text-cyan-700 font-semibold'
    return 'text-slate-700'
}

function statusBadgeClass(status: string): string {
    return {
        draft:    'bg-amber-100 text-amber-700',
        planned:  'bg-blue-100 text-blue-700',
        active:   'bg-emerald-100 text-emerald-700',
        closed:   'bg-slate-200 text-slate-700',
        archived: 'bg-slate-100 text-slate-500',
    }[status] ?? 'bg-slate-100 text-slate-600'
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
        return iso
    }
}

onMounted(load)
</script>
