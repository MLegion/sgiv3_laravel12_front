<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                REGISTRAR - CARRERA PROFESIONAL
            </h1>

            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="goBack"
            >
                VOLVER
            </button>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <form @submit.prevent="submit" class="space-y-6">
                <FormInput
                    label="Nombre"
                    v-model="form.name"
                    uppercase
                    required
                />

                <FormInput
                    label="Nombre corto"
                    v-model="form.short_name"
                    uppercase
                    required
                    maxlength="20"
                />

                <FormInput
                    label="Clave oficial"
                    v-model="form.official_code"
                    uppercase
                    required
                    maxlength="20"
                />

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button
                        class="px-4 py-2 text-sm border rounded-lg"
                        @click="goBack"
                    >
                        CANCELAR
                    </button>

                    <button
                        class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700
                           disabled:opacity-60"
                        :disabled="submitting"
                        @click="submit"
                    >
                        GUARDAR
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from "@/app/components/ui/form/FormInput.vue";
import FormSwitch from "@/app/components/ui/form/FormSwitch.vue";

const router = useRouter()

const form = reactive({
    name: '',
    short_name: '',
    official_code: '',
})

async function submit() {
    await api.post(API.SUPERADMIN_API.careers.create, form)
    router.push({ name: 'superadmin.careers.page' })
}

const goBack = () => router.back()
</script>
