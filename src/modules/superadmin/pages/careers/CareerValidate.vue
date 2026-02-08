<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                VALIDAR - CARRERA PROFESIONAL
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
            <!-- Loading overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    Cargando información…
                </span>
            </div>

            <!-- Información básica -->
            <section class="space-y-2">
                <h2 class="text-lg font-semibold text-slate-800">
                    {{ career.name }}
                </h2>

                <p class="text-sm text-slate-500">
                    <strong>Nombre corto:</strong> {{ career.shortName }}
                </p>

                <p class="text-sm text-slate-500">
                    <strong>Clave oficial:</strong> {{ career.officialCode }}
                </p>

                <p class="text-sm text-slate-500">
                    <strong>Instituto:</strong> {{ career.college?.name ?? '—' }}
                </p>

                <p class="text-sm text-slate-500">
                    <strong>Creada por:</strong> {{ career.createdByUser?.name ?? '—' }}
                </p>
            </section>

            <!-- Estado -->
            <section>
                <span
                    class="inline-flex px-3 py-1 text-sm rounded-full"
                    :class="statusBadgeClass"
                >
                    {{ statusLabel }}
                </span>
            </section>

            <!-- Acciones -->
            <section
                v-if="canValidate"
                class="flex gap-3 pt-4 border-t"
            >
                <button
                    class="px-4 py-2 rounded-lg
                           bg-green-600 text-white
                           hover:bg-green-700 transition"
                    @click="approve"
                >
                    APROBAR
                </button>

                <button
                    class="px-4 py-2 rounded-lg
                           bg-red-600 text-white
                           hover:bg-red-700 transition"
                    @click="reject"
                >
                    RECHAZAR
                </button>
            </section>

            <!-- Mensaje estado final -->
            <section v-else class="text-sm text-slate-500 italic">
                ESTA CARRERA YA FUE <strong>{{ statusLabel.toUpperCase() }}</strong> Y NO PUEDE MODIFICARSE.
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CareerType } from '@/modules/superadmin/types/career.type'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const career = ref<CareerType>({} as CareerType)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.careers.byId(route.params.id)
        )
        career.value = data
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const canValidate = computed(() =>
    ![ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.REJECTED]
        .includes(career.value.approvalStatus)
)

const canEdit = computed(() =>
    career.value.approvalStatus !== ApprovalStatusEnum.APPROVED
)

const statusLabel = computed(() => {
    switch (career.value.approvalStatus) {
        case ApprovalStatusEnum.APPROVED:
            return 'APROBADA'
        case ApprovalStatusEnum.REJECTED:
            return 'RECHAZADA'
        case ApprovalStatusEnum.PENDING:
            return 'PENDIENTE'
        default:
            return 'BORRADOR'
    }
})

const statusBadgeClass = computed(() => {
    switch (career.value.approvalStatus) {
        case ApprovalStatusEnum.APPROVED:
            return 'bg-green-100 text-green-700'
        case ApprovalStatusEnum.REJECTED:
            return 'bg-red-100 text-red-700'
        case ApprovalStatusEnum.PENDING:
            return 'bg-yellow-100 text-yellow-700'
        default:
            return 'bg-slate-100 text-slate-700'
    }
})

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goBack() {
    router.back()
}

function goToEdit() {
    router.push({
        name: 'superadmin.careers.edit',
        params: { id: career.value.id },
    })
}

async function approve() {
    await api.post(API.SUPERADMIN_API.careers.approve(career.value.id))
    await fetchData()
}

async function reject() {
    await api.post(API.SUPERADMIN_API.careers.reject(career.value.id))
    await fetchData()
}

onMounted(fetchData)
</script>
