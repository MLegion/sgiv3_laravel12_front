<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Reajuste de Fechas</h1>
            <p class="text-sm text-slate-500 mt-1">
                Detecta conflictos entre las sesiones generadas y las suspensiones/festivos del calendario,
                y aplica una estrategia de reajuste.
            </p>
        </div>

        <!-- Selector -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Configuración (Periodo — Modalidad)
            </label>
            <select
                v-model="selectedConfigId"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                @change="loadConflicts"
            >
                <option :value="null">-- Selecciona una configuración --</option>
                <option v-for="c in configs" :key="c.id" :value="c.id">
                    {{ configLabel(c) }}
                </option>
            </select>
            <p v-if="!configs.length && !loadingConfigs" class="text-xs text-amber-600 mt-2">
                No hay configuraciones con fechas específicas (solo se listan las de tipo modalidad "por fecha").
            </p>
        </div>

        <!-- Detalle -->
        <template v-if="analysis">
            <!-- Panel meta -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total sesiones" :value="String(analysis.sessions.length)" color="slate" />
                <StatCard label="Conflictos" :value="String(analysis.conflict_count)" :color="analysis.conflict_count > 0 ? 'red' : 'emerald'" />
                <StatCard label="Fin de Periodo" :value="fmtDate(analysis.period_end_date)" color="slate" />
                <StatCard label="Entrega Calificaciones" :value="fmtDate(analysis.grade_delivery_date)" color="amber" />
            </div>

            <!-- Banner de estado -->
            <div v-if="banner.message" class="text-sm px-4 py-3 rounded-lg border"
                :class="banner.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'">
                {{ banner.message }}
            </div>

            <!-- Tabla sesiones -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 class="text-sm font-black text-slate-600 uppercase tracking-widest">Sesiones Actuales</h2>
                    <div class="text-xs text-slate-500 flex items-center gap-4">
                        <span class="inline-flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span> En conflicto
                        </span>
                        <span class="inline-flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-slate-300"></span> Deshabilitada
                        </span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500">
                            <tr>
                                <th class="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest">#</th>
                                <th class="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest">Día</th>
                                <th class="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest">Fecha</th>
                                <th class="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="s in analysis.sessions"
                                :key="s.session"
                                class="border-t border-slate-100"
                                :class="s.hasConflict ? 'bg-red-50' : (!s.enabled ? 'bg-slate-50 text-slate-400' : '')"
                            >
                                <td class="px-4 py-2 font-mono font-bold">{{ s.session }}</td>
                                <td class="px-4 py-2">{{ dayName(s.dayOfWeek) }}</td>
                                <td class="px-4 py-2 font-mono">{{ s.date || '—' }}</td>
                                <td class="px-4 py-2">
                                    <span v-if="s.hasConflict" class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-100 text-red-700">Conflicto</span>
                                    <span v-else-if="!s.enabled" class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-500">Deshabilitada</span>
                                    <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-700">Habilitada</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Estrategia -->
            <div v-if="analysis.conflict_count > 0" class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h2 class="text-sm font-black text-slate-600 uppercase tracking-widest">Aplicar Reajuste</h2>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                        v-for="opt in strategies" :key="opt.key"
                        class="flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition"
                        :class="strategy === opt.key ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100' : 'border-slate-200 hover:bg-slate-50'"
                    >
                        <input type="radio" :value="opt.key" v-model="strategy" class="mt-1" />
                        <div>
                            <p class="text-sm font-semibold text-slate-800">{{ opt.label }}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ opt.desc }}</p>
                        </div>
                    </label>
                </div>

                <div class="flex items-center justify-end">
                    <button
                        type="button"
                        :disabled="!strategy || applying"
                        class="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                        @click="applyAdjustment(false)"
                    >{{ applying ? 'Aplicando...' : 'Aplicar Reajuste' }}</button>
                </div>
            </div>

            <div v-else class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700">
                Sin conflictos en el calendario actual.
            </div>
        </template>

        <!-- Modal: advertencia cruce ENT_CALIF -->
        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="crossModal.open"
                class="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                @click.self="crossModal.open = false"
            >
                <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-md overflow-hidden">
                    <div class="p-6">
                        <div class="flex items-start gap-4">
                            <div class="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                <ExclamationTriangleIcon class="w-5 h-5" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-base font-bold text-slate-800">Cruza Entrega de Calificaciones</h3>
                                <p class="text-sm text-slate-500 mt-1">{{ crossModal.message }}</p>
                                <div class="mt-3 text-xs bg-slate-50 rounded-lg p-2 font-mono space-y-1">
                                    <div>Entrega Calificaciones: <span class="text-amber-700 font-bold">{{ fmtDate(crossModal.gradeDeliveryDate) }}</span></div>
                                    <div>Nueva última sesión: <span class="text-red-700 font-bold">{{ fmtDate(crossModal.projectedEndDate) }}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg" @click="crossModal.open = false">Cancelar y revisar</button>
                        <button type="button" :disabled="applying" class="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-60" @click="applyAdjustment(true)">Aplicar de todos modos</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import StatCard from '@/modules/sca/components/StatCard.vue'

