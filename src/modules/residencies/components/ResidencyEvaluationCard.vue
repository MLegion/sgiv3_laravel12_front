<template>
    <div class="rounded-xl border bg-white p-5 space-y-3">
        <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Evaluación</h2>
            <span v-if="evaluation?.kardexSyncedAt" class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="evaluation.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                KARDEX: {{ evaluation.finalGrade }} · {{ evaluation.passed ? 'APROBADO' : 'REPROBADO' }}
            </span>
        </div>

        <p v-if="loading" class="text-xs text-slate-400">Cargando…</p>

        <template v-else-if="evaluation">
            <p v-if="locked" class="text-xs text-emerald-600">
                Calificación enviada al kardex el {{ formatDate(evaluation.kardexSyncedAt) }}. Ya no es editable.
            </p>

            <table class="w-full text-sm">
                <thead>
                    <tr class="text-[10px] font-black text-slate-400 uppercase">
                        <th class="text-left py-1">Componente</th>
                        <th class="text-center py-1 w-16">Peso</th>
                        <th class="text-center py-1 w-24">Calif.</th>
                        <th class="text-left py-1">Capturó</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in evaluation.components" :key="c.key" class="border-t">
                        <td class="py-1.5 text-slate-700">{{ c.label }}</td>
                        <td class="py-1.5 text-center text-slate-500">{{ c.weight }}%</td>
                        <td class="py-1.5 text-center">
                            <input type="number" min="0" max="100" :disabled="locked" :value="c.score ?? ''"
                                   class="border rounded-md px-2 py-1 text-sm w-20 text-center disabled:bg-slate-50"
                                   @change="(e) => save(c.key, e)" />
                        </td>
                        <td class="py-1.5 text-[11px] text-slate-400">{{ c.capturedBy ?? '—' }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="flex items-center justify-between border-t pt-3">
                <div class="text-sm">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-2">Final</span>
                    <span class="font-bold" :class="evaluation.passed ? 'text-emerald-600' : 'text-slate-700'">
                        {{ evaluation.complete ? evaluation.final : '—' }}
                    </span>
                    <span v-if="evaluation.complete" class="text-[10px] ml-2" :class="evaluation.passed ? 'text-emerald-600' : 'text-red-600'">
                        {{ evaluation.passed ? 'APROBADO' : 'REPROBADO' }}
                    </span>
                    <span v-else class="text-[11px] text-amber-600 ml-2">Faltan calificaciones</span>
                </div>

                <button v-if="canConfirm && !locked" type="button"
                        class="text-xs px-3 py-2 rounded-md text-white disabled:opacity-50"
                        :class="evaluation.complete ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400'"
                        :disabled="!evaluation.complete || confirming"
                        @click="confirmModal = true">
                    Confirmar y enviar al kardex
                </button>
            </div>

            <p v-if="msg" class="text-xs" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>
        </template>

        <!-- Confirmación -->
        <Teleport to="body">
            <div v-if="confirmModal" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="confirmModal = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-3 z-10">
                    <h3 class="text-sm font-semibold text-slate-800">Confirmar calificación final</h3>
                    <p class="text-sm text-slate-600">
                        Se asentará <strong>{{ evaluation?.final }}</strong>
                        ({{ evaluation?.passed ? 'APROBADO' : 'REPROBADO' }}) en el kardex del residente.
                        Esta acción no se puede deshacer.
                    </p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="confirmModal = false">Cancelar</button>
                        <button type="button" class="px-4 py-2 text-sm rounded-lg text-white bg-emerald-600 hover:bg-emerald-700" @click="confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ResidencyEvaluation } from '@/modules/residencies/types/residency.type'

const props = defineProps<{ residencyId: number | string; canConfirm?: boolean }>()
const emit = defineEmits<{ (e: 'confirmed'): void }>()

const R = API.RESIDENCIES_API

const loading    = ref(true)
const evaluation = ref<ResidencyEvaluation | null>(null)
const confirming = ref(false)
const confirmModal = ref(false)
const msg      = ref<string | null>(null)
const msgError = ref(false)

const locked = computed(() => !!evaluation.value?.kardexSyncedAt)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(R.residency.evaluation(props.residencyId))
        evaluation.value = data
    } finally { loading.value = false }
}

async function save(key: string, e: Event) {
    const raw = (e.target as HTMLInputElement).value
    const score = raw === '' ? null : Number(raw)
    msg.value = null
    try {
        const { data } = await api.put(R.residency.evaluation(props.residencyId), { component_key: key, score })
        evaluation.value = data
        msgError.value = false
        msg.value = 'Guardado.'
    } catch (err: any) {
        msgError.value = true
        msg.value = err?.response?.data?.message ?? 'No se pudo guardar.'
        await load()
    }
}

async function confirm() {
    confirmModal.value = false
    confirming.value = true; msg.value = null
    try {
        await api.post(R.residency.confirmEvaluation(props.residencyId), {})
        await load()
        emit('confirmed')
        msgError.value = false
        msg.value = 'Calificación enviada al kardex.'
    } catch (err: any) {
        msgError.value = true
        msg.value = err?.response?.data?.message ?? 'No se pudo confirmar.'
    } finally { confirming.value = false }
}

function formatDate(s: string | null): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

load()
</script>
