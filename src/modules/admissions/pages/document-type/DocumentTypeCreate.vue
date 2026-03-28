<template>
    <div class="max-w-xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">REGISTRAR TIPO DE DOCUMENTO</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <FormInput label="NOMBRE" v-model="form.name" uppercase />
            <FormInput label="NOMBRE CORTO" v-model="form.short_name" uppercase />
            <FormInput label="CÓDIGO" v-model="form.code" uppercase :maxlength="20" />
            <FormInput label="DESCRIPCIÓN" v-model="form.description" uppercase />

            <!-- Formatos aceptados -->
            <div class="space-y-2">
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">FORMATOS PERMITIDOS</label>
                <div class="flex flex-wrap gap-2">
                    <label
                        v-for="fmt in FORMAT_OPTIONS"
                        :key="fmt.value"
                        class="flex items-center gap-1.5 text-sm cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            :value="fmt.value"
                            v-model="form.accepts_formats"
                            class="rounded border-slate-300"
                        />
                        {{ fmt.label }}
                    </label>
                </div>
                <p class="text-xs text-slate-400">Deja vacío para permitir todos los formatos.</p>
            </div>

            <!-- Tamaño máximo con selector de unidad -->
            <div class="space-y-1.5">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider">TAMAÑO MÁXIMO</label>
                <div class="flex gap-2">
                    <input
                        type="number"
                        min="1"
                        v-model="sizeValue"
                        placeholder="Ej. 5"
                        class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none"
                    />
                    <select
                        v-model="sizeUnit"
                        class="border-2 rounded-xl px-3 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                        <option value="GB">GB</option>
                    </select>
                </div>
            </div>

            <FormSwitch label="ACTIVO" v-model="form.status" />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    GUARDAR
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import { FORMAT_OPTIONS } from '@/modules/admissions/types/document-type.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

const sizeValue = ref<number | null>(null)
const sizeUnit = ref<'KB' | 'MB' | 'GB'>('MB')

const SIZE_MULTIPLIERS = { KB: 1, MB: 1024, GB: 1048576 }

const maxSizeKb = computed(() =>
    sizeValue.value ? Math.round(sizeValue.value * SIZE_MULTIPLIERS[sizeUnit.value]) : null
)

const form = ref({
    name: '',
    short_name: '',
    code: '',
    description: '',
    accepts_formats: [] as string[],
    status: true,
})

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const payload = {
            ...form.value,
            accepts_formats: form.value.accepts_formats.length ? form.value.accepts_formats : null,
            max_size_kb: maxSizeKb.value,
        }
        const { data } = await api.post(API.ADMISSIONS_API.documentTypes.create, payload)
        router.push({ name: 'admissions.document-types.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}
</script>
