<template>
    <div class="space-y-5 max-w-4xl">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                {{ isEdit ? 'Editar instrumentación' : 'Nueva instrumentación' }}
            </h1>
            <button type="button" class="text-sm text-slate-500 hover:text-slate-700" @click="router.back()">Volver</button>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <form v-else class="space-y-6" @submit.prevent="submit">
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <h2 class="text-sm font-semibold text-slate-700">Datos</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput label="ASIGNACIÓN (ID)" type="number" v-model="form.teacher_assignment_id" required :error="errors.teacher_assignment_id" :disabled="isEdit" />
                    <FormInput label="PROGRAMA DE ESTUDIO (ID)" type="number" v-model="form.study_program_id" required :error="errors.study_program_id" />
                    <FormInput label="TÍTULO" v-model="form.title" />
                </div>
            </section>

            <!-- Unidades -->
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-700">Unidades (horas y calendarización)</h2>
                    <button type="button" class="text-sm text-blue-600 hover:text-blue-800" @click="addUnit">+ Unidad</button>
                </div>
                <div v-for="(u, i) in form.units" :key="i" class="border border-slate-150 rounded-lg p-3 space-y-2 bg-slate-50">
                    <div class="grid grid-cols-12 gap-3 items-start">
                        <div class="col-span-2"><FormInput label="N°" type="number" v-model="u.number" /></div>
                        <div class="col-span-6"><FormInput label="Título" v-model="u.title" /></div>
                        <div class="col-span-1"><FormInput label="HT" type="number" v-model="u.hoursT" /></div>
                        <div class="col-span-1"><FormInput label="HP" type="number" v-model="u.hoursP" /></div>
                        <div class="col-span-2 pt-6 text-right">
                            <button type="button" class="text-red-500 hover:text-red-700 text-sm" @click="form.units.splice(i, 1)">✕ Unidad</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <FormInput label="Inicio" type="date" v-model="u.startDate" />
                        <FormInput label="Fin" type="date" v-model="u.endDate" />
                    </div>
                    <div class="pl-2 border-l-2 border-slate-200 space-y-1">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-slate-500">Actividades de enseñanza</span>
                            <button type="button" class="text-xs text-blue-600" @click="u.teachingActivities.push({ description: '' })">+ Actividad</button>
                        </div>
                        <div v-for="(a, j) in u.teachingActivities" :key="j" class="flex gap-2 items-center">
                            <input v-model="a.description" class="flex-1 px-2 py-1 text-sm border border-slate-300 rounded" placeholder="Describe la actividad de enseñanza" />
                            <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="u.teachingActivities.splice(j, 1)">✕</button>
                        </div>
                    </div>
                </div>
                <p v-if="!form.units.length" class="text-xs text-slate-400">Sin unidades.</p>
            </section>

            <!-- Matriz de evaluación -->
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-700">Matriz de evaluación</h2>
                    <button type="button" class="text-sm text-blue-600 hover:text-blue-800" @click="addEvalItem">+ Evidencia</button>
                </div>
                <div v-for="(e, i) in form.evaluation_items" :key="i" class="grid grid-cols-12 gap-3 items-start border border-slate-150 rounded-lg p-3 bg-slate-50">
                    <div class="col-span-5"><FormInput label="Evidencia" v-model="e.evidence" /></div>
                    <div class="col-span-2"><FormInput label="% (peso)" type="number" v-model="e.weight" /></div>
                    <div class="col-span-2"><FormInput label="Unidad N°" type="number" v-model="e.unitNumber" /></div>
                    <div class="col-span-2"><FormInput label="Instrumento" v-model="e.instrumentLabel" /></div>
                    <div class="col-span-1 pt-6 text-right">
                        <button type="button" class="text-red-500 hover:text-red-700 text-sm" @click="form.evaluation_items.splice(i, 1)">✕</button>
                    </div>
                </div>
                <p class="text-xs text-slate-400">Total: {{ totalWeight }}%</p>
            </section>

            <div class="flex items-center gap-3">
                <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting">
                    {{ submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear instrumentación') }}
                </button>
                <button type="button" class="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="router.back()">Cancelar</button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import { useFormErrors } from '@/app/components/ui/form/useFormErrors'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { errors, setErrors, clearErrors } = useFormErrors()

const instId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => instId.value !== null)

const loading = ref(false)
const submitting = ref(false)

const form = reactive<any>({
    teacher_assignment_id: (route.query.teacher_assignment_id as string) ?? '',
    study_program_id: '',
    title: '',
    units: [] as any[],
    evaluation_items: [] as any[],
})

const totalWeight = computed(() =>
    form.evaluation_items.reduce((acc: number, e: any) => acc + (Number(e.weight) || 0), 0)
)

function addUnit() {
    form.units.push({ number: form.units.length + 1, title: '', hoursT: 0, hoursP: 0, startDate: '', endDate: '', teachingActivities: [] })
}
function addEvalItem() {
    form.evaluation_items.push({ evidence: '', weight: 0, unitNumber: '', instrumentLabel: '' })
}

onMounted(async () => {
    if (!isEdit.value) return
    loading.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.instrumentations.byId(instId.value!))
        form.teacher_assignment_id = data.teacherAssignmentId ?? ''
        form.study_program_id = data.studyProgramId ?? ''
        form.title = data.title ?? ''
        form.units = (data.units ?? []).map((u: any) => ({
            number: u.number, title: u.title, hoursT: u.hoursT, hoursP: u.hoursP,
            startDate: u.startDate ?? '', endDate: u.endDate ?? '',
            teachingActivities: (u.teachingActivities ?? []).map((a: any) => ({ description: a.description })),
        }))
        form.evaluation_items = (data.evaluationItems ?? []).map((e: any) => ({
            evidence: e.evidence, weight: e.weight, unitNumber: '', instrumentLabel: e.instrumentLabel ?? '',
        }))
    } finally {
        loading.value = false
    }
})

async function submit() {
    submitting.value = true
    clearErrors()
    const payload = {
        teacher_assignment_id: form.teacher_assignment_id ? Number(form.teacher_assignment_id) : null,
        study_program_id: form.study_program_id ? Number(form.study_program_id) : null,
        title: form.title || null,
        units: form.units.map((u: any, i: number) => ({
            number: u.number ? Number(u.number) : i + 1,
            title: u.title,
            hoursT: Number(u.hoursT) || 0,
            hoursP: Number(u.hoursP) || 0,
            startDate: u.startDate || null,
            endDate: u.endDate || null,
            teachingActivities: (u.teachingActivities ?? []).filter((a: any) => a.description),
        })),
        evaluation_items: form.evaluation_items.map((e: any) => ({
            evidence: e.evidence,
            weight: Number(e.weight) || 0,
            unitNumber: e.unitNumber ? Number(e.unitNumber) : null,
            instrumentLabel: e.instrumentLabel || null,
        })),
    }
    try {
        if (isEdit.value) {
            await api.put(API.TEACHING_API.instrumentations.update(instId.value!), payload)
        } else {
            await api.post(API.TEACHING_API.instrumentations.create, payload)
        }
        router.push({ name: 'teaching.planeacion' })
    } catch (e: any) {
        if (e?.response?.status === 422) {
            setErrors(e.response.data.errors ?? {})
        }
    } finally {
        submitting.value = false
    }
}
</script>
