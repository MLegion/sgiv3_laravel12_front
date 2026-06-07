<template>
    <div class="space-y-6">
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

        <!-- Secciones por categoría -->
        <section v-for="group in groupedSchemas" :key="group.label" v-else class="space-y-3">
            <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">
                {{ group.label }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <router-link
                    v-for="s in group.items" :key="s.app_id"
                    :to="linkFor(s)"
                    class="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3 min-w-0">
                            <div v-if="s.icon_svg" class="flex-shrink-0" v-html="s.icon_svg"></div>
                            <div class="min-w-0">
                                <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">{{ s.label }}</h3>
                                <p class="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{{ s.app_id }}</p>
                            </div>
                        </div>
                        <span class="text-lg" v-if="s.icon && !s.icon_svg">{{ s.icon }}</span>
                    </div>
                    <p v-if="s.description" class="text-xs text-slate-500 mt-3">{{ s.description }}</p>
                </router-link>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ConfigSchemaSummary } from '@/modules/appconfig/types/appconfig.type'

const loading = ref(true)
const schemas = ref<ConfigSchemaSummary[]>([])

// Orden fijo de categorías; las no listadas caen al final por orden alfabético.
const CATEGORY_ORDER = [
    'Imagen y marca',
    'Admisión',
    'Asesoría y reinscripción',
    'Servicios escolares',
    'Horarios',
    'Evaluación docente',
    'Notificaciones',
    'Acceso y autenticación',
]
const FALLBACK_GROUP = 'Otras'

const groupedSchemas = computed(() => {
    const map = new Map<string, ConfigSchemaSummary[]>()
    for (const s of schemas.value) {
        const g = s.group || FALLBACK_GROUP
        if (!map.has(g)) map.set(g, [])
        map.get(g)!.push(s)
    }

    const rank = (g: string) => {
        const i = CATEGORY_ORDER.indexOf(g)
        return i === -1 ? CATEGORY_ORDER.length + (g === FALLBACK_GROUP ? 1 : 0) : i
    }

    return [...map.entries()]
        .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
        .map(([label, items]) => ({
            label,
            items: [...items].sort((a, b) => a.label.localeCompare(b.label)),
        }))
})

// Si el schema declara una ruta dedicada (p. ej. Imagen del Colegio), se enlaza
// a ella; si no, al editor genérico de AppConfig.
function linkFor(s: ConfigSchemaSummary): RouteLocationRaw {
    if (s.custom_route) return { name: s.custom_route }
    return { name: 'appconfig.edit', params: { appId: s.app_id } }
}

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
