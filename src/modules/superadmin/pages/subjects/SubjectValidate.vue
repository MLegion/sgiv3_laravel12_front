<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight uppercase">
                VALIDAR - CARRERA PROFESIONAL
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

            <div v-if="career?.id || loading" class="p-6 space-y-8">
                <!-- Header de la Carrera -->
                <section class="pb-6 border-b">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div class="space-y-2 flex-1">
                            <div v-if="loading" class="h-8 w-3/4 bg-slate-100 animate-pulse rounded-md"></div>
                            <h2 v-else class="text-2xl font-bold text-slate-900 leading-tight">
                                {{ career.name }}
                            </h2>

                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-mono text-xs uppercase">
                                <div v-if="loading" class="h-4 w-48 bg-slate-50 animate-pulse rounded"></div>
                                <template v-else>
                                    <span><b class="text-slate-400">CLAVE:</b> {{ career.officialCode }}</span>
                                    <span v-if="career.shortName">
                                        <b class="text-slate-400">CORTO:</b> {{ career.shortName }}
                                    </span>
                                </template>
                            </div>
                        </div>

                        <div v-if="loading" class="h-6 w-24 bg-slate-100 animate-pulse rounded-full"></div>
                        <span
                            v-else
                            class="px-3 py-1 text-[10px] font-black rounded-full border tracking-widest transition-colors"
                            :class="statusBadgeClass"
                        >
                            {{ statusLabel }}
                        </span>
                    </div>
                </section>

                <!-- Detalles -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div class="space-y-6">
                        <h3 class="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            Asignación Institucional
                        </h3>
                        <div class="space-y-6">
                            <InfoItem label="INSTITUTO / FACULTAD" :value="career.college?.name" :loading="loading" />
                        </div>
                    </div>

                    <div class="space-y-6">
                        <h3 class="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            Gestión
                        </h3>
                        <div class="space-y-6">
                            <div class="flex items-center gap-3">
                                <div v-if="loading" class="w-9 h-9 bg-slate-100 animate-pulse rounded-full"></div>
                                <div v-else class="w-9 h-9 bg-slate-50 border rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                                    {{ career.createdByUser?.name?.charAt(0) || 'U' }}
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] text-slate-400 font-bold uppercase leading-none">Creado por</p>
                                    <div v-if="loading" class="h-3 w-32 bg-slate-100 animate-pulse rounded"></div>
                                    <p v-else class="text-sm font-semibold text-slate-700 leading-none">
                                        {{ career.createdByUser?.name || '—' }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones de Validación -->
                <section class="pt-8 border-t">
                    <div v-if="loading" class="flex gap-3">
                        <div class="h-10 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
                        <div class="h-10 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
                    </div>

                    <div v-else-if="canValidate" class="flex flex-col sm:flex-row gap-3">
                        <button
                            class="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 uppercase tracking-wide"
                            @click="approve"
                        >
                            APROBAR CARRERA
                        </button>

                        <button
                            class="px-6 py-2.5 rounded-lg bg-white border-2 border-red-600 text-red-600 font-bold text-sm hover:bg-red-50 transition-all uppercase tracking-wide"
                            @click="reject"
                        >
                            RECHAZAR
                        </button>
                    </div>

                    <div v-else class="bg-slate-50 border border-dashed rounded-lg p-4 flex items-center gap-3 text-slate-500">
                        <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <span class="text-xs font-medium uppercase tracking-tighter">
                            Esta carrera ya se encuentra en estado <b class="text-slate-700">{{ statusLabel }}</b> y no admite más acciones de validación.
                        </span>
                    </div>
                </section>
            </div>

            <!-- Error State -->
            <div v-else-if="!loading" class="p-20 text-center">
                <p class="text-slate-400 text-sm font-medium">No se pudo cargar la información de la carrera.</p>
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
import type { CareerType } from '@/modules/superadmin/types/career.type'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'
import InfoItem from '@/app/components/ui/InfoItem.vue'

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
        setTimeout(() => { loading.value = false }, 400)
    }
}

const canValidate = computed(() =>
    ![ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.REJECTED]
        .includes(career.value.approvalStatus)
)

const canEdit = computed(() =>
    career.value.approvalStatus !== ApprovalStatusEnum.APPROVED
)

const statusLabel = computed(() => {
    switch (career.value.approvalStatus) {
        case ApprovalStatusEnum.APPROVED: return 'APROBADA'
        case ApprovalStatusEnum.REJECTED: return 'RECHAZADA'
        case ApprovalStatusEnum.PENDING: return 'PENDIENTE'
        default: return 'BORRADOR'
    }
})

const statusBadgeClass = computed(() => {
    switch (career.value.approvalStatus) {
        case ApprovalStatusEnum.APPROVED: return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case ApprovalStatusEnum.REJECTED: return 'bg-red-50 text-red-700 border-red-200'
        case ApprovalStatusEnum.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200'
        default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
})

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
    loading.value = true
    try {
        await api.post(API.SUPERADMIN_API.careers.approve(career.value.id))
        await fetchData()
        router.push({
            name: 'superadmin.subjects',
        })
    } catch (e) {
        loading.value = false
    }
}

async function reject() {
    loading.value = true
    try {
        await api.post(API.SUPERADMIN_API.careers.rejecte(career.value.id))
        await fetchData()
        router.push({
            name: 'superadmin.subjects',
        })
    } catch (e) {
        loading.value = false
    }
}

onMounted(fetchData)
</script>
