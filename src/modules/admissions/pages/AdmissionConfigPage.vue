<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">CONFIGURACIÓN DE ADMISIÓN</h1>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PERÍODO DE ADMISIÓN</h3>

            <p class="text-sm text-slate-500">
                El período configurado aquí se asignará automáticamente a todos los aspirantes que se registren.
                Si no se configura ningún período, el campo quedará vacío.
            </p>

            <FormRemoteSelect
                v-model="form.academic_period_id"
                label="PERÍODO ACADÉMICO"
                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                :search-filters="{}"
                item-label="name"
                item-value="academicPeriodId"
                placeholder="Buscar periodo académico..."
            />
            <p class="text-xs text-slate-400 -mt-2">Puedes seleccionar cualquier período, incluso uno futuro. Los aspirantes se registrarán en el período configurado aquí.</p>

            <!-- Limpiar selección -->
            <div v-if="form.academic_period_id">
                <button
                    type="button"
                    class="text-xs text-red-500 hover:underline"
                    @click="form.academic_period_id = null"
                >
                    Quitar período configurado
                </button>
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
            <p v-if="success" class="text-sm text-green-600">Configuración guardada correctamente.</p>

            <div class="flex justify-end pt-4 border-t">
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const loading    = ref(true)
const submitting = ref(false)
const error      = ref<string | null>(null)
const success    = ref(false)

const form = ref<{ academic_period_id: number | null }>({ academic_period_id: null })

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.config.get)
        form.value.academic_period_id = data?.academicPeriodId ?? null
    } finally {
        loading.value = false
    }
}

async function submit() {
    error.value   = null
    success.value = false
    submitting.value = true
    try {
        await api.put(API.ADMISSIONS_API.config.update, {
            academic_period_id: form.value.academic_period_id || null,
        })
        success.value = true
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
