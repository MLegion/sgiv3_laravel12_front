<template>
    <div class="max-w-4xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight uppercase">
                DETALLES - PLAN DE ESTUDIO
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors uppercase"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    v-if="canEdit && !loading"
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium transition-colors uppercase"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border rounded-xl shadow-sm relative overflow-hidden">

            <div v-if="studyPlan?.id || loading" class="p-6 space-y-8">
                <!-- Header del Plan -->
                <section class="pb-6 border-b">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div class="space-y-2 flex-1">
                            <div v-if="loading" class="h-8 w-48 bg-slate-100 animate-pulse rounded-md"></div>
                            <h2 v-else class="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                                {{ studyPlan.officialCode }}
                            </h2>

                            <div class="flex flex-wrap items-center gap-x-2 text-slate-500 font-medium text-sm">
                                <div v-if="loading" class="h-4 w-64 bg-slate-50 animate-pulse rounded"></div>
                                <template v-else>
                                    <span class="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Carrera:</span>
                                    <span class="text-blue-600 underline decoration-blue-200 underline-offset-4 cursor-help">
                                        {{ studyPlan.career?.name ?? '—' }}
                                    </span>
                                </template>
                            </div>
                        </div>

                        <div v-if="loading" class="h-6 w-24 bg-slate-100 animate-pulse rounded-full"></div>
                        <ApprovalStatusBadge
                            v-else-if="hasApprovalStatus"
                            :status="studyPlan.approvalStatus"
                        />
                    </div>
                </section>

                <!-- Cuadrícula de Información Técnica -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <InfoItem
                        label="Tipo de Periodo"
                        :value="periodTypeLabel(studyPlan.periodType)"
                        :loading="loading"
                    />

                    <InfoItem
                        label="Duración"
                        :value="studyPlan.periods ? `${studyPlan.periods} Periodos` : null"
                        :loading="loading"
                    />

                    <InfoItem
                        label="Año de Inicio"
                        :value="studyPlan.startYear"
                        :loading="loading"
                    />
                </div>

                <!-- Sección de Auditoría y Control -->
                <section class="pt-8 border-t">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0a11.955 11.955 0 01-3.04 8.618 11.955 11.955 0 01-8.618 3.04m0 0a11.955 11.955 0 01-3.04-8.618 11.955 11.955 0 013.04-8.618" />
                        </svg>
                        Registro de Auditoría
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div v-if="loading" class="w-8 h-8 bg-slate-200 animate-pulse rounded-full"></div>
                                <div v-else class="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    {{ studyPlan.creator?.name?.charAt(0) || 'C' }}
                                </div>
                                <InfoItem label="CREADO POR" :value="studyPlan.creator?.name" :loading="loading" />
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div v-if="loading" class="w-8 h-8 bg-slate-200 animate-pulse rounded-full"></div>
                                <div v-else class="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                    {{ studyPlan.approver?.name?.charAt(0) || 'A' }}
                                </div>
                                <div class="flex-1">
                                    <InfoItem label="APROBADO POR" :value="studyPlan.approver?.name" :loading="loading" />
                                </div>
                            </div>
                            <div class="pl-11">
                                <InfoItem label="FECHA DE APROBACIÓN" :value="studyPlan.approvedAt" :loading="loading" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Empty State / Error -->
            <div v-else class="p-20 text-center">
                <p class="text-slate-400 text-sm font-medium">No se encontró información del plan de estudio.</p>
                <button @click="fetchData" class="mt-4 text-blue-600 text-sm font-bold underline">Reintentar</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const studyPlan = ref<StudyPlanType>({} as StudyPlanType)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.studyPlans.byId(route.params.id)
        )
        studyPlan.value = data
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

const canEdit = computed(() =>
    studyPlan.value.approvalStatus !== ApprovalStatusEnum.APPROVED
)

const hasApprovalStatus = computed(() =>
    typeof studyPlan.value.approvalStatus === 'string'
)

function periodTypeLabel(value?: string): string {
    switch (value) {
        case 'semester': return 'SEMESTRAL'
        case 'quarter': return 'CUATRIMESTRAL'
        case 'trimester': return 'TRIMESTRAL'
        default: return value ?? '—'
    }
}

function goBack() {
    router.back()
}

function goToEdit() {
    router.push({
        name: 'superadmin.studyplans.edit',
        params: { id: studyPlan.value.id },
    })
}

onMounted(fetchData)
</script>
