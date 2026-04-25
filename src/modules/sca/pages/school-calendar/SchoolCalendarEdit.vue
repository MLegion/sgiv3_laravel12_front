<template>
    <div class="min-h-screen bg-slate-50">
        <!-- Loading overlay -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-32">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span class="text-sm text-slate-500 font-bold uppercase">CARGANDO CALENDARIO...</span>
        </div>

        <!-- Error banner -->
        <Transition enter-active-class="transition-opacity duration-300" leave-active-class="transition-opacity duration-300" enter-from-class="opacity-0" leave-to-class="opacity-0">
            <div v-if="errorMsg" class="fixed top-4 right-4 z-[10000] p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shadow-lg max-w-sm">
                {{ errorMsg }}
            </div>
        </Transition>

        <template v-if="!loading && calendar">
            <!-- SECTION 1: Header bar (sticky top) -->
            <div class="sticky top-0 z-50 bg-white border-b shadow-sm px-6 py-3">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <h1 class="text-sm font-black uppercase text-slate-800 tracking-wider">CALENDARIO ESCOLAR</h1>
                        <button
                            type="button"
                            class="px-3 py-1.5 text-[10px] font-bold border rounded-lg hover:bg-slate-50 uppercase"
                            @click="router.back()"
                        >
                            REGRESAR
                        </button>
                    </div>

                    <div class="flex items-center gap-3">
                        <!-- Info badges -->
                        <span class="text-xs font-bold text-slate-600">
                            {{ calendar.collegeAcademicPeriod?.academicPeriod?.name ?? '---' }}
                        </span>
                        <span
                            class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            :class="calendar.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'"
                        >
                            {{ calendar.status === 'published' ? 'PUBLICADO' : 'BORRADOR' }}
                        </span>

                        <span class="text-slate-300">|</span>

                        <button
                            type="button"
                            class="px-3 py-1.5 text-[10px] font-bold rounded-lg text-white disabled:opacity-60 uppercase"
                            :class="calendar.status === 'published' ? 'bg-slate-500 hover:bg-slate-600' : 'bg-green-600 hover:bg-green-700'"
                            :disabled="togglingStatus"
                            @click="toggleStatus"
                        >
                            {{ calendar.status === 'published' ? 'PASAR A BORRADOR' : 'PUBLICAR' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: Main area (flex row) -->
            <div class="flex gap-4 p-4" @mouseup.stop>
                <!-- Left: Event Types Sidebar -->
                <div class="w-64 flex-shrink-0 bg-white border rounded-xl shadow-sm p-4 space-y-3 self-start sticky top-20">
                    <h2 class="text-[10px] font-black uppercase text-slate-400 tracking-widest">TIPOS DE EVENTO</h2>

                    <!-- Selected event type indicator -->
                    <div v-if="selectedEventType" class="p-2 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 space-y-2">
                        <div class="text-center">
                            <span class="text-[10px] font-bold text-blue-600 uppercase">MODO PINTAR</span>
                            <p class="text-xs font-bold mt-1" :style="{ color: selectedEventType.color }">{{ selectedEventType.name }}</p>
                        </div>

                        <!-- Select modalidad (solo si el tipo lo permite) -->
                        <div v-if="selectedEventType.isPerModality">
                            <label class="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Aplicar a</label>
                            <select
                                v-model="selectedModalityId"
                                class="w-full text-[11px] font-semibold rounded-md border border-blue-300 bg-white px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                                <option :value="null">Todas (global)</option>
                                <option v-for="m in modalities" :key="m.id" :value="m.id">{{ m.label }}</option>
                            </select>
                        </div>

                        <button @click="cancelPaintMode" class="w-full text-[10px] text-red-500 hover:underline">CANCELAR</button>
                    </div>

                    <!-- Visible event type cards -->
                    <div
                        v-for="et in visibleEventTypes"
                        :key="et.id"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border"
                        :class="selectedEventType?.id === et.id ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'"
                        @click="selectEventType(et)"
                    >
                        <component v-if="getIcon(et.image)" :is="getIcon(et.image)" class="w-5 h-5 flex-shrink-0" :style="{ color: et.color }" />
                        <span v-else class="w-4 h-4 rounded-full flex-shrink-0" :style="{ backgroundColor: et.color }"></span>
                        <span class="text-xs font-bold text-slate-700 uppercase flex-1 break-words leading-tight">{{ et.name }}</span>
                        <span v-if="et.isHoliday" class="text-[8px] px-1 py-0.5 bg-red-100 text-red-500 rounded font-bold">F</span>
                        <span v-if="et.maxOccurrences === 1" class="text-[8px] px-1 py-0.5 bg-blue-100 text-blue-500 rounded font-bold">1x</span>
                        <span v-if="et.excludesClasses && !et.isHoliday" class="text-[8px] px-1 py-0.5 bg-orange-100 text-orange-500 rounded font-bold">EC</span>
                    </div>

                    <!-- Toggle hidden event types -->
                    <button
                        v-if="hiddenEventTypes.length"
                        type="button"
                        class="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 py-1 border-t mt-2 pt-2"
                        @click="showHidden = !showHidden"
                    >
                        {{ showHidden ? 'OCULTAR' : 'MOSTRAR' }} PROCESOS ({{ hiddenEventTypes.length }})
                    </button>
                    <template v-if="showHidden">
                        <div
                            v-for="et in hiddenEventTypes"
                            :key="et.id"
                            class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border border-dashed"
                            :class="selectedEventType?.id === et.id ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300'"
                            @click="selectEventType(et)"
                        >
                            <component v-if="getIcon(et.image)" :is="getIcon(et.image)" class="w-4 h-4 flex-shrink-0" :style="{ color: et.color }" />
                            <span v-else class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: et.color }"></span>
                            <span class="text-[10px] font-bold text-slate-500 uppercase flex-1 break-words leading-tight">{{ et.name }}</span>
                            <span v-if="et.maxOccurrences === 1" class="text-[7px] px-1 py-0.5 bg-blue-50 text-blue-400 rounded font-bold">1x</span>
                        </div>
                    </template>

                    <!-- Legend -->
                    <div class="border-t pt-3 mt-3 space-y-1">
                        <div class="flex items-center gap-1.5 text-[9px] text-slate-400">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span> FERIADO (is_holiday)
                        </div>
                        <div class="flex items-center gap-1.5 text-[9px] text-slate-400">
                            <span class="text-[8px] px-1 py-0.5 bg-red-100 text-red-500 rounded font-bold">EC</span> EXCLUYE CLASES
                        </div>
                        <div class="flex items-center gap-1.5 text-[9px] text-slate-400">
                            <span class="text-[8px] px-1 py-0.5 bg-blue-100 text-blue-500 rounded font-bold">1x</span> UNA SOLA VEZ
                        </div>
                    </div>
                </div>

                <!-- Right: Calendar Grid -->
                <div class="flex-1 space-y-4">
                    <!-- Events legend bar -->
                    <div v-if="events.length" class="bg-white border rounded-xl shadow-sm p-3">
                        <h3 class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">EVENTOS ASIGNADOS</h3>
                        <div class="flex flex-wrap gap-2">
                            <div
                                v-for="event in events"
                                :key="event.id"
                                class="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold text-white"
                                :style="{ backgroundColor: event.eventType?.color || '#ccc' }"
                            >
                                <component v-if="getIcon(event.eventType?.image)" :is="getIcon(event.eventType?.image)" class="w-3.5 h-3.5" />
                                <span>{{ event.eventType?.shortName }}</span>
                                <span class="opacity-75">{{ formatShortDate(event.startDate) }} &rarr; {{ formatShortDate(event.endDate) }}</span>
                                <span
                                    v-if="event.modalityId"
                                    class="ml-0.5 px-1.5 py-0.5 rounded bg-white/25 text-[9px] font-semibold uppercase"
                                    :title="`Solo aplica a: ${modalityLabelOf(event)}`"
                                >→ {{ modalityShortOf(event) }}</span>
                                <button
                                    @click="deleteEvent(event.id)"
                                    class="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/60 text-white hover:text-red-700 transition-colors"
                                    title="Eliminar evento"
                                >
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Month grids -->
                    <div class="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                        <!-- Each month card -->
                        <div
                            v-for="m in months"
                            :key="`${m.year}-${m.month}`"
                            class="bg-white border rounded-xl shadow-sm overflow-hidden select-none"
                        >
                            <!-- Month header -->
                            <div class="px-3 py-1.5 bg-slate-100 border-b">
                                <span class="text-[11px] font-black uppercase text-slate-600 tracking-wider">{{ MONTH_NAMES[m.month] }} {{ m.year }}</span>
                            </div>

                            <!-- Day headers -->
                            <div class="grid grid-cols-7 text-center border-b">
                                <span v-for="d in DAY_NAMES" :key="d" class="text-[9px] font-bold text-slate-400 py-1">{{ d }}</span>
                            </div>

                            <!-- Day cells grid -->
                            <div class="grid grid-cols-7">
                                <!-- Empty offset cells -->
                                <div v-for="n in getFirstDayOffset(m.year, m.month)" :key="'off'+n" class="h-9"></div>

                                <!-- Day cells -->
                                <div
                                    v-for="day in getDaysInMonth(m.year, m.month)"
                                    :key="day"
                                    class="h-12 flex flex-col items-center justify-center text-[11px] font-bold cursor-pointer transition-all relative group py-0.5"
                                    :class="getDayCellClass(m.year, m.month, day)"
                                    :style="getDayCellStyle(m.year, m.month, day)"
                                    :title="getDayCellTitle(m.year, m.month, day)"
                                    @click.stop="(e: MouseEvent) => handleDayClick(e, m.year, m.month, day)"
                                    @mousedown="startPaint(m.year, m.month, day)"
                                    @mouseenter="continuePaint(m.year, m.month, day)"
                                    @mouseup.stop="endPaint"
                                >
                                    <span class="text-[10px] leading-none">{{ day }}</span>
                                    <!-- Event icons row -->
                                    <div v-if="getDayEvents(m.year, m.month, day).length" class="flex items-center justify-center gap-px max-w-full overflow-hidden px-0.5">
                                        <component
                                            v-for="evt in getDayEvents(m.year, m.month, day).slice(0, 2)"
                                            :key="evt.id"
                                            :is="getIcon(evt.eventType?.image)"
                                            class="w-3 h-3 flex-shrink-0"
                                            :style="{ color: evt.eventType?.color }"
                                        />
                                        <span v-if="getDayEvents(m.year, m.month, day).length > 2" class="text-[8px] text-slate-400 font-bold leading-none">+{{ getDayEvents(m.year, m.month, day).length - 2 }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Tooltip (floating, teleported to body) -->
        <Teleport to="body">
            <div
                v-if="tooltip.visible"
                class="fixed z-[9999] bg-white border rounded-xl shadow-2xl w-56 overflow-hidden"
                :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
                @click.stop
            >
                <div class="px-3 py-2 bg-slate-100 border-b flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase text-slate-600">{{ tooltip.date }}</span>
                    <button @click="tooltip.visible = false" class="text-slate-400 hover:text-slate-600 text-xs">&times;</button>
                </div>
                <div class="p-2 space-y-1.5 max-h-48 overflow-y-auto">
                    <!-- Events on this day -->
                    <div v-for="evt in tooltip.events" :key="evt.id" class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50">
                        <component v-if="getIcon(evt.eventType?.image)" :is="getIcon(evt.eventType?.image)" class="w-4 h-4 flex-shrink-0" :style="{ color: evt.eventType?.color }" />
                        <span v-else class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: evt.eventType?.color }"></span>
                        <span class="text-[10px] font-bold text-slate-700 flex-1 uppercase">{{ evt.eventType?.name }}</span>
                        <button @click="deleteEvent(evt.id); tooltip.visible = false" class="text-red-400 hover:text-red-600">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <!-- Holiday info -->
                    <div v-if="tooltip.holiday" class="flex items-center gap-2 p-1.5 rounded-lg bg-red-50">
                        <span class="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></span>
                        <span class="text-[10px] font-bold text-red-700 uppercase">{{ tooltip.holiday.name }}</span>
                    </div>
                    <p v-if="!tooltip.events.length && !tooltip.holiday" class="text-[10px] text-slate-400 text-center py-2">SIN EVENTOS</p>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    SchoolCalendar,
    SchoolCalendarEvent,
    SchoolCalendarEventType,
} from '@/modules/sca/types/schoolCalendar.type'
import { DAY_NAMES } from '@/modules/sca/types/schoolCalendar.type'
import {
    XCircleIcon, MinusCircleIcon, PlayIcon, StopIcon, SunIcon,
    ExclamationTriangleIcon, BuildingLibraryIcon, CubeIcon, CubeTransparentIcon,
    MagnifyingGlassIcon, CheckBadgeIcon, DocumentTextIcon, DocumentCheckIcon,
    UserPlusIcon, ClockIcon, CheckCircleIcon, ClipboardDocumentListIcon,
    ClipboardDocumentCheckIcon, ChartBarIcon, ChartBarSquareIcon, DocumentArrowUpIcon,
    UserGroupIcon,
} from '@heroicons/vue/24/outline'

