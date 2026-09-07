<template>
    <div class="space-y-2">
        <FormRemoteSelect
            :key="pickerKey"
            :model-value="modelValue"
            :label="label"
            :endpoint="API.SCHOOL_SERVICES_API.mobility.institutions"
            :endpoint-by-id="API.SCHOOL_SERVICES_API.mobility.institutionById"
            :item-searchs="['q']"
            item-label="label"
            item-value="id"
            :required="required"
            :placeholder="placeholder"
            @update:model-value="onPick"
        />

        <!-- Registrar institución informativa al vuelo -->
        <div v-if="!registering" class="text-right">
            <button type="button" class="text-xs font-semibold text-blue-600 hover:text-blue-700" @click="registering = true">
                ¿No aparece? Registrar institución
            </button>
        </div>

        <div v-else class="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Registrar institución (informativa)</p>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre *</label>
                <input v-uppercase v-model="form.name" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="Nombre de la institución" />
            </div>
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input v-model="form.is_foreign" type="checkbox" /> Institución extranjera
            </label>
            <div v-if="!form.is_foreign">
                <FormRemoteSelect
                    v-model="form.state"
                    label="Estado"
                    :endpoint="API.GEO_API.states"
                    item-label="name"
                    item-value="name"
                    placeholder="Selecciona estado…"
                />
            </div>
            <div v-else>
                <label class="block text-xs font-semibold text-slate-500 mb-1">País</label>
                <input v-uppercase v-model="form.country" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="País" />
            </div>
            <div class="flex justify-end gap-2 pt-1">
                <button type="button" class="rounded-lg px-3 py-1.5 text-xs text-slate-600" @click="cancelRegister">Cancelar</button>
                <button type="button" class="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40" :disabled="saving || !form.name" @click="saveInstitution">
                    {{ saving ? 'Guardando…' : 'Guardar y seleccionar' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const props = withDefaults(defineProps<{
    modelValue: number | null
    label?: string
    required?: boolean
    placeholder?: string
}>(), {
    label: 'Institución',
    required: false,
    placeholder: 'Buscar institución (SGI o externa)…',
})

const emit = defineEmits<{
    (e: 'update:modelValue', v: number | null): void
    (e: 'selected', item: { id: number; label: string; is_foreign: boolean; is_active: boolean } | null): void
}>()

const toast = useToast()
const registering = ref(false)
const saving = ref(false)
const pickerKey = ref(0)   // fuerza rehidratación del picker tras registrar una nueva
const form = ref<{ name: string; is_foreign: boolean; state: string | null; country: string }>({
    name: '', is_foreign: false, state: null, country: 'México',
})

function onPick(id: number | null) {
    emit('update:modelValue', id)
    if (!id) { emit('selected', null); return }
    // Resuelve is_foreign/is_active para que el modal pueda derivar equivalencia vs revalidación.
    api.get(API.SCHOOL_SERVICES_API.mobility.institutionById(id))
        .then(({ data }) => emit('selected', data.data ?? null))
        .catch(() => emit('selected', null))
}

function cancelRegister() {
    registering.value = false
    form.value = { name: '', is_foreign: false, state: null, country: 'México' }
}

async function saveInstitution() {
    saving.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.mobility.institutions, {
            name: form.value.name,
            state: form.value.is_foreign ? null : form.value.state,
            country: form.value.is_foreign ? form.value.country : 'México',
            is_foreign: form.value.is_foreign,
        })
        const created = data.data
        toast.success('Institución registrada')
        registering.value = false
        pickerKey.value++    // remonta el picker para que hidrate la nueva selección
        emit('update:modelValue', created.id)
        emit('selected', created)
        form.value = { name: '', is_foreign: false, state: null, country: 'México' }
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo registrar')
    } finally {
        saving.value = false
    }
}

// Si el modal se resetea (modelValue → null), cierra el sub-formulario.
watch(() => props.modelValue, (v) => { if (!v) registering.value = false })
</script>
