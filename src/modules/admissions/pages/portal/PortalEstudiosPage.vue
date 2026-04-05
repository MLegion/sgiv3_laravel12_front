<template>
    <div class="max-w-2xl space-y-4">
        <PortalEditHeader
            title="ÚLTIMO NIVEL DE ESTUDIO"
            :editing="editing" :submitting="submitting" :has-draft="hasDraft" :save-error="saveError"
            @edit="startEditing" @cancel="cancel" @save="save"
        />
        <PortalRequiredNotice />

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>
        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <template v-if="editing">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <!-- Filtros de estado/municipio -->
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">ESTADO (filtro)</label>
                        <select
                            v-model="filterStateId"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option :value="null">Todos los estados</option>
                            <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">MUNICIPIO (filtro)</label>
                        <select
                            v-model="filterMunicipalityId"
                            :disabled="!filterStateId || loadingMunicipalities"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option :value="null">{{ filterStateId ? (loadingMunicipalities ? 'Cargando...' : 'Todos los municipios') : 'Seleccione un estado' }}</option>
                            <option v-for="m in municipalities" :key="m.id" :value="m.id">{{ m.name }}</option>
                        </select>
                    </div>

                    <!-- Escuela de procedencia (requerida) -->
                    <div class="sm:col-span-2 rounded-xl bg-yellow-50 ring-1 ring-yellow-300 p-2">
                        <FormRemoteSelect
                            v-model="form.origin_school_id"
                            label="ESCUELA DE PROCEDENCIA"
                            :endpoint="API.ADMISSIONS_API.portal.catalogs.originSchools"
                            :endpoint-by-id="API.ADMISSIONS_API.portal.catalogs.originSchoolById"
                            :search-filters="originSchoolFilters"
                            item-label="name"
                            item-value="id"
                            placeholder="Buscar escuela..."
                        />
                    </div>

                    <FormInput label="AÑO DE EGRESO" v-model="form.graduation_year" type="number" min="1950" max="2099" />
                    <FormInput label="PROMEDIO (escala 100)" v-model="form.academic_average" type="number" step="0.01" min="0" max="100" />

                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">ÁREA ACADÉMICA</label>
                        <select v-model="form.academic_area_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase">
                            <option :value="null">NINGUNA</option>
                            <option v-for="a in academicAreas" :key="a.id" :value="a.id">{{ a.name }}</option>
                        </select>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <ReadField label="ESCUELA DE PROCEDENCIA" :value="originSchoolName" highlight class="sm:col-span-2" />
                    <ReadField label="AÑO DE EGRESO" :value="form.graduation_year" />
                    <ReadField label="PROMEDIO" :value="form.academic_average" />
                    <ReadField label="ÁREA ACADÉMICA" :value="academicAreas.find(a => a.id === form.academic_area_id)?.name ?? '—'" />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import PortalEditHeader from './PortalEditHeader.vue'
import PortalRequiredNotice from './PortalRequiredNotice.vue'
import ReadField from './ReadField.vue'

const DRAFT = 'estudios'

const loading              = ref(true)
const editing              = ref(false)
const submitting           = ref(false)
const saveError            = ref<string | null>(null)
const hasDraft             = ref(false)
const loadingMunicipalities = ref(false)
let applicantId: number | null = null

const states         = ref<{ id: number; name: string }[]>([])
const municipalities = ref<{ id: number; name: string }[]>([])
const academicAreas  = ref<{ id: number; name: string }[]>([])

const filterStateId        = ref<number | null>(null)
const filterMunicipalityId = ref<number | null>(null)
const originSchoolName     = ref<string>('—')

const form = reactive({
    origin_school_id: null as number | null,
    graduation_year:  '' as string,
    academic_average: '' as string,
    academic_area_id: null as number | null,
})

const originSchoolFilters = computed(() => {
    const f: Record<string, any> = {}
    if (filterStateId.value)        f.state_id = filterStateId.value
    if (filterMunicipalityId.value) f.municipality_id = filterMunicipalityId.value
    return f
})

function draftKey() { return applicantId ? `portal_${applicantId}_${DRAFT}` : null }

watch(form, () => {
    const k = draftKey()
    if (editing.value && k) { localStorage.setItem(k, JSON.stringify({ ...form })); hasDraft.value = true }
}, { deep: true })

watch(filterStateId, async (newStateId) => {
    filterMunicipalityId.value = null
    municipalities.value = []
    if (!newStateId) return
    loadingMunicipalities.value = true
    try {
        const { data } = await api.get(API.GEO_API.municipalities(newStateId))
        municipalities.value = data
    } finally { loadingMunicipalities.value = false }
})

function mapData(data: any) {
    form.origin_school_id = data.originSchoolId ?? null
    form.graduation_year  = data.graduationYear ? String(data.graduationYear) : ''
    form.academic_average = data.academicAverage ?? ''
    form.academic_area_id = data.academicAreaId ?? null
    // For display name in read mode
    if (data.originSchool?.name) originSchoolName.value = data.originSchool.name
    else if (!data.originSchoolId) originSchoolName.value = '—'
}

async function fetchMe() {
    loading.value = true
    try {
        const [{ data }, statesRes, areasRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.portal.me),
            api.get(API.GEO_API.states),
            api.get(API.ADMISSIONS_API.portal.catalogs.academicAreas),
        ])
        applicantId = data.id
        mapData(data)
        states.value      = statesRes.data
        academicAreas.value = Array.isArray(areasRes.data) ? areasRes.data : []
        const draft = localStorage.getItem(`portal_${data.id}_${DRAFT}`)
        if (draft) { Object.assign(form, JSON.parse(draft)); hasDraft.value = true }
    } finally { loading.value = false }
}

function startEditing() { saveError.value = null; editing.value = true }

function cancel() {
    editing.value = false; saveError.value = null; fetchMe()
    const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
}

async function save() {
    saveError.value = null; submitting.value = true
    try {
        await api.put(API.ADMISSIONS_API.portal.update, {
            origin_school_id: form.origin_school_id || null,
            graduation_year:  form.graduation_year !== '' ? Number(form.graduation_year) : null,
            academic_average: form.academic_average !== '' ? form.academic_average : null,
            academic_area_id: form.academic_area_id || null,
        })
        editing.value = false
        const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
        // Refresh to get updated originSchool name
        await fetchMe()
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { submitting.value = false }
}

onMounted(fetchMe)
</script>
