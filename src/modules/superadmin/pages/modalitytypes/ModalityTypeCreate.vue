<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                REGISTRAR - TIPO DE MODALIDAD
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
            <!-- Overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    Cargando configuración…
                </span>
            </div>

            <!-- Form -->
            <FormInput
                label="NOMBRE"
                v-model="form.name"
                uppercase
                required
            />

            <FormInput
                label="NOMBRE CORTO"
                v-model="form.shortName"
                uppercase
                required
            />

            <FormSwitch
                label="ACTIVO"
                v-model="form.isActive"
            />

            <!-- Config -->
            <div>
                <label class="text-xs font-medium text-slate-600">
                    CONFIGURACIÓN (JSON)
                </label>

                <textarea
                    v-model="configRaw"
                    rows="12"
                    class="w-full mt-1 p-3 text-sm border rounded-lg
                           font-mono focus:outline-none
                           focus:ring-2 focus:ring-blue-500"
                />
                <p class="text-xs text-slate-400 mt-1">
                    ESTA CONFIGURACIÓN SE USA COMO BASE PARA LAS MODALIDADES.
                </p>
            </div>

            <!-- Actions -->
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
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { mapModalityTypeCreatePayload } from '@/shared/api/mappers/modality-type.mapper'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(true)
const submitting = ref(false)

const configRaw = ref('')

const form = reactive({
    name: '',
    shortName: '',
    isActive: true,
    config: {},
})

/* -------------------------------------------------------------------------- */
/* FETCH DEFAULT CONFIG */
/* -------------------------------------------------------------------------- */
async function fetchDefaultConfig() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.modalityTypes.defaultConfig
        )

        form.config = data
        configRaw.value = JSON.stringify(data, null, 2)
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* SUBMIT */
/* -------------------------------------------------------------------------- */
async function submit() {
    submitting.value = true
    try {
        form.config = JSON.parse(configRaw.value)

        await api.post(
            API.SUPERADMIN_API.modalityTypes.create,
            mapModalityTypeCreatePayload(form)
        )

        router.push({
            name: 'superadmin.modalitytypes',
        })
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchDefaultConfig)
</script>
