<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 tracking-tight uppercase">
                    VALIDACIÓN DE PLAN DE ESTUDIO
                </h1>
                <p class="text-sm text-slate-500 mt-1">Revisión técnica y cambio de estado administrativo</p>
            </div>

            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors uppercase font-bold"
                @click="goBack"
            >
                CANCELAR
            </button>
        </div>

        <!-- Loader -->
        <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div class="lg:col-span-2 bg-white border rounded-xl h-64"></div>
            <div class="bg-slate-900 border rounded-xl h-64"></div>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Columna Izquierda: Información del Plan -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
                    <section class="space-y-4">
                        <div class="flex justify-between items-start">
                            <h2 class="text-lg font-bold text-slate-900 uppercase tracking-tight">
                                {{ studyPlan.officialCode || 'SIN CÓDIGO' }}
                            </h2>
                            <!-- v-if para asegurar que el badge no reciba undefined -->
                            <ApprovalStatusBadge
                                v-if="studyPlan.approvalStatus"
                                :status="studyPlan.approvalStatus"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-6">
                            <InfoItem label="CARRERA" :value="studyPlan.career?.name" />
                            <InfoItem label="AÑO DE INICIO" :value="studyPlan.startYear" />
                            <InfoItem label="TIPO DE PERIODO" :value="periodTypeLabel(studyPlan.periodType)" />
                            <InfoItem label="PERIODOS TOTALES" :value="studyPlan.periods" />
                        </div>
                    </section>

                    <section class="pt-6 border-t">
                        <InfoItem label="SOLICITADO POR" :value="studyPlan.creator?.name" />
                    </section>
                </div>
            </div>

            <!-- Columna Derecha: Acciones de Validación -->
            <div class="space-y-6">
                <div class="bg-slate-900 text-white border border-slate-800 rounded-xl shadow-xl p-6 space-y-6">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Panel de Decisión
                    </h3>

                    <div class="space-y-4">
                        <label class="block space-y-2">
                            <span class="text-sm font-medium text-slate-300">Observaciones (Opcional)</span>
                            <textarea
                                v-model="comment"
                                rows="4"
                                class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Notas sobre la aprobación o motivos del rechazo..."
                            ></textarea>
                        </label>
                    </div>

                    <div class="flex flex-col gap-3">
                        <button
                            @click="handleAction('approve')"
                            :disabled="submitting"
                            class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            {{ submitting ? 'PROCESANDO...' : 'APROBAR PLAN' }}
                        </button>

                        <button
                            @click="handleAction('reject')"
                            :disabled="submitting"
                            class="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-lg font-bold text-sm transition-all"
                        >
                            RECHAZAR SOLICITUD
                        </button>
                    </div>

                    <p class="text-[10px] text-slate-500 text-center leading-relaxed">
                        Confirme la revisión técnica antes de proceder con el cambio de estado.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ApprovalStatusBadge from '@/app/components/ui/ApprovalStatusBadge.vue'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'
import type { StudyPlanType } from '@/modules/superadmin/types/study-plan.type'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const studyPlan = ref<Partial<StudyPlanType>>({})
const comment = ref('')

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.studyPlans.byId(route.params.id as string)
        )
        studyPlan.value = data

        // Si el plan ya está aprobado, no tiene sentido estar en esta pantalla de validación
        if (data.approvalStatus === ApprovalStatusEnum.APPROVED) {
            goBack()
        }
    } catch (error) {
        console.error("Error al cargar datos del plan:", error)
    } finally {
        loading.value = false
    }
}

async function handleAction(action: 'approve' | 'reject') {
    if (submitting.value) return

    submitting.value = true
    try {
        // Usamos las rutas específicas según tu configuración de API
        const url = action === 'approve'
            ? API.SUPERADMIN_API.studyPlans.approve(route.params.id as string)
            : API.SUPERADMIN_API.studyPlans.rejecte(route.params.id as string) // Usando 'rejecte' con 'e' final

        await api.post(url, { comment: comment.value })

        router.push({ name: 'superadmin.studyplans' })
    } catch (error) {
        console.error(`Error al intentar ${action}:`, error)
    } finally {
        submitting.value = false
    }
}

function periodTypeLabel(value?: string): string {
    const labels: Record<string, string> = {
        semester: 'SEMESTRAL',
        quarter: 'CUATRIMESTRAL',
        trimester: 'TRIMESTRAL'
    }
    return labels[value || ''] ?? value ?? '—'
}

function goBack() {
    router.back()
}

onMounted(fetchData)
</script>
