<template>
    <div class="space-y-4 max-w-3xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Módulos del sistema</h1>
            <p class="text-sm text-slate-500">
                Activa o desactiva módulos para tu colegio. Al desactivar uno, sus menús
                desaparecen y sus funciones dejan de operar. Los módulos esenciales
                (autenticación, permisos, usuarios…) no se listan porque no se pueden apagar.
            </p>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>

        <div v-else class="bg-white border rounded-xl shadow-sm divide-y">
            <div v-for="m in modules" :key="m.key" class="flex items-center justify-between gap-4 px-4 py-3">
                <div class="min-w-0">
                    <div class="font-semibold text-slate-800">{{ m.label }}</div>
                    <div class="text-xs text-slate-500">{{ m.description }}</div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                          :class="m.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">
                        {{ m.enabled ? 'Activo' : 'Inactivo' }}
                    </span>
                    <!-- Interruptor -->
                    <button type="button" role="switch" :aria-checked="m.enabled"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                            :class="[m.enabled ? 'bg-blue-600' : 'bg-slate-300', busyKey === m.key ? 'opacity-50 pointer-events-none' : '']"
                            @click="toggle(m)">
                        <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                              :class="m.enabled ? 'translate-x-5' : 'translate-x-1'" />
                    </button>
                </div>
            </div>

            <div v-if="modules.length === 0" class="px-4 py-8 text-center text-slate-400">
                No hay módulos configurables.
            </div>
        </div>

        <p class="text-xs text-slate-400">
            Nota: algunos módulos dependen de otros (p. ej. Servicios Escolares provee los
            alumnos que usan varios módulos). Desactívalos con cuidado.
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

interface ModuleRow { key: string; label: string; description: string; enabled: boolean }

const M = API.MODULES_API
const toast = useToast()

const loading = ref(true)
const busyKey = ref<string | null>(null)
const modules = ref<ModuleRow[]>([])

onMounted(load)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(M.list)
        modules.value = data.modules ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar los módulos.')
    } finally { loading.value = false }
}

async function toggle(m: ModuleRow) {
    const next = !m.enabled
    busyKey.value = m.key
    try {
        const { data } = await api.post(M.toggle, { key: m.key, enabled: next })
        modules.value = data.modules ?? modules.value
        toast.success(`Módulo "${m.label}" ${next ? 'activado' : 'desactivado'}.`)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cambiar el módulo.')
    } finally { busyKey.value = null }
}
</script>
