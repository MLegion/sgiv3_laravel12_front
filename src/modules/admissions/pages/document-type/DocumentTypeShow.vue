<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">DETALLE - TIPO DE DOCUMENTO</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    :disabled="loading"
                    @click="router.push({ name: 'admissions.document-types.edit', params: { id: route.params.id } })"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
            <!-- Identificación -->
            <section class="flex items-start gap-4">
                <div class="flex-1 space-y-1">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-24" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">{{ dt.name }}</h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ dt.id }}</span>
                            <span class="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{{ dt.shortName }}</span>
                            <span class="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{{ dt.code }}</span>
                            <span
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="dt.status ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
                            >
                                {{ dt.status ? 'ACTIVO' : 'INACTIVO' }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Detalles -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">CONFIGURACIÓN</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="DESCRIPCIÓN" :value="dt.description" :loading="loading" />
                    <InfoItem
                        label="FORMATOS PERMITIDOS"
                        :value="dt.acceptsFormats?.join(', ').toUpperCase() ?? 'Todos'"
                        :loading="loading"
                    />
                    <InfoItem
                        label="TAMAÑO MÁXIMO"
                        :value="dt.maxSizeKb ? `${(dt.maxSizeKb / 1024).toFixed(1)} MB (${dt.maxSizeKb} KB)` : 'Sin límite'"
                        :loading="loading"
                    />
                </div>
            </section>

            <!-- Metadatos -->
            <section class="pt-4 border-t">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="CREADO"      :value="formatDate(dt.createdAt)" :loading="loading" />
                    <InfoItem label="ACTUALIZADO" :value="formatDate(dt.updatedAt)" :loading="loading" />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import type { DocumentType } from '@/modules/admissions/types/document-type.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const dt = ref<DocumentType>({} as DocumentType)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.documentTypes.byId(route.params.id as string))
        dt.value = data
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

function formatDate(value?: string | null) {
    if (!value) return null
    try {
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
    } catch { return value }
}

onMounted(fetchData)
</script>
