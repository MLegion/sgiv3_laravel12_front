<template>
    <div class="space-y-4">
        <RouterLink :to="{ name: 'admissions.exam-sessions' }" class="text-xs text-slate-500 hover:text-blue-600">
            ← Sesiones de Examen
        </RouterLink>

        <div v-if="!session" class="text-sm text-slate-400 italic">Cargando...</div>

        <div v-else class="space-y-4">
            <!-- Cabecera -->
            <div class="bg-white border border-slate-200 rounded-lg p-4">
                <div class="flex items-start justify-between">
                    <div>
                        <h1 class="text-lg font-semibold text-slate-800 uppercase">
                            Sesión #{{ session.id }} — {{ session.place?.name }}
                        </h1>
                        <p class="text-sm text-slate-600 mt-1">
                            {{ formatDate(session.date) }} ·
                            {{ session.startTime?.slice(0, 5) }} – {{ session.endTime?.slice(0, 5) }}
                        </p>
                    </div>
                    <span :class="statusClass(session.status)" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {{ statusLabel(session.status) }}
                    </span>
                </div>
                <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                        <div class="text-slate-400 uppercase">Capacidad</div>
                        <div class="font-medium">{{ session.assignedCount }} / {{ session.capacity }}</div>
                    </div>
                    <div>
                        <div class="text-slate-400 uppercase">Cuidadores</div>
                        <div class="font-medium">{{ session.proctorsCount }}</div>
                    </div>
                    <div v-if="session.parentSessionId">
                        <div class="text-slate-400 uppercase">Reagendado de</div>
                        <RouterLink
                            :to="{ name: 'admissions.exam-sessions.detail', params: { id: session.parentSessionId } }"
                            class="text-blue-600 hover:underline"
                        >
                            #{{ session.parentSessionId }}
                        </RouterLink>
                    </div>
                </div>
                <p v-if="session.notes" class="text-xs text-slate-500 italic mt-2">{{ session.notes }}</p>
            </div>

            <!-- Tabs -->
            <div class="flex gap-1 border-b border-slate-200">
                <button
                    v-for="t in tabs"
                    :key="t.id"
                    :class="[
                        'px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b-2 transition',
                        currentTab === t.id
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700',
                    ]"
                    @click="currentTab = t.id"
                >
                    {{ t.label }}
                </button>
            </div>

            <!-- Tab content -->
            <div v-if="currentTab === 'assignments'" class="bg-white border border-slate-200 rounded-lg p-4">
                <SessionAssignmentsTab :session="session" @changed="loadSession" />
            </div>

            <div v-if="currentTab === 'proctors'" class="bg-white border border-slate-200 rounded-lg p-4">
                <ProctorPicker :session-id="session.id" />
            </div>

            <div v-if="currentTab === 'warnings'" class="bg-white border border-slate-200 rounded-lg p-4">
                <SessionWarningsTab :session-id="session.id" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ProctorPicker from '@/modules/admissions/components/ProctorPicker.vue'
import SessionAssignmentsTab from '@/modules/admissions/components/SessionAssignmentsTab.vue'
import SessionWarningsTab    from '@/modules/admissions/components/SessionWarningsTab.vue'
import type { ExamSession } from '@/modules/admissions/types/exam-session.type'

const route   = useRoute()
const session = ref<ExamSession | null>(null)

const tabs = [
    { id: 'assignments', label: 'Aspirantes' },
    { id: 'proctors',    label: 'Cuidadores' },
    { id: 'warnings',    label: 'Aulas afectadas' },
] as const

type TabId = typeof tabs[number]['id']
const currentTab = ref<TabId>('assignments')

async function loadSession() {
    const id = route.params.id
    const { data } = await api.get(API.ADMISSIONS_API.examSessions.byId(id as string))
    session.value = data
}

function formatDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

function statusLabel(s: string): string {
    const map: Record<string, string> = {
        SCHEDULED:   'Programada',
        IN_PROGRESS: 'En curso',
        COMPLETED:   'Concluida',
        CANCELLED:   'Cancelada',
        RESCHEDULED: 'Reagendada',
    }
    return map[s] ?? s
}

function statusClass(s: string): string {
    const map: Record<string, string> = {
        SCHEDULED:   'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
        COMPLETED:   'bg-slate-200 text-slate-600',
        CANCELLED:   'bg-red-100 text-red-700',
        RESCHEDULED: 'bg-purple-100 text-purple-700',
    }
    return map[s] ?? 'bg-slate-100 text-slate-600'
}

onMounted(loadSession)
</script>
