<template>
    <div class="max-w-4xl space-y-6">
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
            <!-- ═════ Info general ═════ -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-slate-400 uppercase">Nombre</p>
                        <p class="text-sm font-medium text-slate-800">{{ dao.name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 uppercase">Tipo</p>
                        <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="typeClass(daoType)">
                            {{ typeLabel(daoType) }}
                        </span>
                        <span
                            v-if="daoType === 1 && hasQueryStructure"
                            class="ml-2 px-2 py-1 text-[10px] font-black uppercase rounded bg-blue-100 text-blue-700"
                        >
                            ✦ VISUAL
                        </span>
                        <span
                            v-else-if="daoType === 1"
                            class="ml-2 px-2 py-1 text-[10px] font-black uppercase rounded bg-purple-100 text-purple-700"
                        >
                            ⟨/⟩ SQL AVANZADO
                        </span>
                    </div>
                    <div class="col-span-2" v-if="daoDescription">
                        <p class="text-xs text-slate-400 uppercase">Descripción</p>
                        <p class="text-sm text-slate-700">{{ daoDescription }}</p>
                    </div>
                </div>

                <div class="space-y-1">
                    <p class="text-xs text-slate-400 uppercase">{{ dataSourceLabel }}</p>
                    <pre
                        class="bg-slate-900 text-green-400 border border-slate-800 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap"
                    >{{ daoDataSource || '-- (sin consulta)' }}</pre>
                </div>
            </div>

            <!-- ═════ Parámetros declarados ═════ -->
            <div v-if="daoParameters.length > 0" class="bg-white border rounded-xl shadow-sm p-6 space-y-3">
                <h2 class="text-sm font-semibold text-slate-700 uppercase">Parámetros declarados ({{ daoParameters.length }})</h2>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b-2 border-slate-300">
                                <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase">Nombre</th>
                                <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase">Origen</th>
                                <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase">Key</th>
                                <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase">Tipo</th>
                                <th class="px-3 py-2 text-center text-[10px] font-black text-slate-600 uppercase">Req.</th>
                                <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase">Default</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in daoParameters" :key="'p-' + p.name" class="border-b border-slate-100">
                                <td class="px-3 py-2 font-mono font-bold text-slate-700">:{{ p.name }}</td>
                                <td class="px-3 py-2">
                                    <span class="px-2 py-0.5 text-[9px] font-black uppercase rounded" :class="sourceTypeClass(p.source_type)">
                                        {{ p.source_type }}
                                    </span>
                                </td>
                                <td class="px-3 py-2 font-mono text-slate-600">{{ p.source_key || '—' }}</td>
                                <td class="px-3 py-2 font-mono text-slate-600 uppercase">{{ p.data_type }}</td>
                                <td class="px-3 py-2 text-center">
                                    <span v-if="p.is_required" class="text-green-600 font-bold">✓</span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                                <td class="px-3 py-2 font-mono text-slate-500">{{ p.default_value ?? '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- ═════ Probar ejecución ═════ -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <h2 class="text-sm font-semibold text-slate-700 uppercase">Probar ejecución</h2>
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="text-[10px] font-bold uppercase px-2 py-1 rounded border transition"
                            :class="inputMode === 'form' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-300'"
                            @click="inputMode = 'form'"
                        >
                            FORMULARIO
                        </button>
                        <button
                            type="button"
                            class="text-[10px] font-bold uppercase px-2 py-1 rounded border transition"
                            :class="inputMode === 'json' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-300'"
                            @click="switchToJsonMode"
                        >
                            JSON
                        </button>
                    </div>
                </div>

                <!-- ── Modo FORMULARIO: un input por cada parámetro request ── -->
                <div v-if="daoType === 1 && inputMode === 'form'" class="space-y-2">
                    <template v-if="requestParams.length > 0">
                        <p class="text-[11px] text-slate-500">
                            Completa los valores de los parámetros <strong>request</strong>. Los <strong>session</strong> y <strong>fixed</strong> se resuelven automáticamente.
                        </p>
                        <div class="space-y-2">
                            <div
                                v-for="p in requestParams"
                                :key="'in-' + p.name"
                                class="flex items-center gap-2 p-2 border border-sky-200 rounded bg-sky-50/50"
                            >
                                <label class="text-[11px] font-mono font-bold text-slate-700 w-36 truncate flex items-center gap-1">
                                    :{{ p.name }}
                                    <span v-if="p.is_required" class="text-red-500">*</span>
                                </label>
                                <input
                                    :value="paramValues[p.name] ?? ''"
                                    :type="inputTypeForDataType(p.data_type)"
                                    :placeholder="p.default_value ?? p.data_type"
                                    class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                    @input="paramValues[p.name] = ($event.target as HTMLInputElement).value"
                                />
                                <span class="text-[9px] uppercase font-bold text-slate-400 w-14 text-right">{{ p.data_type }}</span>
                            </div>
                        </div>
                    </template>
                    <div v-else class="p-3 text-center text-[11px] text-slate-400 italic border border-dashed border-slate-200 rounded">
                        Este DAO no requiere parámetros del usuario. Presiona EJECUTAR para correr directo.
                    </div>
                </div>

                <!-- ── Modo JSON: textarea avanzado ── -->
                <div v-if="daoType === 1 && inputMode === 'json'" class="space-y-1">
                    <p class="text-[11px] text-slate-500">
                        Pega u edita el JSON directamente. Útil para copiar/pegar entre reportes.
                    </p>
                    <textarea
                        v-model="testParamsJson"
                        rows="6"
                        class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="{}"
                    />
                </div>

                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-bold rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 uppercase"
                        :disabled="executing"
                        @click="execute"
                    >
                        {{ executing ? 'EJECUTANDO...' : '▶ EJECUTAR' }}
                    </button>
                    <button
                        v-if="inputMode === 'form' && requestParams.length > 0"
                        type="button"
                        class="px-3 py-2 text-[11px] font-bold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 uppercase"
                        @click="resetParamValues"
                    >
                        LIMPIAR VALORES
                    </button>
                </div>

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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DaoType } from '@/modules/reports/types/dao.type'
import type { DaoParameter, ParameterSourceType, ParameterDataType } from '@/modules/reports/types/queryBuilder.type'

const route  = useRoute()
const router = useRouter()
const loading = ref(true)
// El backend devuelve campos en camelCase (Entity::toArray) pero también pueden venir
// en snake_case según la ruta. Manejamos ambos con los computed de abajo.
const dao = ref<any>(null)

const executing    = ref(false)
const executeError = ref<string | null>(null)
const result       = ref<any | null>(null)

// ── Estado del probador: modo form (default) o JSON ────
type InputMode = 'form' | 'json'
const inputMode = ref<InputMode>('form')
const paramValues = reactive<Record<string, string>>({})
const testParamsJson = ref('{}')

// ── Campos tolerantes a camelCase / snake_case ─────
const daoDataSource = computed<string>(() => dao.value?.dataSource ?? dao.value?.data_source ?? '')
const daoDescription = computed<string | null>(() => dao.value?.description ?? null)
const daoType = computed<DaoType>(() => (dao.value?.type ?? 1) as DaoType)
const hasQueryStructure = computed(() => {
    const qs = dao.value?.queryStructure ?? dao.value?.query_structure
    return !!(qs && qs.from?.table)
})
const daoParameters = computed<DaoParameter[]>(() => {
    const raw = dao.value?.parameters ?? []
    return raw.map((p: any): DaoParameter => ({
        id:            p.id,
        name:          p.name,
        source_type:   (p.sourceType ?? p.source_type) as ParameterSourceType,
        source_key:    p.sourceKey ?? p.source_key ?? null,
        data_type:     p.dataType ?? p.data_type ?? 'string',
        default_value: p.defaultValue ?? p.default_value ?? null,
        is_required:   p.isRequired ?? p.is_required ?? true,
        position:      p.position ?? 0,
    }))
})

// Solo los parámetros tipo 'request' necesitan input del usuario
const requestParams = computed(() => daoParameters.value.filter(p => p.source_type === 'request'))

// Cuando llegan los parámetros del DAO, inicializar paramValues con null/vacío
watch(requestParams, (params) => {
    // Limpiar y repoblar con defaults
    for (const key of Object.keys(paramValues)) delete paramValues[key]
    for (const p of params) {
        paramValues[p.name] = p.default_value ?? ''
    }
}, { immediate: true })

function resetParamValues() {
    for (const p of requestParams.value) {
        paramValues[p.name] = p.default_value ?? ''
    }
}

// Al cambiar a modo JSON, serializar los valores actuales del formulario
function switchToJsonMode() {
    if (inputMode.value === 'json') return
    try {
        const obj = buildRequestParamsObject()
        testParamsJson.value = JSON.stringify(obj, null, 2)
    } catch {
        testParamsJson.value = '{}'
    }
    inputMode.value = 'json'
}

// Construye el objeto de parámetros a enviar desde el formulario, casteando tipos
function buildRequestParamsObject(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const p of requestParams.value) {
        const raw = paramValues[p.name] ?? ''
        if (raw === '' || raw === null || raw === undefined) {
            out[p.name] = null
            continue
        }
        out[p.name] = castValue(raw, p.data_type)
    }
    return out
}

function castValue(raw: string, dt: ParameterDataType): unknown {
    switch (dt) {
        case 'int':   return parseInt(raw, 10)
        case 'float': return parseFloat(raw)
        case 'bool':  return raw === 'true' || raw === '1'
        default:      return raw
    }
}

function inputTypeForDataType(dt: ParameterDataType): string {
    switch (dt) {
        case 'int':
        case 'float':    return 'number'
        case 'date':     return 'date'
        case 'datetime': return 'datetime-local'
        default:         return 'text'
    }
}

const resultCount = computed(() => {
    if (!result.value) return 0
    return Array.isArray(result.value) ? result.value.length : 1
})

const dataSourceLabel = computed(() => ({
    1: 'CONSULTA SQL',
    2: 'CONFIGURACIÓN HTTP',
    3: 'DATOS JSON',
}[daoType.value]))

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
        // Construir params según el modo activo
        let params: Record<string, unknown> = {}
        if (inputMode.value === 'form') {
            params = buildRequestParamsObject()
        } else {
            const raw = testParamsJson.value.trim()
            if (raw) {
                try {
                    params = JSON.parse(raw)
                } catch (parseErr) {
                    throw new Error('JSON inválido en la caja de parámetros.')
                }
            }
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

function sourceTypeClass(st: ParameterSourceType): string {
    return {
        session: 'bg-emerald-100 text-emerald-700',
        request: 'bg-sky-100 text-sky-700',
        fixed:   'bg-slate-200 text-slate-700',
    }[st] ?? 'bg-slate-100 text-slate-500'
}

onMounted(fetchDao)
</script>
