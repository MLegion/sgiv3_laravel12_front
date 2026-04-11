<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Registrar Docente</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <div v-if="errors.length" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1">
                <p v-for="err in errors" :key="err">{{ err }}</p>
            </div>

            <form class="space-y-5" @submit.prevent="submit">
                <FormRemoteSelect
                    label="EMPLEADO"
                    v-model="form.employeeId"
                    :endpoint="API.SHR_API.employee.list"
                    :endpoint-by-id="API.SHR_API.employee.byId"
                    :item-label="employeeLabel"
                    :item-searchs="['names', 'first_surname', 'second_surname']"
                    item-value="id"
                    required
                />

                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">ID EXTERNO <span class="font-normal text-slate-400">(opcional)</span></label>
                    <input
                        v-model="form.customId"
                        type="text"
                        class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. DOC-001"
                    />
                </div>

                <div class="flex items-center gap-3">
                    <button type="button"
                        :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                 form.status ? 'bg-green-500' : 'bg-slate-300']"
                        @click="form.status = !form.status">
                        <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow',
                                       form.status ? 'translate-x-[18px]' : 'translate-x-0.5']" />
                    </button>
                    <span class="text-sm font-medium text-slate-700">{{ form.status ? 'ACTIVO' : 'INACTIVO' }}</span>
                </div>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting">GUARDAR</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const router   = useRouter()
const submitting = ref(false)
const errors   = ref<string[]>([])

const form = reactive({
    employeeId: null as number | null,
    customId:   '' as string | null,
    status:     true,
})

function employeeLabel(emp: any): string {
    return [emp.names, emp.firstSurname, emp.secondSurname].filter(Boolean).join(' ')
}

async function submit() {
    errors.value = []
    submitting.value = true
    try {
        await api.post(API.SCA_API.teachers.create, {
            employee_id: form.employeeId,
            custom_id:   form.customId || null,
            status:      form.status,
        })
        router.push({ name: 'sca.teachers' })
    } catch (e: any) {
        const data = e?.response?.data
        if (data?.errors) {
            errors.value = Object.values(data.errors).flat() as string[]
        } else if (data?.message) {
            errors.value = [data.message]
        } else {
            errors.value = ['Ocurrió un error al guardar.']
        }
    } finally {
        submitting.value = false
    }
}
</script>
