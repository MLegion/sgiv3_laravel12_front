<template>
    <div class="space-y-5 max-w-4xl">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                {{ isEdit ? 'Editar programa de estudio' : 'Nuevo programa de estudio' }}
            </h1>
            <button type="button" class="text-sm text-slate-500 hover:text-slate-700" @click="router.back()">
                Volver
            </button>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <form v-else class="space-y-6" @submit.prevent="submit">
            <!-- Datos generales -->
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <h2 class="text-sm font-semibold text-slate-700">Datos generales</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput label="CLAVE" v-model="form.clave" uppercase required :error="errors.clave" />
                    <FormInput label="PLAN DE ESTUDIOS (ID)" type="number" v-model="form.study_plan_id" required :error="errors.study_plan_id" />
                    <FormInput label="ASIGNATURA (ID, opcional)" type="number" v-model="form.subject_id" :error="errors.subject_id" />
                </div>
                <FormInput label="NOMBRE" v-model="form.name" required :error="errors.name" />
                <div class="grid grid-cols-3 gap-4">
                    <FormInput label="SATCA T" type="number" v-model="form.satca_t" />
                    <FormInput label="SATCA P" type="number" v-model="form.satca_p" />
                    <FormInput label="SATCA C" type="number" v-model="form.satca_c" />
                </div>
            </section>

            <!-- Secciones normativas -->
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <h2 class="text-sm font-semibold text-slate-700">Secciones normativas</h2>
                <FormTextarea label="Caracterización" v-model="form.caracterizacion" />
                <FormTextarea label="Intención didáctica" v-model="form.intencion_didactica" />
                <FormTextarea label="Competencia específica (objetivo)" v-model="form.competencia_especifica" />
                <FormTextarea label="Competencias previas" v-model="form.competencias_previas" />
            </section>

            <!-- Temario -->
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-700">Temario</h2>
                    <button type="button" class="text-sm text-blue-600 hover:text-blue-800" @click="addTema">+ Tema</button>
                </div>
                <div v-for="(tema, i) in form.temas" :key="i" class="border border-slate-150 rounded-lg p-3 space-y-2 bg-slate-50">
                    <div class="grid grid-cols-12 gap-3 items-start">
                        <div class="col-span-2">
                            <FormInput label="N°" type="number" v-model="tema.number" />
                        </div>
                        <div class="col-span-9">
                            <FormInput label="Título del tema" v-model="tema.title" />
                        </div>
                        <div class="col-span-1 pt-6">
                            <button type="button" class="text-red-500 hover:text-red-700 text-sm" @click="form.temas.splice(i, 1)">✕</button>
                        </div>
                    </div>
                    <FormTextarea label="Competencia específica del tema" v-model="tema.competenciaEspecifica" :rows="2" />
                </div>
                <p v-if="!form.temas.length" class="text-xs text-slate-400">Sin temas. Agrega al menos uno.</p>
            </section>

            <!-- Fuentes -->
            <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-700">Fuentes de información</h2>
                    <button type="button" class="text-sm text-blue-600 hover:text-blue-800" @click="form.sources.push({ reference: '', type: '' })">+ Fuente</button>
                </div>
                <div v-for="(src, i) in form.sources" :key="i" class="grid grid-cols-12 gap-3 items-start">
                    <div class="col-span-11">
                        <FormInput label="Referencia" v-model="src.reference" />
                    </div>
                    <div class="col-span-1 pt-6">
                        <button type="button" class="text-red-500 hover:text-red-700 text-sm" @click="form.sources.splice(i, 1)">✕</button>
                    </div>
                </div>
            </section>

            <div class="flex items-center gap-3">
                <button
                    type="submit"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                >
                    {{ submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear programa') }}
                </button>
                <button type="button" class="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="router.back()">
                    Cancelar
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormTextarea from '@/app/components/ui/form/FormTextarea.vue'
import { useFormErrors } from '@/app/components/ui/form/useFormErrors'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { errors, setErrors, clearErrors } = useFormErrors()

const programId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => programId.value !== null)

const loading = ref(false)
const submitting = ref(false)

const form = reactive<any>({
    clave: '',
    study_plan_id: '',
    subject_id: '',
    name: '',
    satca_t: '',
    satca_p: '',
    satca_c: '',
    caracterizacion: '',
    intencion_didactica: '',
    competencia_especifica: '',
    competencias_previas: '',
    temas: [] as any[],
    sources: [] as any[],
})

function addTema() {
    form.temas.push({ number: form.temas.length + 1, title: '', competenciaEspecifica: '', subtemas: [], learningActivities: [] })
}

onMounted(async () => {
    if (!isEdit.value) return
    loading.value = true
    try {
        const { data } = await api.get(API.STUDY_PROGRAMS_API.studyPrograms.byId(programId.value!))
        form.clave = data.claveNormalized ?? ''
        form.study_plan_id = data.studyPlanId ?? ''
        form.subject_id = data.subjectId ?? ''
        form.name = data.name ?? ''
        form.satca_t = data.satcaT ?? ''
        form.satca_p = data.satcaP ?? ''
        form.satca_c = data.satcaC ?? ''
        form.caracterizacion = data.caracterizacion ?? ''
        form.intencion_didactica = data.intencionDidactica ?? ''
        form.competencia_especifica = data.competenciaEspecifica ?? ''
        form.competencias_previas = data.competenciasPrevias ?? ''
        form.temas = (data.temas ?? []).map((t: any) => ({
            number: t.number, title: t.title,
            competenciaEspecifica: t.competenciaEspecifica ?? '',
            subtemas: t.subtemas ?? [], learningActivities: t.learningActivities ?? [],
        }))
        form.sources = (data.sources ?? []).map((s: any) => ({ reference: s.reference, type: s.type ?? '' }))
    } finally {
        loading.value = false
    }
})

async function submit() {
    submitting.value = true
    clearErrors()
    const payload = {
        clave: form.clave,
        study_plan_id: form.study_plan_id ? Number(form.study_plan_id) : null,
        subject_id: form.subject_id ? Number(form.subject_id) : null,
        name: form.name,
        satca_t: form.satca_t !== '' ? Number(form.satca_t) : null,
        satca_p: form.satca_p !== '' ? Number(form.satca_p) : null,
        satca_c: form.satca_c !== '' ? Number(form.satca_c) : null,
        caracterizacion: form.caracterizacion || null,
        intencion_didactica: form.intencion_didactica || null,
        competencia_especifica: form.competencia_especifica || null,
        competencias_previas: form.competencias_previas || null,
        temas: form.temas.map((t: any, i: number) => ({
            number: t.number ? Number(t.number) : i + 1,
            title: t.title,
            competenciaEspecifica: t.competenciaEspecifica || null,
            subtemas: t.subtemas ?? [],
            learningActivities: t.learningActivities ?? [],
        })),
        sources: form.sources.map((s: any) => ({ reference: s.reference, type: s.type || null })),
    }

    try {
        if (isEdit.value) {
            await api.put(API.STUDY_PROGRAMS_API.studyPrograms.update(programId.value!), payload)
        } else {
            await api.post(API.STUDY_PROGRAMS_API.studyPrograms.create, payload)
        }
        router.push({ name: 'study-programs.index' })
    } catch (e: any) {
        if (e?.response?.status === 422) {
            setErrors(e.response.data.errors ?? {})
        }
    } finally {
        submitting.value = false
    }
}
</script>
