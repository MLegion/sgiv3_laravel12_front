<template>
    <div class="space-y-4">
        <!-- Calle / número -->
        <FormInput label="CALLE Y NÚMERO" v-model="addressModel" uppercase />

        <!-- Código postal -->
        <div class="space-y-1">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                CÓDIGO POSTAL
            </label>
            <input
                v-model="postalCode"
                type="text"
                inputmode="numeric"
                maxlength="5"
                placeholder="00000"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="onInput"
            />
            <p v-if="loading" class="text-xs text-slate-400">Buscando...</p>
            <p v-else-if="error" class="text-xs text-red-500">{{ error }}</p>
        </div>

        <!-- Resultados: Estado / Municipio / Ciudad -->
        <template v-if="result">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">ESTADO</label>
                    <p class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                        {{ result.state.name }}
                    </p>
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">MUNICIPIO</label>
                    <p class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                        {{ result.municipality.name }}
                    </p>
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">CIUDAD</label>
                    <p class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                        {{ result.city ?? '—' }}
                    </p>
                </div>
            </div>

            <!-- Colonia -->
            <div class="space-y-1">
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">COLONIA</label>
                <select
                    v-model="selectedSettlementId"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @change="emit('update:geoSettlementId', selectedSettlementId)"
                >
                    <option :value="null" disabled>Selecciona una colonia</option>
                    <option
                        v-for="s in result.settlements"
                        :key="s.id"
                        :value="s.id"
                    >
                        {{ s.colony }}{{ s.type ? ` (${s.type})` : '' }}
                    </option>
                </select>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import FormInput from './FormInput.vue'
import { usePostalCodeLookup } from '@/shared/composables/usePostalCodeLookup'

const props = defineProps<{
    address: string | null
    geoSettlementId: number | null
    initialPostalCode?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:address', v: string): void
    (e: 'update:geoSettlementId', v: number | null): void
}>()

const addressModel        = ref(props.address ?? '')
const postalCode          = ref(props.initialPostalCode ?? '')
const selectedSettlementId = ref<number | null>(props.geoSettlementId)

watch(addressModel, v => emit('update:address', v))

const { lookup, loading, error, result } = usePostalCodeLookup()

// Al montar: si ya hay CP guardado, carga los asentamientos y pre-selecciona el correcto
onMounted(async () => {
    if (postalCode.value.length === 5) {
        await lookup(postalCode.value)
        // Restaura la selección previa (modo edición)
        if (result.value && props.geoSettlementId) {
            const exists = result.value.settlements.some(s => s.id === props.geoSettlementId)
            selectedSettlementId.value = exists ? props.geoSettlementId : null
        }
    }
})

function onInput(e: Event) {
    const val = (e.target as HTMLInputElement).value.replace(/\D/g, '')
    postalCode.value = val
    if (val.length === 5) {
        lookup(val).then(() => {
            if (result.value && result.value.settlements.length === 1) {
                selectedSettlementId.value = result.value.settlements[0].id
                emit('update:geoSettlementId', selectedSettlementId.value)
            } else {
                selectedSettlementId.value = null
                emit('update:geoSettlementId', null)
            }
        })
    } else {
        result.value           = null
        selectedSettlementId.value = null
        emit('update:geoSettlementId', null)
    }
}
</script>
