<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight">
                DETALLES - CARRERA PROFESIONAL
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                    :disabled="loading"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8 relative overflow-hidden">

            <!-- Header de Carrera -->
            <section class="flex items-center gap-6">
                <div class="flex-1 space-y-2">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-24" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ career.name || '—' }}
                        </h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ career.id }}</span>
                            <span
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                :class="career.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'"
                            >
                                {{ career.isActive ? 'Activa' : 'Inactiva' }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Datos Generales -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
                    INFORMACIÓN GENERAL
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem
                        label="NOMBRE DE LA CARRERA"
                        :value="career.name"
                        :loading="loading"
                    />

                    <InfoItem
                        label="SIGLAS / NOMBRE CORTO"
                        :value="career.shortName"
                        :loading="loading"
                    />
                </div>
            </section>

            <!-- Auditoría / Fechas -->
            <section class="pt-6 border-t border-slate-50">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem
                        label="REGISTRADO EL"
                        :value="formatSimpleDate(career.createdAt)"
                        :loading="loading"
                    />

                    <InfoItem
                        label="ÚLTIMA ACTUALIZACIÓN"
                        :value="formatSimpleDate(career.updatedAt)"
                        :loading="loading"
                    />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CareerType } from '@/modules/superadmin/types/career.type'

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
    } catch (e) {
        console.error("Error al obtener carrera", e)
    } finally {
        setTimeout(() => { loading.value = false }, 400)
    }
}

function formatSimpleDate(dateString?: string | null) {
    if (!dateString) return null
    try {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date)
    } catch (e) {
        return 'Fecha no válida'
    }
}

function goBack() { router.back() }

function goToEdit() {
    router.push({
        name: 'superadmin.careers.edit',
        params: { id: career.value.id },
    })
}

onMounted(fetchData)
</script>
