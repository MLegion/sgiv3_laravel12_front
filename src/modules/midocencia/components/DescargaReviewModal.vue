<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[88vh] overflow-auto">
            <!-- Cabecera -->
            <div class="flex items-center justify-between border-b px-5 py-3 sticky top-0 bg-white z-10">
                <h3 class="text-base font-semibold text-slate-800 inline-flex items-center gap-2">
                    <span>☑</span> Revisión de distribución
                </h3>
                <button class="text-slate-400 hover:text-slate-700" @click="$emit('close')">✕</button>
            </div>

            <div class="p-5 space-y-4">
                <!-- Docente + resumen -->
                <div class="flex items-start justify-between gap-3 border rounded-lg px-4 py-3 bg-slate-50">
                    <div>
                        <p class="font-bold text-slate-800">{{ teacherName }}</p>
                        <p class="text-sm text-slate-500">
                            {{ fmt(assignedHours) }} / {{ fmt(request.budgetHours) }} h asignadas
                            <span v-if="cuadra" class="ml-1 text-emerald-600 font-semibold">✔ Cuadra</span>
                            <span v-else class="ml-1 text-amber-600 font-semibold">⚠ No cuadra</span>
                        </p>
                    </div>
                    <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span>
                </div>

                <div v-if="loadingTree" class="text-center py-6 text-slate-400 text-sm">Cargando detalle…</div>

                <!-- Detalle agrupado por rubro -->
                <div v-else class="space-y-4">
                    <div v-for="rubro in rubrosView" :key="rubro.id">
                        <div class="text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-3 py-1.5 rounded">{{ rubro.name }}</div>
                        <div class="divide-y border-x border-b rounded-b">
                            <div v-for="c in rubro.criteria" :key="c.id" class="px-3 py-2.5">
                                <div class="flex items-start justify-between gap-3">
                                    <p class="font-semibold text-slate-800 text-sm">{{ c.name }}</p>
                                    <span class="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{{ fmt(c.hours) }} h</span>
                                </div>
                                <div class="grid md:grid-cols-2 gap-3 mt-1.5">
                                    <div v-if="c.products.length">
                                        <p class="text-[10px] font-semibold text-slate-400 uppercase">Productos</p>
                                        <ul class="text-xs text-slate-600 list-disc list-inside">
                                            <li v-for="(p, i) in c.products" :key="i">{{ p }}</li>
                                        </ul>
                                    </div>
                                    <div v-if="c.evidences.length">
                                        <p class="text-[10px] font-semibold text-slate-400 uppercase">Evidencias</p>
                                        <ul class="text-xs text-slate-600 list-disc list-inside">
                                            <li v-for="(e, i) in c.evidences" :key="i">{{ e }}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-if="rubrosView.length === 0" class="text-center py-4 text-slate-400 text-sm">Sin criterios asignados.</p>
                </div>

                <!-- Motivo de rechazo previo -->
                <div v-if="request.status === 'rejected' && request.rejectedReason" class="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                    {{ request.rejectedReason }}
                </div>

                <!-- Folio + motivo (solo si está en revisión) -->
                <div v-if="request.status === 'submitted'" class="grid md:grid-cols-2 gap-3 border-t pt-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Folio del oficio</label>
                        <input v-model="folio" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej. DI/001" />
                        <p class="text-[11px] text-slate-400 mt-0.5">Se usa al aprobar.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Motivo <span class="text-red-500 normal-case">(obligatorio si rechazas)</span></label>
                        <textarea v-model="reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Explica al docente qué debe corregir…"></textarea>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex flex-wrap justify-end gap-2 border-t px-5 py-3 sticky bottom-0 bg-white">
                <button v-if="request.status === 'approved' && request.scheduleStatus !== 'approved'"
                    class="px-3 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    :disabled="busy" @click="reopen">↺ Reabrir distribución</button>
                <button v-if="request.status === 'submitted'"
                    class="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    :disabled="busy || !reason.trim()" @click="reject">✕ Rechazar</button>
                <button v-if="request.status === 'submitted'"
                    class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    :disabled="busy || !folio.trim()" @click="showSign = true">✔ Aprobar y firmar</button>
                <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50" @click="$emit('close')">Cerrar</button>
            </div>
        </div>

        <!-- Aprobar el oficio EXIGE firmarlo (MFA/contraseña): si no firma, no se aprueba. -->
        <SignDocumentModal
            v-model="showSign"
            :endpoint="A.approve(request.id)"
            :extra-body="{ folio }"
            label="Oficio de función académica"
            @signed="onSigned"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import SignDocumentModal from '@/modules/signatures/modals/SignDocumentModal.vue'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'
