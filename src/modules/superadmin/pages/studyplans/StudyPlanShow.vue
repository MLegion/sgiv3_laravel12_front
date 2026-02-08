<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                DETALLES - PLAN DE ESTUDIO
            </h1>

            <div class="flex gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    v-if="canEdit"
                    class="px-3 py-2 text-sm rounded-lg
                           bg-amber-600 text-white hover:bg-amber-700"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <!-- Loading -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    Cargando información…
                </span>
            </div>

            <!-- Información principal -->
            <section v-if="loaded" class="space-y-2">
                <h2 class="text-lg font-semibold text-slate-800">
                    {{ studyPlan.officialCode }}
                </h2>

                <p class="text-sm text-slate-600">
                    <strong>CARRERA:</strong>
                        {{ studyPlan.career?.name ?? '—' }}
                </p>

                <p class="text-sm text-slate-600">
                    <strong>TIPO DE PERIODO:</strong>
                    {{ periodTypeLabel(studyPlan.periodType) }}
                </p>

                <p class="text-sm text-slate-600">
                    <strong>NÚMERO DE PERIODOS:</strong>
                    {{ studyPlan.periods }}
                </p>

                <p class="text-sm text-slate-600">
                    <strong>AÑO DE INICIO:</strong>
                    {{ studyPlan.startYear }}
                </p>
            </section>

            <!-- Estado -->
            <section v-if="hasApprovalStatus">
                <ApprovalStatusBadge
                    :status="studyPlan.approvalStatus"
                />
            </section>

            <!-- Auditoría -->
            <section
                v-if="loaded"
                class="pt-4 border-t text-sm text-slate-500 space-y-1"
            >
                <p>
                    <strong>CREADO POR:</strong>
                    {{ studyPlan.creator?.name ?? '-----' }}
                </p>

                <p>
                    <strong>APROBADO POR:</strong>
                    {{ studyPlan.approver?.name ?? '-----' }}
                </p>

                <p>
                    <strong>FECHA DE APROBACIÓN:</strong>
                    {{ studyPlan.approvedAt ?? '-----' }}
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ApprovalStatusBadge from '@/app/components/ui/ApprovalStatusBadge.vue'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'
import type { StudyPlanType } from '@/modules/superadmin/types/study-plan.type'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const loaded = ref(false)
const studyPlan = ref<StudyPlanType>({} as StudyPlanType)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.studyPlans.byId(route.params.id)
        )
        studyPlan.value = data
        loaded.value = true
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const canEdit = computed(() =>
    studyPlan.value.approvalStatus !== ApprovalStatusEnum.APPROVED
)

const hasApprovalStatus = computed(() =>
    typeof studyPlan.value.approvalStatus === 'string'
)

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */
function periodTypeLabel(value?: string): string {
    switch (value) {
        case 'semester':
            return 'SEMESTRAL'
        case 'quarter':
            return 'CUATRIMESTRAL'
        case 'trimester':
            return 'TRIMESTRAL'
        default:
            return value ?? '—'
    }
}

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
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
