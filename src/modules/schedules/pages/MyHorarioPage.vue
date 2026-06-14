<template>
    <div class="max-w-4xl space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Horario</h1>
            <p v-if="groupsLabel" class="text-sm text-slate-500 mt-0.5">Grupo: <strong>{{ groupsLabel }}</strong></p>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
            Cargando...
        </div>

        <div v-else-if="slots.length === 0" class="bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
            Aún no tienes un horario publicado. Aparecerá aquí cuando se asigne tu grupo y se genere el horario.
        </div>

        <template v-else>
            <div v-for="day in daysWithClasses" :key="day.index" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div class="bg-slate-50 border-b border-slate-200 px-4 py-2">
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide">{{ day.label }}</h2>
                </div>
                <ul class="divide-y divide-slate-100">
                    <li v-for="slot in day.slots" :key="slot.id" class="flex items-start gap-4 px-4 py-3">
                        <div class="shrink-0 w-28 text-sm font-mono text-blue-700 font-semibold">
                            {{ slot.startTime }}<span class="text-slate-300">–</span>{{ slot.endTime }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="font-medium text-slate-800">
                                {{ slot.teacherAssignment?.subject?.name || '—' }}
                                <span v-if="slot.teacherAssignment?.subject?.officialCode" class="ml-1 text-[11px] font-mono text-slate-400">{{ slot.teacherAssignment.subject.officialCode }}</span>
                            </p>
                            <p class="text-xs text-slate-500 mt-0.5">
                                <span v-if="!slot.teacherAssignment?.teacher?.isVacancy">{{ slot.teacherAssignment?.teacher?.name || 'Docente por asignar' }}</span>
                                <span v-else class="italic text-amber-600">Docente por asignar</span>
                            </p>
                        </div>
                        <div class="shrink-0 text-right">
                            <p class="text-xs font-semibold text-slate-600">{{ slot.place?.name || '—' }}</p>
                            <p v-if="slot.place?.shortName" class="text-[10px] text-slate-400">{{ slot.place.shortName }}</p>
                        </div>
                    </li>
                </ul>
            </div>

            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface Slot {
    id: number
    dayOfWeek: number | null
    startTime: string
    endTime: string
    teacherAssignment: {
        teacher: { id: number; name: string; isVacancy: boolean } | null
        subject: { id: number; name: string; shortName: string | null; officialCode: string | null } | null
        group: { id: number; name: string; shift: string } | null
    } | null
    place: { id: number; name: string; shortName: string | null } | null
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const loading = ref(true)
const error   = ref<string | null>(null)
const slots   = ref<Slot[]>([])
const groups  = ref<{ name: string; shift: string }[]>([])

const groupsLabel = computed(() => groups.value.map(g => g.name).join(', '))

const daysWithClasses = computed(() => {
    const byDay = new Map<number, Slot[]>()
    for (const s of slots.value) {
        const d = s.dayOfWeek ?? 0
        if (!byDay.has(d)) byDay.set(d, [])
        byDay.get(d)!.push(s)
    }
    return [...byDay.keys()]
        .sort((a, b) => a - b)
        .map(index => ({
            index,
            label: DAY_LABELS[index] ?? `Día ${index}`,
            slots: byDay.get(index)!.slice().sort((a, b) => a.startTime.localeCompare(b.startTime)),
        }))
})

async function load() {
    loading.value = true
    error.value = null
    try {
        const { data } = await api.get(API.SCHEDULES_API.mySchedule)
        slots.value  = data.slots ?? []
        groups.value = data.groups ?? []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar tu horario.'
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
