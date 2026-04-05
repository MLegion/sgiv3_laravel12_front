<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Nuevo Reporte</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Panel lateral: metadatos + DAOs -->
            <div class="space-y-4">
                <div class="bg-white border rounded-xl shadow-sm p-5 space-y-4 relative">
                    <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <h2 class="text-sm font-semibold text-slate-600 uppercase">Información general</h2>

                    <FormInput label="NOMBRE" v-model="form.name" required />
                    <FormInput label="CÓDIGO" v-model="form.code" />
                    <FormInput label="DESCRIPCIÓN" v-model="form.description" />
                    <FormSwitch label="ES PLANTILLA" v-model="form.is_template" />
                    <FormSwitch label="ACTIVO" v-model="form.status" />
                </div>

                <!-- DAOs vinculados -->
                <div class="bg-white border rounded-xl shadow-sm p-5 space-y-3">
                    <h2 class="text-sm font-semibold text-slate-600 uppercase">DAOs vinculados</h2>
                    <p class="text-xs text-slate-400">Asocia DAOs al reporte. Cada DAO se referencia en el template por su <em>var_name</em>.</p>

                    <div v-for="(item, idx) in form.daos" :key="idx" class="flex gap-2 items-start">
                        <div class="flex-1 space-y-1">
                            <select v-model="item.dao_id"
                                class="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option :value="null" disabled>— seleccionar DAO —</option>
                                <option v-for="dao in availableDaos" :key="dao.id" :value="dao.id">
                                    {{ dao.name }}
                                </option>
                            </select>
                            <input v-model="item.var_name" type="text" placeholder="var_name (ej: alumnos)"
                                class="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <button type="button" class="mt-1 p-1.5 text-red-400 hover:text-red-600" @click="removeDao(idx)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <button type="button"
                        class="w-full py-1.5 text-xs border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600"
                        @click="addDao">
                        + AGREGAR DAO
                    </button>
                </div>

                <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>

                <button type="button"
                    class="w-full py-2.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
                    :disabled="submitting"
                    @click="submit">
                    GUARDAR REPORTE
                </button>
            </div>

            <!-- Editor principal -->
            <div class="xl:col-span-2">
                <ReportEditor v-model="form.structure" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import ReportEditor from '@/modules/reports/components/ReportEditor.vue'
import { EMPTY_STRUCTURE } from '@/modules/reports/types/report.type'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const availableDaos = ref<DataAccessObject[]>([])

const form = reactive({
    name:        '',
    code:        '',
    description: '',
    is_template: false,
    status:      true,
    structure:   JSON.stringify(EMPTY_STRUCTURE),
    daos:        [] as Array<{ dao_id: number | null; var_name: string }>,
})

async function loadDaos() {
    const { data } = await api.get(API.REPORTS_API.daos.list + '?per_page=200')
    availableDaos.value = data.data ?? data
}

function addDao() {
    form.daos.push({ dao_id: null, var_name: '' })
}

function removeDao(idx: number) {
    form.daos.splice(idx, 1)
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const payload = {
            name:        form.name,
            code:        form.code || null,
            description: form.description || null,
            is_template: form.is_template,
            status:      form.status,
            structure:   form.structure || JSON.stringify(EMPTY_STRUCTURE),
            daos: form.daos
                .filter(d => d.dao_id && d.var_name)
                .map(d => ({ dao_id: d.dao_id, var_name: d.var_name })),
        }
        const { data } = await api.post(API.REPORTS_API.reports.create, payload)
        router.push({ name: 'reports.reports.edit', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadDaos)
</script>
