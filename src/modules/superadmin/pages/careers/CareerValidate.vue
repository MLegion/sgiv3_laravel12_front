<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight">
                VALIDAR - CARRERA PROFESIONAL
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    v-if="canEdit"
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                    :disabled="loading"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden relative">

            <!-- Barra de Estado Superior -->
            <div
                class="px-6 py-3 flex items-center justify-between border-b"
                :class="statusBarClass"
            >
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold uppercase tracking-wider">Estado de Validación:</span>
                    <span class="text-xs font-black uppercase">{{ statusLabel }}</span>
                </div>

                <div v-if="!canValidate" class="text-[10px] font-bold uppercase opacity-70">
                    Registro Finalizado
                </div>
            </div>

            <div class="p-6 space-y-8">
                <!-- Información Principal -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-6">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            DETALLES DE LA SOLICITUD
                        </h3>

                        <div class="space-y-4">
                            <InfoItem label="NOMBRE DE LA CARRERA" :value="career.name" :loading="loading" />
                            <InfoItem label="NOMBRE CORTO" :value="career.shortName" :loading="loading" />
                            <InfoItem label="CLAVE OFICIAL" :value="career.officialCode" :loading="loading" />
                        </div>
                    </div>

                    <div class="space-y-6">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            ORIGEN Y AUTORÍA
                        </h3>

                        <div class="space-y-4">
                            <InfoItem label="INSTITUTO / FACULTAD" :value="career.college?.name" :loading="loading" />
                            <InfoItem label="CREADO POR" :value="career.createdByUser?.name" :loading="loading" />
                            <InfoItem label="FECHA DE REGISTRO" :value="formatSimpleDate(career.createdAt)" :loading="loading" />
                        </div>
                    </div>
                </section>

                <!-- Panel de Acciones -->
                <section
                    v-if="canValidate"
                    class="mt-8 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200"
                >
                    <div class="flex flex-col items-center text-center space-y-4  uppercase">
                        <div class="space-y-1">
                            <h4 class="text-sm font-semibold text-slate-800">¿Deseas validar esta carrera profesional?</h4>
                            <p class="text-xs text-slate-500 max-w-sm">
                                Una vez aprobada, la carrera estará disponible para su uso en el sistema. Si se rechaza, el usuario creador deberá corregir las observaciones.
                            </p>
                        </div>

                        <div class="flex items-center gap-3">
                            <button
                                class="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                                :disabled="loading"
                                @click="approve"
                            >
                                APROBAR CARRERA
                            </button>

                            <button
                                class="px-6 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm font-semibold hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                                :disabled="loading"
                                @click="reject"
                            >
                                RECHAZAR
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Mensaje de estado finalizado -->
                <section v-else class="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100 text-center uppercase">
                    <p class="text-xs text-slate-400 italic">
                        Esta carrera ya se encuentra en estado <span class="font-bold text-slate-600">{{ statusLabel }}</span>.
                        No se requieren más acciones de validación.
                    </p>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CareerType } from '@/modules/superadmin/types/career.type'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const career = ref<CareerType>({} as CareerType)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.careers.byId(route.params.id)
        )
        career.value = data
    } finally {
        setTimeout(() => { loading.value = false }, 300)
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
        case ApprovalStatusEnum.APPROVED: return 'Aprobada'
        case ApprovalStatusEnum.REJECTED: return 'Rechazada'
        case ApprovalStatusEnum.PENDING: return 'Pendiente de Revisión'
        default: return 'Borrador'
    }
})

const statusBarClass = computed(() => {
    switch (career.value.approvalStatus) {
        case ApprovalStatusEnum.APPROVED:
            return 'bg-emerald-50 border-emerald-100 text-emerald-700'
        case ApprovalStatusEnum.REJECTED:
            return 'bg-red-50 border-red-100 text-red-700'
        case ApprovalStatusEnum.PENDING:
            return 'bg-amber-50 border-amber-100 text-amber-700'
        default:
            return 'bg-slate-50 border-slate-200 text-slate-600'
    }
})

function formatSimpleDate(dateString?: string | null) {
    if (!dateString) return null
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString))
}

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goBack() { router.back() }

function goToEdit() {
    router.push({
        name: 'superadmin.careers.edit',
        params: { id: career.value.id },
    })
}

async function approve() {
    loading.value = true
    try {
        await api.post(API.SUPERADMIN_API.careers.approve(career.value.id))
        await fetchData()
        router.push({
            name: 'superadmin.careers',
        })
    } catch (e) {
        loading.value = false
    }
}

async function reject() {
    console.log("Rechazando carrera con ID:", career.value.id)
    loading.value = true
    try {
        await api.post(API.SUPERADMIN_API.careers.rejecte(career.value.id))
        await fetchData()
        router.push({
            name: 'superadmin.careers',
        })
    } catch (e) {
        loading.value = false
    }
}

onMounted(fetchData)
</script>