import type { DistributionRequest } from '@/modules/midocencia/types/distribution.type'

const props = defineProps<{ request: DistributionRequest; teacherName: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'changed'): void }>()

const toast = useToast()
const A = API.MIDOCENCIA_API.approval
const { generateFromContext, convertToPdf } = useReportGenerator()

const folio = ref(props.request.folio ?? '')
const reason = ref('')
const busy = ref(false)
const showSign = ref(false)
const loadingTree = ref(true)

interface TreeProduct { id: number; name: string }
interface TreeEvidence { id: number; name: string }
interface TreeCriterion { id: number; name: string; products: TreeProduct[]; evidences: TreeEvidence[] }
interface TreeRubro { id: number; name: string; criteria: TreeCriterion[] }
const rubros = ref<TreeRubro[]>([])

const assignedHours = computed(() => props.request.details.reduce((a, d) => a + Number(d.hours), 0))
const cuadra = computed(() => Math.abs(assignedHours.value - Number(props.request.budgetHours)) < 0.01)

const detailByCrit = computed(() => {
    const m = new Map<number, { hours: number; products: number[]; evidences: number[] }>()
    for (const d of props.request.details) m.set(d.rubricCriterionId, { hours: Number(d.hours), products: d.selectedProducts ?? [], evidences: d.selectedEvidences ?? [] })
    return m
})

const rubrosView = computed(() =>
    rubros.value.map(r => ({
        id: r.id,
        name: r.name,
        criteria: r.criteria.filter(c => detailByCrit.value.has(c.id)).map(c => {
            const d = detailByCrit.value.get(c.id)!
            return {
                id: c.id,
                name: c.name,
                hours: d.hours,
                products: c.products.filter(p => d.products.includes(p.id)).map(p => p.name),
                evidences: c.evidences.filter(e => d.evidences.includes(e.id)).map(e => e.name),
            }
        }),
    })).filter(r => r.criteria.length > 0),
)

function fmt(n: number) { return Number(n).toFixed(Number(n) % 1 === 0 ? 0 : 1) }
function statusLabel(s: string) { return ({ draft: 'Borrador', submitted: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada' } as Record<string, string>)[s] ?? s }
function statusClass(s: string) { return ({ draft: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' } as Record<string, string>)[s] ?? 'bg-slate-100' }

onMounted(async () => {
    if (props.request.rubricId) {
        try {
            const { data } = await api.get(API.MIDOCENCIA_API.rubrics.tree(props.request.rubricId))
            rubros.value = data.rubros ?? []
        } catch { /* noop */ }
    }
    loadingTree.value = false
})

// La firma (MFA/contraseña) contra el endpoint approve hace firmar + aprobar en un
// solo paso; SignDocumentModal emite 'signed' al concluir con éxito. Tras aprobar,
// el oficio ya tiene folio+QR: lo renderizamos y lo AUTO-ARCHIVAMOS como evidencia
// (Capa B), para que después solo se presente sin regenerarse.
async function onSigned() {
    toast.success('Distribución aprobada y firmada.')
    emit('changed')
    await archiveEvidence()
}

async function archiveEvidence() {
    try {
        const { data } = await api.get(A.oficio(props.request.id))
        const folio = data?.context?.datos?.[0]?.firma_folio ?? null
        if (!folio) return
        const { blob } = await generateFromContext({ reportCode: data.reportCode, context: data.context, filename: 'OFICIO_FUNCION_ACADEMICA' })
        const pdf = await convertToPdf(blob, 'OFICIO_FUNCION_ACADEMICA.docx')
        const form = new FormData()
        form.append('document', pdf, `${folio}.pdf`)
        await api.post(API.SIGNATURES_API.archiveDocument(folio), form)
    } catch {
        // La evidencia se puede reintentar luego; no bloquea la aprobación.
    }
}

async function reject() {
    busy.value = true
    try {
        await api.post(A.reject(props.request.id), { reason: reason.value })
        toast.success('Distribución rechazada.')
        emit('changed')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo rechazar.') }
    finally { busy.value = false }
}

async function reopen() {
    const motivo = window.prompt('Motivo para reabrir la distribución (se regresará a borrador):')
    if (!motivo || !motivo.trim()) return
    busy.value = true
    try {
        await api.post(A.reopen(props.request.id), { reason: motivo.trim() })
        toast.success('Distribución reabierta (regresó a borrador).')
        emit('changed')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo reabrir.') }
    finally { busy.value = false }
}
</script>
