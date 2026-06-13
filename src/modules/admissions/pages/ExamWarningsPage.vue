<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Aulas afectadas por examen de admisión</h1>
            <label class="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" v-model="onlyPending" @change="load" />
                Sólo pendientes
            </label>
        </div>

        <p class="text-xs text-slate-500">
            Estas son las clases <strong>escolarizadas</strong> de tus carreras cuyo aula será ocupada por un examen
            de admisión. La clase se pierde ese día — debes <strong>reubicar</strong> a tu docente o
            <strong>reagendar</strong> manualmente. Marca como <em>atendido</em> cuando hayas tomado la decisión.
        </p>

        <div v-if="loading" class="text-xs text-slate-400 italic py-8 text-center">Cargando...</div>

        <div v-else-if="warnings.length === 0" class="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center space-y-2">
            <CheckCircleIcon class="w-12 h-12 mx-auto text-emerald-400" />
            <p class="text-sm text-emerald-800 font-semibold uppercase">Sin avisos pendientes</p>
            <p class="text-xs text-emerald-600">No hay aulas afectadas por exámenes en tus carreras.</p>
        </div>

        <!-- Agrupado por sesión -->
        <div v-else class="space-y-4">
            <div
                v-for="group in groupedWarnings"
                :key="group.sessionId"
                class="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
                <div class="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-start justify-between gap-3">
                    <div>
                        <p class="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">
                            Examen de admisión #{{ group.sessionId }}
                        </p>
                        <p class="text-sm font-bold text-slate-800 mt-0.5">
                            {{ formatLongDate(group.session?.date) }}
                        </p>
                        <p class="text-xs text-slate-600 mt-0.5">
                            {{ group.session?.startTime?.slice(0, 5) }} – {{ group.session?.endTime?.slice(0, 5) }}
                        </p>
                    </div>
                    <div class="text-right text-xs">
                        <p class="text-slate-500">Aula:</p>
                        <p class="font-semibold text-slate-800">Place #{{ group.session?.placeId ?? '—' }}</p>
                    </div>
                </div>

                <table class="w-full text-xs">
                    <thead class="bg-slate-50">
                        <tr class="text-slate-600">
                            <th scope="col" class="px-3 py-2 text-left">Materia</th>
                            <th scope="col" class="px-3 py-2 text-left">Docente</th>
                            <th scope="col" class="px-3 py-2 text-left">Carrera</th>
                            <th scope="col" class="px-3 py-2 text-center">Estado</th>
                            <th scope="col" class="px-3 py-2 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="w in group.items" :key="w.id" class="border-t border-slate-100 hover:bg-slate-50">
                            <td class="px-3 py-2 text-slate-800 font-medium">{{ w.subject?.name ?? '—' }}</td>
                            <td class="px-3 py-2 text-slate-700">{{ w.teacher?.fullName ?? '—' }}</td>
                            <td class="px-3 py-2 text-slate-600">{{ w.career?.name ?? '—' }}</td>
                            <td class="px-3 py-2 text-center">
                                <span
                                    v-if="w.acknowledgedAt"
                                    class="text-[9px] px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700"
                                >
                                    Atendido
                                </span>
                                <span
                                    v-else
                                    class="text-[9px] px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-700"
                                >
                                    Pendiente
                                </span>
                            </td>
                            <td class="px-3 py-2 text-center">
                                <button
                                    v-if="!w.acknowledgedAt"
                                    class="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                    :disabled="acking === w.id"
                                    @click="acknowledge(w)"
                                >
                                    {{ acking === w.id ? 'GUARDANDO...' : 'MARCAR ATENDIDO' }}
                                </button>
                                <span v-else class="text-[10px] text-slate-400">
                                    {{ formatDate(w.acknowledgedAt) }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ExamClassWarning } from '@/modules/admissions/types/exam-class-warning.type'

const warnings    = ref<ExamClassWarning[]>([])
const loading     = ref(false)
const onlyPending = ref(true)
const acking      = ref<number | null>(null)
const error       = ref<string | null>(null)

interface Group {
    sessionId: number
    session: ExamClassWarning['examSession']
    items: ExamClassWarning[]
}

const groupedWarnings = computed<Group[]>(() => {
    const map = new Map<number, Group>()
    for (const w of warnings.value) {
        const key = w.examSessionId
        if (!map.has(key)) {
            map.set(key, { sessionId: key, session: w.examSession, items: [] })
        }
        map.get(key)!.items.push(w)
    }
    return Array.from(map.values()).sort((a, b) => {
        const da = a.session?.date ?? ''
        const db = b.session?.date ?? ''
        return da.localeCompare(db)
    })
})

async function load() {
    loading.value = true
    error.value   = null
    try {
        const { data } = await api.get(API.ADMISSIONS_API.examWarnings.myCareers, {
            params: { only_pending: onlyPending.value ? 1 : 0 },
        })
        warnings.value = data
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los avisos.'
    } finally {
        loading.value = false
    }
}

async function acknowledge(w: ExamClassWarning) {
    acking.value = w.id
    try {
        await api.patch(API.ADMISSIONS_API.examWarnings.acknowledge(w.id))
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo marcar como atendido.'
    } finally {
        acking.value = null
    }
}

function formatLongDate(s: string | null | undefined): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
}

function formatDate(s: string | null | undefined): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
}

onMounted(load)
</script>
