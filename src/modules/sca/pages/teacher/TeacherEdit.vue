<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Editar Docente</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div v-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {{ loadError }}
        </div>

        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="loading || submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">{{ loading ? 'CARGANDO...' : 'GUARDANDO...' }}</span>
            </div>

            <div v-if="errors.length" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1">
                <p v-for="err in errors" :key="err">{{ err }}</p>
            </div>

            <!-- Banner del tipo -->
            <div class="p-3 rounded-lg border border-dashed" :class="isVacancy ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'">
                <p class="text-xs font-bold uppercase tracking-wider" :class="isVacancy ? 'text-amber-700' : 'text-slate-600'">
                    {{ isVacancy ? 'DOCENTE VACANTE' : 'DOCENTE CON EMPLEADO' }}
                </p>
            </div>

            <form class="space-y-5" @submit.prevent="submit">
                <!-- Modo Empleado: read-only -->
                <div v-if="!isVacancy">
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">EMPLEADO</label>
                    <div class="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600">
                        {{ employeeName }}
                    </div>
                </div>

                <!-- Modo Vacante: editable -->
                <template v-else>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">NOMBRE DE LA VACANTE <span class="text-red-500">*</span></label>
                        <input
                            :value="form.name"
                            type="text"
                            maxlength="255"
                            class="w-full border rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                            @input="onNameInput"
                        />
                    </div>

                    <FormRemoteSelect
                        label="CARRERA"
                        v-model="form.careerId"
                        :endpoint="API.SUPERADMIN_API.careers.list"
                        :endpoint-by-id="API.SUPERADMIN_API.careers.byId"
                        item-label="name"
                        item-value="id"
                        placeholder="BUSCAR CARRERA..."
                        uppercase
                        required
                    />
                </template>

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
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting || loading">GUARDAR</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { Teacher } from '@/modules/sca/types/teacher.type'
import { teacherFullName } from '@/modules/sca/types/teacher.type'

const router    = useRouter()
const route     = useRoute()
const id        = route.params.id as string
const loading   = ref(true)
const submitting = ref(false)
const errors    = ref<string[]>([])
const loadError = ref('')

const form = reactive({
    employeeId: null as number | null,
    name:       '' as string | null,
    careerId:   null as number | null,
    customId:   null as string | null,
    status:     true,
})

const isVacancy = ref(false)
const employeeName = ref('')

onMounted(async () => {
    try {
        const res = await api.get(API.SCA_API.teachers.byId(id))
        const t: Teacher = res.data
        form.employeeId = t.employeeId
        form.name       = t.name
        form.careerId   = t.careerId
        form.customId   = t.customId
        form.status     = t.status
        isVacancy.value = t.isVacancy
        employeeName.value = teacherFullName(t)
    } catch {
        loadError.value = 'No se pudo cargar el docente.'
    } finally {
        loading.value = false
    }
})

function onNameInput(e: Event) {
    form.name = (e.target as HTMLInputElement).value.toUpperCase()
}

async function submit() {
    errors.value = []
    submitting.value = true
    try {
        const payload: any = {
            is_vacancy: isVacancy.value,
            custom_id:  form.customId || null,
            status:     form.status,
        }
        if (isVacancy.value) {
            payload.employee_id = null
            payload.name        = form.name
            payload.career_id   = form.careerId
        } else {
            payload.employee_id = form.employeeId
            payload.name        = null
            payload.career_id   = null
        }
        await api.put(API.SCA_API.teachers.update(id), payload)
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
