<template>
    <div class="max-w-6xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Nuevo DAO</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <form class="space-y-5" @submit.prevent="submit">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE" v-model="form.name" required />
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">TIPO</label>
                        <select v-model.number="form.type" required
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option :value="1">SQL</option>
                            <option :value="2">REQUEST (HTTP)</option>
                            <option :value="3">JSON estático</option>
                        </select>
                    </div>
                </div>
                <FormInput label="DESCRIPCIÓN" v-model="form.description" />

                <!-- ═════ SQL: Query Builder Visual ═════ -->
                <div v-if="form.type === 1" class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">CONSULTA SQL</label>
                    <p class="text-[10px] text-slate-400">Construye tu consulta visualmente. El SQL se genera automáticamente.</p>
                    <QueryBuilder
                        v-model="form.query_structure"
                        :parameters="form.parameters"
                        :initial-sql="form.data_source"
                        @update:parameters="form.parameters = $event"
                        @update:sql="form.data_source = $event"
                    />
                </div>

                <!-- ═════ REQUEST / JSON: textarea crudo ═════ -->
                <div v-else class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">{{ dataSourceLabel }}</label>
                    <p class="text-xs text-slate-400">{{ dataSourceHint }}</p>
                    <textarea
                        v-model="form.data_source"
                        rows="8"
                        required
                        class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        :placeholder="dataSourcePlaceholder"
                    />
                </div>

                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">GUARDAR</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import QueryBuilder from '@/modules/reports/components/queryBuilder/QueryBuilder.vue'
import type { DaoType, DataAccessObjectPayload } from '@/modules/reports/types/dao.type'
import type { QueryStructure, DaoParameter } from '@/modules/reports/types/queryBuilder.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

function defaultStructure(): QueryStructure {
    return {
        from: { table: '', alias: '' },
        joins: [],
        columns: [],
        where: { conjunction: 'and', conditions: [] },
        groupBy: [],
        orderBy: [],
        limit: null,
    }
}

interface FormState {
    name: string
    description: string
    type: DaoType
    data_source: string
    query_structure: QueryStructure | null
    parameters: DaoParameter[]
}

const form = reactive<FormState>({
    name:            '',
    description:     '',
    type:            1,
    data_source:     '',
    query_structure: defaultStructure(),
    parameters:      [],
})

const dataSourceLabel = computed(() => ({
    1: 'CONSULTA SQL',
    2: 'CONFIGURACIÓN HTTP (JSON)',
    3: 'DATOS JSON ESTÁTICOS',
}[form.type]))

const dataSourceHint = computed(() => ({
    1: 'Solo SELECT. Usa :college_id como parámetro para filtrar por institución.',
    2: 'JSON con campos: url, method (GET|POST), headers (opcional), body (opcional).',
    3: 'Array u objeto JSON que se usará directamente como datos.',
}[form.type]))

const dataSourcePlaceholder = computed(() => ({
    1: 'SELECT id, nombre, carrera FROM alumnos WHERE college_id = :college_id',
    2: '{"url": "https://api.ejemplo.com/datos", "method": "GET", "headers": {"Authorization": "Bearer token"}}',
    3: '[{"nombre": "Juan", "carrera": "Derecho"}, {"nombre": "Ana", "carrera": "Medicina"}]',
}[form.type]))

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const payload: DataAccessObjectPayload = {
            name:        form.name,
            description: form.description || null,
            type:        form.type,
            data_source: form.data_source,
        }

        // Para type=1 SQL: enviar parameters siempre; query_structure solo si modo visual
        // (si es null estamos en modo avanzado y se respeta el data_source tal cual)
        if (form.type === 1) {
            // Descartar filas de parámetros vacías (el usuario agregó una fila y no la llenó)
            payload.parameters = form.parameters.filter(p => p.name && p.name.trim() !== '')
            if (form.query_structure) {
                payload.query_structure = form.query_structure
            }
        }

        const { data } = await api.post(API.REPORTS_API.daos.create, payload)
        router.push({ name: 'reports.daos.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}
</script>
