<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración del College</h1>
            <p class="text-sm text-slate-500 mt-1">
                Configura los módulos que admiten personalización por college. Si un módulo no aparece, no tiene
                configuración dinámica o no está habilitado.
            </p>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Cargando módulos configurables…
        </div>

        <div v-else-if="schemas.length === 0" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            No hay módulos con configuración disponibles.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <router-link
                v-for="s in schemas" :key="s.app_id"
                :to="{ name: 'appconfig.edit', params: { appId: s.app_id } }"
                class="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <h2 class="text-sm font-black uppercase tracking-wider text-slate-800">{{ s.label }}</h2>
                        <p class="text-[10px] text-slate-400 font-mono mt-0.5">{{ s.app_id }}</p>
                    </div>
                    <span class="text-lg" v-if="s.icon">{{ s.icon }}</span>
                </div>
                <p v-if="s.description" class="text-xs text-slate-500 mt-3">{{ s.description }}</p>
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ConfigSchemaSummary } from '@/modules/appconfig/types/appconfig.type'

const loading = ref(true)
const schemas = ref<ConfigSchemaSummary[]>([])

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.APPCONFIG_API.schemas, { params: { scope: 'college' } })
        schemas.value = Array.isArray(data) ? data : []
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
