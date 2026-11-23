<template>
    <div class="space-y-3">
        <p class="text-xs text-slate-400">
            Carga cada formato en su menú, luego <b>Entrégalo</b> para que quede bloqueado y la coordinación lo revise.
        </p>
        <div v-if="loading" role="status" class="space-y-2">
            <span class="sr-only">Cargando…</span>
            <div v-for="n in 3" :key="n" aria-hidden="true" class="rounded-xl border bg-white p-4 flex items-center justify-between gap-3">
                <div class="space-y-2">
                    <div class="h-4 w-40 rounded bg-slate-200 animate-pulse motion-reduce:animate-none"></div>
                    <div class="h-2.5 w-56 rounded bg-slate-200 animate-pulse motion-reduce:animate-none"></div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="h-5 w-20 rounded-full bg-slate-200 animate-pulse motion-reduce:animate-none"></div>
                    <div class="h-7 w-24 rounded-lg bg-slate-200 animate-pulse motion-reduce:animate-none"></div>
                </div>
            </div>
        </div>
        <div v-else class="space-y-2">
            <div v-for="f in data.formats" :key="f.code" class="rounded-xl border bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
                <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-700">{{ f.label }}</p>
                    <p class="text-[11px] text-slate-400">
                        <span v-if="f.submitted_at">Entregado: {{ fmtDate(f.submitted_at) }}</span>
                        <span v-if="f.reviewed_at"> · Revisado: {{ fmtDate(f.reviewed_at) }}</span>
                        <span v-if="f.coordinator_note"> · “{{ f.coordinator_note }}”</span>
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" :class="badge(f.status).cls">{{ badge(f.status).text }}</span>
                    <router-link v-if="routeFor(f.code)" :to="routeFor(f.code)" class="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-50">Cargar / Ver</router-link>
                    <!-- Tutor -->
                    <button v-if="!data.can_review && f.status === 'draft'" @click="submit(f)" :disabled="busy"
                        class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Entregar</button>
                    <!-- Coordinación -->
                    <template v-if="data.can_review">
                        <button v-if="f.status === 'submitted'" @click="review(f)" :disabled="busy" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50">Revisar</button>
                        <button v-if="f.status !== 'draft'" @click="revert(f)" :disabled="busy" class="px-3 py-1.5 rounded-lg border text-xs font-semibold text-amber-700">Regresar a borrador</button>
                    </template>
                </div>
            </div>
            <p v-if="!data.formats.length" class="text-sm text-slate-400 text-center py-4">Sin formatos aplicables.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'

const props = defineProps<{ assignmentId: number | string }>()
const T = API.TUTORING_API
const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(true)
const busy = ref(false)
const data = ref<any>({ formats: [], can_review: false })

// Dónde se CARGA cada formato (menú del tutor) para preparar su contenido.
const ROUTES: Record<string, string> = {
    pat: '/tutoring/my-pat',
    actividad_grupal: '/tutoring/my-evaluation',
    trayectoria: `/tutoring/assignments/${props.assignmentId}/trayectoria`,
    reporte_final: '/tutoring/my-followups',
}
function routeFor(code: string) { return ROUTES[code] ?? null }

function fmtDate(d: string | null) { return d ? new Date(d).toLocaleString() : '—' }
function badge(s: string) {
    const map: Record<string, { cls: string; text: string }> = {
        draft:     { cls: 'bg-slate-100 text-slate-500', text: 'Borrador' },
        submitted: { cls: 'bg-blue-100 text-blue-700', text: 'Entregado' },
        reviewed:  { cls: 'bg-emerald-100 text-emerald-700', text: 'Revisado' },
    }
    return map[s] ?? map.draft
}

async function load() {
    loading.value = true
    try { data.value = (await api.get(T.assignments.formats(props.assignmentId))).data } finally { loading.value = false }
}
async function act(fn: () => Promise<void>, ok: string) {
    busy.value = true
    try { await fn(); await load(); toast.success(ok) } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') } finally { busy.value = false }
}
async function submit(f: any) {
    if (!await confirm({ title: 'Entregar formato', message: `¿Entregar "${f.label}"? Quedará bloqueado para edición.`, confirmText: 'Entregar', variant: 'warning' })) return
    await act(() => api.post(T.assignments.formatSubmit(props.assignmentId, f.code)).then(() => {}), 'Formato entregado.')
}
async function review(f: any) { await act(() => api.post(T.assignments.formatReview(props.assignmentId, f.code)).then(() => {}), 'Formato revisado.') }
async function revert(f: any) { await act(() => api.post(T.assignments.formatRevert(props.assignmentId, f.code)).then(() => {}), 'Formato regresado a borrador.') }

watch(() => props.assignmentId, load)
onMounted(load)
</script>
