<template>
    <div v-if="sessions.length > 0">
        <h2 :class="['text-xs font-bold uppercase tracking-widest mb-2', accentTextClass]">{{ title }} ({{ sessions.length }})</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RouterLink
                v-for="s in sessions"
                :key="s.id"
                :to="{ name: 'admissions.proctor.session', params: { id: s.id } }"
                class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition block"
            >
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <p class="text-sm font-semibold text-slate-800">{{ formatLongDate(s.date) }}</p>
                        <p class="text-xs text-slate-600">
                            {{ s.startTime?.slice(0, 5) }} – {{ s.endTime?.slice(0, 5) }} · {{ s.place?.name ?? 'Aula —' }}
                        </p>
                    </div>
                    <span :class="statusClass(s.status)" class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0">
                        {{ statusLabel(s.status) }}
                    </span>
                </div>

                <div class="grid grid-cols-4 gap-1 text-center text-[10px] mt-3 border-t border-slate-100 pt-2">
                    <div>
                        <div class="font-bold text-slate-700">{{ s.attendanceCounts.PENDING }}</div>
                        <div class="text-slate-400 uppercase">Pendiente</div>
                    </div>
                    <div>
                        <div class="font-bold text-emerald-700">{{ s.attendanceCounts.PRESENT }}</div>
                        <div class="text-slate-400 uppercase">Presentes</div>
                    </div>
                    <div>
                        <div class="font-bold text-red-700">{{ s.attendanceCounts.ABSENT }}</div>
                        <div class="text-slate-400 uppercase">Ausentes</div>
                    </div>
                    <div>
                        <div class="font-bold text-amber-700">{{ s.attendanceCounts.INCOMPLETE }}</div>
                        <div class="text-slate-400 uppercase">No term.</div>
                    </div>
                </div>
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ProctorSessionListItem } from '@/modules/admissions/types/exam-attendance.type'

const props = defineProps<{
    title: string
    sessions: ProctorSessionListItem[]
    accent: 'emerald' | 'blue' | 'slate'
}>()

const accentTextClass = computed(() => {
    return {
        emerald: 'text-emerald-700',
        blue:    'text-blue-700',
        slate:   'text-slate-500',
    }[props.accent]
})

function formatLongDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
}

function statusLabel(s: string): string {
    return ({
        SCHEDULED: 'Programada',
        IN_PROGRESS: 'En curso',
        COMPLETED: 'Concluida',
        CANCELLED: 'Cancelada',
        RESCHEDULED: 'Reagendada',
    } as Record<string, string>)[s] ?? s
}

function statusClass(s: string): string {
    return ({
        SCHEDULED: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
        COMPLETED: 'bg-slate-200 text-slate-600',
        CANCELLED: 'bg-red-100 text-red-700',
        RESCHEDULED: 'bg-purple-100 text-purple-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}
</script>
