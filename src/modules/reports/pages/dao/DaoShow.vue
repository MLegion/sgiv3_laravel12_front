<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Detalle DAO</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-amber-50 hover:border-amber-300 text-amber-700"
                    @click="router.push({ name: 'reports.daos.edit', params: { id: route.params.id } })">
                    EDITAR
                </button>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400">Cargando...</div>

        <template v-else-if="dao">
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-slate-400 uppercase">Nombre</p>
                        <p class="text-sm font-medium text-slate-800">{{ dao.name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 uppercase">Tipo</p>
                        <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="typeClass(dao.type)">
                            {{ typeLabel(dao.type) }}
                        </span>
                    </div>
                    <div class="col-span-2" v-if="dao.description">
                        <p class="text-xs text-slate-400 uppercase">Descripción</p>
                        <p class="text-sm text-slate-700">{{ dao.description }}</p>
                    </div>
                </div>

                <div class="space-y-1">
                    <p class="text-xs text-slate-400 uppercase">{{ dataSourceLabel }}</p>
                    <pre class="bg-slate-50 border rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{{ dao.data_source }}</pre>
                </div>
            </div>

            <!-- Probar ejecución -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <h2 class="text-sm font-semibold text-slate-700 uppercase">Probar ejecución</h2>

                <div class="space-y-1" v-if="dao.type === 1">
                    <label class="text-xs font-medium text-slate-600">PARÁMETROS (JSON)</label>
                    <p class="text-xs text-slate-400">Ej: {"periodo_id": 1} — los parámetros se inyectan en el SQL como :nombre_param</p>
                    <textarea v-model="testParams" rows="3"
                        class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="{}" />
                </div>

                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
                    :disabled="executing"
                    @click="execute"
                >
                    {{ executing ? 'EJECUTANDO...' : 'EJECUTAR' }}
                </button>

                <div v-if="executeError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {{ executeError }}
                </div>

                <div v-if="result !== null">
                    <p class="text-xs text-slate-400 uppercase mb-1">Resultado ({{ resultCount }} registro(s))</p>
                    <pre class="bg-slate-50 border rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap">{{ JSON.stringify(result, null, 2) }}</pre>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DataAccessObject, DaoType } from '@/modules/reports/types/dao.type'

const route  = useRoute()
const router = useRouter()
const loading = ref(true)
const dao = ref<DataAccessObject | null>(null)

const executing    = ref(false)
const executeError = ref<string | null>(null)
const result       = ref<any | null>(null)
const testParams   = ref('{}')

const resultCount = computed(() => {
    if (!result.value) return 0
    return Array.isArray(result.value) ? result.value.length : 1
})

const dataSourceLabel = computed(() => ({
    1: 'CONSULTA SQL', 2: 'CONFIGURACIÓN HTTP', 3: 'DATOS JSON',
}[dao.value?.type ?? 1]))

async function fetchDao() {
    loading.value = true
    try {
        const { data } = await api.get(API.REPORTS_API.daos.byId(route.params.id as string))
        dao.value = data
    } finally {
        loading.value = false
    }
}

async function execute() {
    executeError.value = null
    result.value = null
    executing.value = true
    try {
        let params = {}
        if (testParams.value.trim()) {
            params = JSON.parse(testParams.value)
        }
        const { data } = await api.post(API.REPORTS_API.daos.execute(route.params.id as string), { params })
        result.value = data.data
    } catch (e: any) {
        executeError.value = e?.response?.data?.error ?? e?.message ?? 'Error al ejecutar.'
    } finally {
        executing.value = false
    }
}

function typeLabel(type: DaoType): string {
    return { 1: 'SQL', 2: 'REQUEST', 3: 'JSON' }[type] ?? '?'
}

function typeClass(type: DaoType): string {
    return {
        1: 'bg-blue-100 text-blue-700',
        2: 'bg-purple-100 text-purple-700',
        3: 'bg-orange-100 text-orange-700',
    }[type] ?? 'bg-slate-100 text-slate-700'
}

onMounted(fetchDao)
</script>
