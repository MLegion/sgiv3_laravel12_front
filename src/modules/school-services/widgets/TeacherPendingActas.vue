<template>
    <div class="h-full flex flex-col text-xs">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="font-medium text-slate-700">Mis actas pendientes</span>
            <span v-if="openCount > 0" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                {{ openCount }} abierta(s)
            </span>
            <span v-if="closedCount > 0" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                {{ closedCount }} cerrada(s)
            </span>
        </div>

        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="data?.teacherId === null" class="text-slate-500 italic text-[11px]">
            No estás registrado como docente.
        </div>

        <div v-else-if="items.length === 0" class="text-slate-500 italic text-[11px]">
            ✓ No tienes actas para cerrar.
        </div>

        <div v-else class="flex-1 flex flex-col gap-1.5 overflow-y-auto">
            <article
                v-for="it in items"
                :key="it.teacherAssignmentId"
                class="border rounded p-2"
                :class="it.actaClosedAt ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'"
            >
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                        {{ it.groupName }}
                    </span>
                    <span class="text-[11px] font-medium text-slate-700">{{ it.subjectName }}</span>
                    <span class="text-[9px] text-slate-500 ml-auto">
                        {{ it.periodShortName }}
                    </span>
                </div>

                <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-600 flex-wrap">
                    <span class="font-semibold">{{ it.graded }}/{{ it.enrolled }}</span>
                    <span>calificadas</span>
                    <span :class="it.coveragePct === 100 ? 'text-emerald-700 font-semibold' : 'text-amber-600 font-semibold'">
                        ({{ it.coveragePct }}%)
                    </span>
                    <span v-if="it.capEndDate" class="ml-auto text-[10px]" :class="urgencyClass(it.capEndDate)">
                        Cierra {{ formatDate(it.capEndDate) }}
                        <template v-if="daysToEnd(it.capEndDate) !== null">
                            ({{ daysToEnd(it.capEndDate) }})
                        </template>
                    </span>
                </div>

                <div v-if="errors[it.teacherAssignmentId]" class="mt-1 text-[10px] text-rose-600">
                    {{ errors[it.teacherAssignmentId] }}
                </div>

                <div class="flex items-center gap-1 mt-1.5">
                    <span v-if="it.actaClosedAt" class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Cerrada · {{ formatDate(it.actaClosedAt) }}
                    </span>
                    <button
                        v-if="!it.actaClosedAt"
                        :disabled="busyIds.has(it.teacherAssignmentId) || it.coveragePct < 100 || it.enrolled === 0"
                        :title="closeButtonTitle(it)"
                        class="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        @click="closeActa(it.teacherAssignmentId)"
                    >Cerrar acta</button>
                    <button
                        v-else
                        :disabled="busyIds.has(it.teacherAssignmentId) || !!it.capGradesLoadedAt"
                        :title="it.capGradesLoadedAt ? 'El periodo ya cerró la carga; no se puede reabrir' : 'Reabrir el acta para corregir capturas'"
                        class="ml-auto text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                        @click="askReopen(it.teacherAssignmentId)"
                    >Reabrir</button>
                </div>
            </article>
        </div>

        <p v-if="banner" class="mt-1 text-[10px] text-emerald-700 italic">{{ banner }}</p>

        <ConfirmModal
            v-model="confirmOpen"
            title="Reabrir acta"
            message="¿Reabrir este acta? Permitirá editar las calificaciones."
            confirm-text="Reabrir"
            variant="warning"
            @confirm="runReopen"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'

interface ActaItem {
    teacherAssignmentId: number
    actaClosedAt:        string | null
    groupId:             number
    groupName:           string
    subjectId:           number
    subjectName:         string
    capId:               number
    capStatus:           string
    capGradesLoadedAt:   string | null
    capStartDate:        string | null
    capEndDate:          string | null
    periodShortName:     string | null
    periodName:          string
    enrolled:            number
    graded:              number
    missing:             number
    coveragePct:         number
}

interface Payload {
    teacherId: number | null
    items:     ActaItem[]
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const emit = defineEmits<{ (e: 'refresh'): void }>()

const items       = computed<ActaItem[]>(() => props.data?.items ?? [])
const openCount   = computed(() => items.value.filter(i => i.actaClosedAt === null).length)
const closedCount = computed(() => items.value.filter(i => i.actaClosedAt !== null).length)

const busyIds = ref<Set<number>>(new Set())
const errors  = reactive<Record<number, string>>({})
const banner  = ref('')

const confirmOpen   = ref(false)
const pendingReopenId = ref<number | null>(null)

async function closeActa(taId: number): Promise<void> {
    busyIds.value.add(taId)
    delete errors[taId]
    try {
        await api.post(API.SCHOOL_SERVICES_API.periodClosure.closeActa(taId), {})
        banner.value = 'Acta cerrada.'
        emit('refresh')
    } catch (e: unknown) {
        errors[taId] = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudo cerrar.'
    } finally {
        busyIds.value.delete(taId)
    }
}

function askReopen(taId: number): void {
    pendingReopenId.value = taId
    confirmOpen.value = true
}

function closeButtonTitle(it: ActaItem): string {
    if (it.enrolled === 0)        return 'No hay alumnos inscritos en esta materia.'
    if (it.coveragePct < 100)     return 'Captura todas las calificaciones antes de cerrar.'
    return 'Marca el acta como cerrada (no podrás editar después si la carga del periodo se cierra).'
}

function daysToEnd(endDate: string | null): number | null {
    if (!endDate) return null
    const end = new Date(endDate + 'T23:59:59')
    const diffMs = end.getTime() - Date.now()
    return Math.ceil(diffMs / 86400000)
}

function urgencyClass(endDate: string | null): string {
    const d = daysToEnd(endDate)
    if (d === null) return 'text-slate-500'
    if (d < 0)      return 'text-rose-600 font-semibold'
    if (d <= 7)     return 'text-amber-600 font-semibold'
    return 'text-slate-500'
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
    } catch {
        return iso
    }
}

async function runReopen(): Promise<void> {
    const taId = pendingReopenId.value
    pendingReopenId.value = null
    if (!taId) return
    busyIds.value.add(taId)
    delete errors[taId]
    try {
        await api.post(API.SCHOOL_SERVICES_API.periodClosure.reopenActa(taId), {})
        banner.value = 'Acta reabierta.'
        emit('refresh')
    } catch (e: unknown) {
        errors[taId] = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudo reabrir.'
    } finally {
        busyIds.value.delete(taId)
    }
}
</script>
