<template>
    <div class="space-y-4 max-w-xl mx-auto">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Horas de plaza</h1>
            <p class="text-sm text-slate-500">Captura las horas de plaza del docente por periodo. Es la base del presupuesto de descarga (descarga = plaza − frente a grupo).</p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-4 space-y-4">
            <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name" item-value="id"
                    placeholder="Selecciona un periodo…"
                    @update:model-value="onChange"
                />
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Docente</label>
                <FormRemoteSelect
                    v-model="teacherId"
                    :endpoint="API.SCA_API.teachers.list"
                    :params="{ per_page: 1000 }"
                    :item-label="teacherLabel" item-value="id"
                    :item-searchs="['name']"
                    placeholder="Busca un docente…"
                    @update:model-value="onChange"
                />
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Horas de plaza</label>
                <input v-model.number="hours" type="number" min="0" max="999" step="0.5"
                    class="w-40 border rounded-lg px-3 py-2 text-sm" :disabled="!teacherId || !periodId" />
                <p v-if="loaded && assigned" class="text-xs text-emerald-600 mt-1">Ya había {{ current }} hrs capturadas.</p>
                <p v-else-if="loaded" class="text-xs text-slate-400 mt-1">Sin captura previa para este docente/periodo.</p>
            </div>
            <div class="flex justify-end">
                <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    :disabled="busy || !teacherId || !periodId || hours === null" @click="save">Guardar</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const toast = useToast()
const P = API.MIDOCENCIA_API.plaza

const periodId = ref<number | null>(null)
const teacherId = ref<number | null>(null)
const hours = ref<number | null>(null)
const current = ref<number | null>(null)
const assigned = ref(false)
const loaded = ref(false)
const busy = ref(false)

const teacherLabel = (t: any) => t.displayName ?? t.name ?? `Docente #${t.id}`

async function onChange() {
    loaded.value = false
    assigned.value = false
    current.value = null
    if (!teacherId.value || !periodId.value) return
    try {
        const { data } = await api.get(P.show, { params: { teacher_id: teacherId.value, period_id: periodId.value } })
        assigned.value = !!data.assigned
        current.value = data.hours
        hours.value = data.hours ?? null
        loaded.value = true
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo consultar la plaza.')
    }
}

async function save() {
    busy.value = true
    try {
        await api.post(P.save, { teacher_id: teacherId.value, period_id: periodId.value, hours: hours.value })
        toast.success('Horas de plaza guardadas.')
        await onChange()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar.')
    } finally { busy.value = false }
}
</script>