const ICON_MAP: Record<string, any> = {
    XCircleIcon, MinusCircleIcon, PlayIcon, StopIcon, SunIcon,
    ExclamationTriangleIcon, BuildingLibraryIcon, CubeIcon, CubeTransparentIcon,
    MagnifyingGlassIcon, CheckBadgeIcon, DocumentTextIcon, DocumentCheckIcon,
    UserPlusIcon, UserGroupIcon, ClockIcon, CheckCircleIcon, ClipboardDocumentListIcon,
    ClipboardDocumentCheckIcon, ChartBarIcon, ChartBarSquareIcon, DocumentArrowUpIcon,
    UserCheckIcon: UserGroupIcon, // alias - UserCheckIcon no existe en heroicons, usamos UserGroupIcon
}

function getIcon(iconName: string | null | undefined) {
    if (!iconName) return null
    return ICON_MAP[iconName] || null
}

const MONTH_NAMES = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
]

const router = useRouter()
const route = useRoute()
const id = route.params.id as string

// ---------- State ----------
const calendar = ref<SchoolCalendar | null>(null)
const events = ref<SchoolCalendarEvent[]>([])
const eventTypes = ref<SchoolCalendarEventType[]>([])
const loading = ref(true)
const togglingStatus = ref(false)
const errorMsg = ref('')
const selectedEventType = ref<SchoolCalendarEventType | null>(null)
const selectedModalityId = ref<number | null>(null)
const modalities = ref<Array<{ id: number, label: string }>>([])
const showHidden = ref(false)
const painting = ref(false)
const paintStartDate = ref('')
const paintEndDate = ref('')

