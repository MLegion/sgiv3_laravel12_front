<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight">
                DETALLES - TIPO DE MODALIDAD
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

            <!-- Header de Modalidad -->
            <section class="flex items-center gap-6">
                <div class="flex-1 space-y-2">
                    <template v-if="loading">
                        <Skeleton width="w-1/3" height="h-6" />
                        <Skeleton width="w-20" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ modality.name || '—' }}
                        </h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ modality.id }}</span>
                            <span
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="modality.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'"
                            >
                                {{ modality.isActive ? 'ACTIVO' : 'INACTIVO' }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Datos de Identificación -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
                    IDENTIFICACIÓN
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem
                        label="NOMBRE DE MODALIDAD"
                        :value="modality.name"
                        :loading="loading"
                    />

                    <InfoItem
                        label="CLAVE / NOMBRE CORTO"
                        :value="modality.shortName"
                        :loading="loading"
                    />
                </div>
            </section>

            <!-- Configuración Técnica -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest text-indigo-600">
                    CONFIGURACIÓN JSON
                </h3>

                <div v-if="loading" class="space-y-2">
                    <Skeleton width="w-full" height="h-32" />
                </div>
                <div v-else class="relative group">
                    <div class="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-[10px] bg-white border px-2 py-1 rounded text-slate-400 font-mono">READONLY</span>
                    </div>
                    <pre class="bg-slate-900 border border-slate-800 rounded-xl p-5 text-[13px] overflow-auto text-indigo-300 font-mono leading-relaxed shadow-inner max-h-[400px]">
{{ formattedConfig }}
                    </pre>
                </div>
            </section>

            <!-- Fechas (Sin Hora) -->
            <section class="pt-4 border-t border-slate-50">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem
                        label="FECHA DE CREACIÓN"
                        :value="formatSimpleDate(modality.createdAt)"
                        :loading="loading"
                    />

                    <InfoItem
                        label="ÚLTIMA MODIFICACIÓN"
                        :value="formatSimpleDate(modality.updatedAt)"
                        :loading="loading"
                    />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ModalityType } from '@/modules/superadmin/types/modality-type'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const modality = ref<ModalityType>({} as ModalityType)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.modalityTypes.byId(route.params.id)
        )
        modality.value = data
    } catch (e) {
        console.error("Error al obtener modalidad", e)
    } finally {
        // Un pequeño delay para suavizar la transición del skeleton
        setTimeout(() => { loading.value = false }, 400)
    }
}

const formattedConfig = computed(() => {
    if (!modality.value.config) return '// Sin configuración'
    return JSON.stringify(modality.value.config, null, 4)
})

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
        name: 'superadmin.modalitytypes.edit',
        params: { id: modality.value.id },
    })
}

onMounted(fetchData)
</script>
