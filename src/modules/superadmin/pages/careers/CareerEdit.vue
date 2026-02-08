<template>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold text-slate-800">
            ACTUALIZAR - CARRERA PROFESIONAL
        </h1>

        <button
            type="button"
            class="px-4 py-2 text-sm border rounded-lg
               text-slate-600 hover:bg-slate-100
               mt-1"
            @click="goBack"
        >
            VOLVER
        </button>
    </div>

    <!-- Card -->
    <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
        <form
            v-if="loaded"
            @submit.prevent="submit"
            class="space-y-6"
        >
            <FormInput
                label="NOMBRE"
                v-model="career.name"
                uppercase
                required
            />

            <FormInput
                label="NOMBRE CORTO"
                v-model="career.short_name"
                uppercase
                required
                maxlength="20"
            />

            <FormInput
                label="CLAVE OFICIAL"
                v-model="career.official_code"
                uppercase
                required
                maxlength="20"
            />

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button
                    type="button"
                    class="px-4 py-2 text-sm border rounded-lg"
                    @click="goBack"
                >
                    CANCELAR
                </button>

                <button
                    type="submit"
                    class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700
                           disabled:opacity-60"
                    :disabled="submitting"
                >
                    ACTUALIZAR
                </button>
            </div>
        </form>

        <!-- Loader simple -->
        <div
            v-else
            class="flex justify-center items-center py-10 text-slate-500"
        >
            Cargando información...
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const route = useRoute()
const router = useRouter()

const loaded = ref(false)
const submitting = ref(false)

const career = reactive({
    name: '',
    short_name: '',
    official_code: ''
})

onMounted(async () => {
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.careers.byId(route.params.id)
        )

        career.name = data.name
        career.short_name = data.shortName
        career.official_code = data.officialCode

        loaded.value = true
    } catch (error) {
        console.error('Error cargando la carrera', error)
        router.back()
    }
})

const submit = async () => {
    submitting.value = true

    try {

        await api.put(
             API.SUPERADMIN_API.careers.update(route.params.id),
             career
        )

         router.push({ name: 'superadmin.careers' })
    } catch (error) {
        console.error('Error al actualizar la carrera', error)
    } finally {
        submitting.value = false
    }
}

const goBack = () => {
    router.back()
}
</script>
