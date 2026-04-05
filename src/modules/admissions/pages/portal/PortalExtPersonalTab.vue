<template>
    <div class="p-6 space-y-5">
        <template v-if="editing">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="RFC" v-model="form.rfc" uppercase :maxlength="13" />
                <FormInput label="FECHA DE NACIMIENTO" v-model="form.birth_date" type="date" />
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">ESTADO CIVIL</label>
                    <select v-model="form.marital_status" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar...</option>
                        <option value="soltero">Soltero/a</option>
                        <option value="casado">Casado/a</option>
                        <option value="divorciado">Divorciado/a</option>
                        <option value="viudo">Viudo/a</option>
                        <option value="union_libre">Unión libre</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">ESTADO DE NACIMIENTO</label>
                    <select v-model="form.birth_state_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option :value="null">{{ loadingStates ? 'Cargando...' : 'Seleccionar...' }}</option>
                        <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">MUNICIPIO DE NACIMIENTO</label>
                    <select
                        v-model="form.birth_municipality_id"
                        :disabled="!form.birth_state_id || loadingMunicipalities"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option :value="null">{{ form.birth_state_id ? (loadingMunicipalities ? 'Cargando...' : 'Seleccionar...') : 'Seleccione un estado primero' }}</option>
                        <option v-for="m in municipalities" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <ReadField label="RFC" :value="form.rfc" />
                <ReadField label="FECHA DE NACIMIENTO" :value="form.birth_date" />
                <ReadField label="ESTADO CIVIL" :value="MARITAL_LABELS[form.marital_status] ?? form.marital_status" />
                <ReadField label="ESTADO DE NACIMIENTO" :value="stateName" />
                <ReadField label="MUNICIPIO DE NACIMIENTO" :value="municipalityName" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import ReadField from './ReadField.vue'

const MARITAL_LABELS: Record<string, string> = {
    soltero: 'Soltero/a', casado: 'Casado/a', divorciado: 'Divorciado/a',
    viudo: 'Viudo/a', union_libre: 'Unión libre', otro: 'Otro',
}

const props = defineProps<{
    form: {
        rfc: string
        birth_date: string
        marital_status: string
        birth_state_id: number | null
        birth_municipality_id: number | null
    }
    editing: boolean
}>()

interface GeoItem { id: number; name: string }
const states              = ref<GeoItem[]>([])
const municipalities      = ref<GeoItem[]>([])
const loadingStates       = ref(false)
const loadingMunicipalities = ref(false)

const stateName = computed(() =>
    props.form.birth_state_id ? (states.value.find(s => s.id === props.form.birth_state_id)?.name ?? null) : null
)
const municipalityName = computed(() =>
    props.form.birth_municipality_id ? (municipalities.value.find(m => m.id === props.form.birth_municipality_id)?.name ?? null) : null
)

watch(() => props.form.birth_state_id, async (stateId, oldStateId) => {
    municipalities.value = []
    if (oldStateId !== null && oldStateId !== undefined && stateId !== oldStateId) {
        props.form.birth_municipality_id = null
    }
    if (!stateId) return
    loadingMunicipalities.value = true
    try {
        const { data } = await api.get(API.GEO_API.municipalities(stateId))
        municipalities.value = data
    } finally { loadingMunicipalities.value = false }
})

async function loadStates() {
    loadingStates.value = true
    try {
        const { data } = await api.get(API.GEO_API.states)
        states.value = data
    } finally { loadingStates.value = false }
}

async function loadMunicipalities(stateId: number) {
    loadingMunicipalities.value = true
    try {
        const { data } = await api.get(API.GEO_API.municipalities(stateId))
        municipalities.value = data
    } finally { loadingMunicipalities.value = false }
}

onMounted(async () => {
    await loadStates()
    if (props.form.birth_state_id) await loadMunicipalities(props.form.birth_state_id)
})
</script>
