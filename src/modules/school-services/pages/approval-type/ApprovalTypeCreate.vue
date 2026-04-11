<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Registrar Tipo de Aprobacion</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <form class="space-y-6" @submit.prevent="submit">
                <FormInput label="NOMBRE" v-model="form.name" required uppercase />
                <FormInput label="CLAVE CORTA" v-model="form.shortName" required uppercase />

                <div class="grid grid-cols-2 gap-4">
                    <FormInput label="CURSO" v-model="form.course" type="number" required />
                    <FormInput label="OPORTUNIDAD" v-model="form.opportunity" type="number" required />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <FormInput label="CLASE" v-model="form.class" type="number" required />
                    <FormInput label="ORDEN" v-model="form.order" type="number" required />
                </div>

                <FormSwitch label="ACTIVO" v-model="form.isActive" />

                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">GUARDAR</button>
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
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

const form = reactive({
    name: '',
    shortName: '',
    course: 1,
    opportunity: 1,
    class: 1,
    order: 1,
    isActive: true,
})

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.approvalTypes.create, {
            name: form.name,
            short_name: form.shortName,
            course: Number(form.course),
            opportunity: Number(form.opportunity),
            class: Number(form.class),
            order: Number(form.order),
            is_active: form.isActive,
        })
        router.push({ name: 'school-services.approval-types.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}
</script>