const tooltip = reactive({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    dateStr: '',
    events: [] as SchoolCalendarEvent[],
    holiday: null as { name: string; color: string } | null,
})

// ---------- Computed maps ----------
const holidayMap = computed(() => {
    const map = new Map<string, { name: string; color: string }>()
    for (const event of events.value) {
        if (!event.eventType?.isHoliday) continue
        const start = new Date(event.startDate + 'T00:00:00')
        const end = new Date(event.endDate + 'T00:00:00')
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().slice(0, 10)
            map.set(key, { name: event.eventType.name + (event.label ? ': ' + event.label : ''), color: event.eventType.color })
        }
    }
    return map
})

const visibleEventTypes = computed(() => eventTypes.value.filter(et => et.visible))
const hiddenEventTypes = computed(() => eventTypes.value.filter(et => !et.visible))

const eventDateMap = computed(() => {
    const map = new Map<string, SchoolCalendarEvent[]>()
    for (const event of events.value) {
        const start = new Date(event.startDate + 'T00:00:00')
        const end = new Date(event.endDate + 'T00:00:00')
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().slice(0, 10)
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(event)
        }
    }
    return map
})

// ---------- Month calculation ----------
const months = computed(() => {
    if (!calendar.value?.collegeAcademicPeriod) return []
    const startDate = calendar.value.collegeAcademicPeriod.actualStartDate
    const endDate = calendar.value.collegeAcademicPeriod.actualEndDate
    return getMonthsBetween(startDate, endDate)
})

