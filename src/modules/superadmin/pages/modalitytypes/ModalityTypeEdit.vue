<template>
    <div class="max-w-4xl space-y-6">
        <h1 class="text-xl font-semibold text-slate-800">
            ACTUALIZAR - TIPO DE MODALIDAD
        </h1>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6">
            <FormInput label="NOMBRE" v-model="form.name" />
            <FormInput label="NOMBRE CORTO" v-model="form.shortName" />

            <FormSwitch label="ESTADO" v-model="form.isActive" />

            <div>
                <label class="text-xs font-medium text-slate-600">
                    CONFIGURACIÓN (JSON)
                </label>

                <textarea
                    v-model="configRaw"
                    rows="10"
                    class="w-full mt-1 p-3 text-sm border rounded-lg
                           font-mono focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div class="flex justify-end gap-2">
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
                    ACTUALIZAR
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { mapModalityTypeUpdatePayload } from '@/shared/api/mappers/modality-type.mapper'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const route = useRoute()
const router = useRouter()

const submitting = ref(false)
const configRaw = ref('')

const form = reactive({
    name: '',
    shortName: '',
    isActive: true,
    config: {},
})

async function fetchData() {
    const { data } = await api.get(
        API.SUPERADMIN_API.modalityTypes.byId(route.params.id)
    )

    form.name = data.name
    form.shortName = data.shortName
    form.isActive = data.isActive
    form.config = data.config
    configRaw.value = JSON.stringify(data.config, null, 2)
}

async function submit() {
    submitting.value = true
    try {
        form.config = JSON.parse(configRaw.value)

        await api.put(
            API.SUPERADMIN_API.modalityTypes.update(route.params.id),
            mapModalityTypeUpdatePayload(form)
        )

        router.push({
            name: 'superadmin.modalitytypes.show',
            params: { id: route.params.id },
        })
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchData)
</script>