interface LoadConfig {
    id: number
    collegeAcademicPeriod?: { academicPeriod?: { name?: string } }
    modality?: { modalityType?: { name?: string, config?: any } }
    scheduleDates?: any[] | null
}

interface Session {
    session: number
    date: string | null
    dayOfWeek: number | null
    enabled: boolean
    hasConflict?: boolean
}

interface Analysis {
    has_schedule_dates: boolean
    sessions: Session[]
    conflict_count: number
    conflict_dates: string[]
    grade_delivery_date: string | null
    period_end_date: string | null
    last_session_date: string | null
}

const configs = ref<LoadConfig[]>([])
const loadingConfigs = ref(true)
const selectedConfigId = ref<number | null>(null)
const analysis = ref<Analysis | null>(null)
const strategy = ref<string>('')
const applying = ref(false)
const banner = reactive({ message: '', ok: false })

const crossModal = reactive({
    open: false,
    message: '',
    gradeDeliveryDate: null as string | null,
    projectedEndDate: null as string | null,
})

const strategies = [
    {
        key: 'reduce',
        label: 'Reducir (sin reponer)',
        desc: 'Las sesiones en fecha de suspensión quedan deshabilitadas. No mueve las demás.',
    },
    {
        key: 'shift',
        label: 'Correr (sin extender)',
        desc: 'Las sesiones posteriores se corren al siguiente día hábil. Si no caben en el periodo, se deshabilitan.',
    },
    {
        key: 'shift_extend',
        label: 'Corrimiento + extensión',
        desc: 'Las sesiones se corren y el calendario puede extenderse más allá del periodo. Si cruza Entrega de Calificaciones, pedirá confirmación.',
    },
]

onMounted(async () => {
    loadingConfigs.value = true
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, { params: { per_page: 100 } })
        const items: LoadConfig[] = data.items || data.data || []
        configs.value = items.filter(c => Array.isArray(c.scheduleDates) && (c.scheduleDates?.length ?? 0) > 0)
    } finally {
        loadingConfigs.value = false
    }
})

async function loadConflicts() {
    analysis.value = null
    banner.message = ''
    strategy.value = ''
    if (!selectedConfigId.value) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.scheduleConflicts(selectedConfigId.value))
        analysis.value = data
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo analizar la configuración.'
    }
}

async function applyAdjustment(acceptCross: boolean) {
    if (!selectedConfigId.value || !strategy.value) return
    applying.value = true
    banner.message = ''
    try {
        const { data, status } = await api.post(
            API.SCA_API.academicLoadConfigs.adjustScheduleDates(selectedConfigId.value),
            {
                strategy: strategy.value,
                accept_cross_grade_delivery: acceptCross,
            },
            { validateStatus: (s) => s < 500 },
        )

        if (status === 409 && data?.requires_confirmation) {
            crossModal.gradeDeliveryDate = data.grade_delivery_date ?? null
            crossModal.projectedEndDate  = data.projected_end_date ?? null
            crossModal.message = data.message || 'La extensión cruza la fecha de Entrega de Calificaciones.'
            crossModal.open = true
            return
        }

        if (data?.applied) {
            crossModal.open = false
            banner.ok = true
            banner.message = data.message || 'Reajuste aplicado.'
            await loadConflicts()
            strategy.value = ''
        } else {
            banner.ok = false
            banner.message = data?.message || 'No se pudo aplicar el reajuste.'
        }
    } catch (e: any) {
        crossModal.open = false
        banner.ok = false
        banner.message = e.response?.data?.message || 'Error al aplicar el reajuste.'
    } finally {
        applying.value = false
    }
}

function configLabel(c: LoadConfig): string {
    const period = c.collegeAcademicPeriod?.academicPeriod?.name || `Periodo ${c.id}`
    const mod = c.modality?.modalityType?.name || 'Modalidad'
    return `${period} — ${mod}`
}

function fmtDate(v: string | null | undefined): string {
    if (!v) return '—'
    return v
}

function dayName(dow: number | null | undefined): string {
    if (!dow) return '—'
    return ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'][dow - 1] ?? '—'
}
</script>