function getMonthsBetween(startDate: string, endDate: string) {
    const start = new Date(startDate.slice(0, 10) + 'T00:00:00')
    const end = new Date(endDate.slice(0, 10) + 'T00:00:00')
    const result: { year: number; month: number }[] = []
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    while (current <= end) {
        result.push({ year: current.getFullYear(), month: current.getMonth() })
        current.setMonth(current.getMonth() + 1)
    }
    return result
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOffset(year: number, month: number): number {
    return new Date(year, month, 1).getDay()
}

function formatDate(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
}

function formatShortDate(dateStr: string): string {
    const [, m, d] = dateStr.split('-')
    return `${d}/${MONTH_NAMES[parseInt(m) - 1]?.slice(0, 3)}`
}

function isInPeriodRange(dateStr: string): boolean {
    if (!calendar.value?.collegeAcademicPeriod) return false
    const start = calendar.value.collegeAcademicPeriod.actualStartDate
    const end = calendar.value.collegeAcademicPeriod.actualEndDate
    return dateStr >= start && dateStr <= end
}

function isHoliday(year: number, month: number, day: number): boolean {
    return holidayMap.value.has(formatDate(year, month, day))
}

function getDayEvents(year: number, month: number, day: number): SchoolCalendarEvent[] {
    return eventDateMap.value.get(formatDate(year, month, day)) || []
}

// ---------- Cell rendering ----------
function getDayCellClass(year: number, month: number, day: number): string {
    const dateStr = formatDate(year, month, day)

    if (!isInPeriodRange(dateStr)) return 'text-slate-200 cursor-default'
    if (holidayMap.value.has(dateStr)) return 'bg-red-50 text-red-400'

    const dayEvents = eventDateMap.value.get(dateStr)
    if (dayEvents?.length) return 'text-slate-700 font-black'

    // In paint mode, highlight hover range
    if (painting.value) {
        const start = paintStartDate.value < paintEndDate.value ? paintStartDate.value : paintEndDate.value
        const end = paintStartDate.value < paintEndDate.value ? paintEndDate.value : paintStartDate.value
        if (dateStr >= start && dateStr <= end) return 'ring-2 ring-blue-400 ring-inset'
    }

    return 'hover:bg-slate-50'
}

function getDayCellStyle(year: number, month: number, day: number): Record<string, string> {
    const dateStr = formatDate(year, month, day)
    const dayEvents = eventDateMap.value.get(dateStr)
    if (dayEvents?.length) {
        // Solo eventos visibles ponen fondo de color; procesos solo muestran icono
        const visibleEvent = dayEvents.find(e => e.eventType?.visible)
        if (visibleEvent) {
            return { backgroundColor: (visibleEvent.eventType?.color || '#ccc') + '30' } // 19% opacity para legibilidad
        }
    }
    // Paint preview
    if (painting.value && selectedEventType.value) {
        const start = paintStartDate.value < paintEndDate.value ? paintStartDate.value : paintEndDate.value
        const end = paintStartDate.value < paintEndDate.value ? paintEndDate.value : paintStartDate.value
        if (dateStr >= start && dateStr <= end) {
            return { backgroundColor: selectedEventType.value.color + '40' }
        }
    }
    return {}
}

function getDayCellTitle(year: number, month: number, day: number): string {
    const dateStr = formatDate(year, month, day)
    if (!isInPeriodRange(dateStr)) return ''

    const holiday = holidayMap.value.get(dateStr)
    if (holiday) return `FERIADO: ${holiday.name}`

    const dayEvents = eventDateMap.value.get(dateStr)
    if (dayEvents?.length) {
        return dayEvents.map(e => e.eventType?.name + (e.label ? ': ' + e.label : '')).join(', ')
    }

    return ''
}

// ---------- Paint mode ----------
function selectEventType(et: SchoolCalendarEventType) {
    selectedEventType.value = selectedEventType.value?.id === et.id ? null : et
    // Al cambiar tipo, resetear el scope (se podrá volver a elegir)
    selectedModalityId.value = null
}

function startPaint(year: number, month: number, day: number) {
    if (!selectedEventType.value) return
    const dateStr = formatDate(year, month, day)
    if (!isInPeriodRange(dateStr)) return
    painting.value = true
    paintStartDate.value = dateStr
    paintEndDate.value = dateStr
}

function continuePaint(year: number, month: number, day: number) {
    if (!painting.value) return
    const dateStr = formatDate(year, month, day)
    if (!isInPeriodRange(dateStr)) return
    paintEndDate.value = dateStr
}

async function endPaint() {
    if (!painting.value || !selectedEventType.value) {
        painting.value = false
        return
    }
    painting.value = false

    const start = paintStartDate.value < paintEndDate.value ? paintStartDate.value : paintEndDate.value
    const end = paintStartDate.value < paintEndDate.value ? paintEndDate.value : paintStartDate.value

    try {
        await api.post(API.SCA_API.schoolCalendarEvents.create(id), {
            event_type_id: selectedEventType.value.id,
            start_date: start,
            end_date: end,
            modality_id: selectedEventType.value.isPerModality ? selectedModalityId.value : null,
        })
        await loadEvents()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message || 'Error al asignar evento.'
        setTimeout(() => { errorMsg.value = '' }, 3000)
    }
}

// ---------- Day click handler ----------
function handleDayClick(e: MouseEvent, year: number, month: number, day: number) {
    const dateStr = formatDate(year, month, day)
    if (!isInPeriodRange(dateStr)) return

    // If in paint mode, the mousedown/mouseup handlers take over
    if (selectedEventType.value) return

    const dayEvents = eventDateMap.value.get(dateStr) || []
    const holiday = holidayMap.value.get(dateStr) || null

    // Position tooltip near the click
    tooltip.x = Math.min(e.clientX + 10, window.innerWidth - 240)
    tooltip.y = Math.min(e.clientY - 10, window.innerHeight - 260)
    tooltip.visible = true
    tooltip.date = `${day}/${MONTH_NAMES[month].slice(0, 3)}/${year}`
    tooltip.dateStr = dateStr
    tooltip.events = dayEvents
    tooltip.holiday = holiday
}

// ---------- Data loading ----------
async function loadCalendar() {
    try {
        const res = await api.get(API.SCA_API.schoolCalendars.byId(id))
        calendar.value = res.data
    } catch {
        errorMsg.value = 'NO SE PUDO CARGAR EL CALENDARIO.'
    }
}

async function loadEvents() {
    if (!calendar.value) return
    try {
        const res = await api.get(API.SCA_API.schoolCalendarEvents.list(id))
        const data = res.data
        events.value = data?.items ?? data?.data ?? (Array.isArray(data) ? data : [])
    } catch {
        // silent
    }
}

async function loadEventTypes() {
    try {
        const res = await api.get(API.SCA_API.schoolCalendarEventTypes.list, { params: { per_page: 50 } })
        eventTypes.value = res.data.items || res.data.data || res.data
    } catch {
        // silent
    }
}

// ---------- Actions ----------
async function toggleStatus() {
    if (!calendar.value) return
    togglingStatus.value = true
    errorMsg.value = ''
    const newStatus = calendar.value.status === 'published' ? 'draft' : 'published'
    try {
        await api.put(API.SCA_API.schoolCalendars.update(id), { status: newStatus })
        calendar.value.status = newStatus
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'ERROR AL CAMBIAR ESTADO.'
    } finally {
        togglingStatus.value = false
    }
}

async function deleteEvent(eventId: number) {
    try {
        await api.delete(API.SCA_API.schoolCalendarEvents.delete(id, eventId))
        await loadEvents()
    } catch {
        errorMsg.value = 'Error al eliminar evento.'
        setTimeout(() => { errorMsg.value = '' }, 3000)
    }
}

// ---------- Close tooltip on outside click ----------
function handleOutsideClick() {
    if (tooltip.visible) tooltip.visible = false
}

// ---------- Lifecycle ----------
async function loadModalities() {
    try {
        // school-services/modalities devuelve modalities filtrados al college
        const res = await api.get('/api/v1/school-services/modalities', { params: { per_page: 100 } })
        const items = res.data?.items ?? res.data?.data ?? (Array.isArray(res.data) ? res.data : [])
        modalities.value = items.map((m: any) => ({
            id: m.id,
            label: [m.campus?.name, m.modalityType?.name].filter(Boolean).join(' — ') || `Modalidad ${m.id}`,
        }))
    } catch {
        modalities.value = []
    }
}

function cancelPaintMode() {
    selectedEventType.value = null
    selectedModalityId.value = null
}

function modalityLabelOf(event: any): string {
    if (!event?.modality) return 'Modalidad'
    const type = event.modality.modality_type?.name ?? ''
    const campus = event.modality.campus?.name ?? ''
    return [campus, type].filter(Boolean).join(' — ') || 'Modalidad'
}

function modalityShortOf(event: any): string {
    if (!event?.modality) return 'MOD'
    return (event.modality.modality_type?.short_name || event.modality.modality_type?.name || 'MOD').toUpperCase()
}

onMounted(async () => {
    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('mouseup', endPaint)

    loading.value = true
    errorMsg.value = ''
    await loadCalendar()
    if (calendar.value) {
        await Promise.all([loadEventTypes(), loadEvents(), loadModalities()])
    }
    loading.value = false
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick)
    document.removeEventListener('mouseup', endPaint)
})
</script>
