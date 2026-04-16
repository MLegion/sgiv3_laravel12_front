<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Nuevo Reporte</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <FormInput label="NOMBRE" v-model="form.name" required />
            <FormInput label="CÓDIGO" v-model="form.code" />
            <FormInput label="DESCRIPCIÓN" v-model="form.description" />
            <div class="flex items-center gap-6">
                <FormSwitch label="ES PLANTILLA" v-model="form.is_template" />
                <FormSwitch label="ACTIVO" v-model="form.status" />
            </div>

            <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>

            <div class="flex items-center gap-3 pt-3 border-t">
                <button class="flex-1 py-2.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
                    :disabled="submitting"
                    @click="submit">
                    CREAR Y CONTINUAR
                </button>
            </div>

            <p class="text-[11px] text-slate-400">
                Al crear el reporte se te redirigirá a la pantalla de edición, donde podrás subir la plantilla Word y vincular los DAOs.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

const form = reactive({
    name:        '',
    code:        '',
    description: '',
    is_template: false,
    status:      false,
})

async function loadNextCode() {
    try {
        const { data } = await api.get(API.REPORTS_API.reports.nextCode)
        if (data?.code) form.code = data.code
    } catch {
        // silent: si falla, el usuario puede escribir el code o el backend lo generará al guardar
    }
}

onMounted(loadNextCode)

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const { data } = await api.post(API.REPORTS_API.reports.create, {
            name:        form.name,
            code:        form.code || null,
            description: form.description || null,
            is_template: form.is_template,
            status:      form.status,
            daos:        [],
        })
        router.push({ name: 'reports.reports.edit', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}
</script>
