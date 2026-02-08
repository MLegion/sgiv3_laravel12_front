<template>
    <div class="max-w-4xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">
                EDITAR MATERIA
            </h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 uppercase" @click="goBack">
                REGRESAR
            </button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="loading || submitting" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <span class="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    {{ loading ? 'CARGANDO DATOS...' : 'GUARDANDO CAMBIOS...' }}
                </span>
            </div>

            <form v-if="!loading && API?.SUPERADMIN_API" class="space-y-6" @submit.prevent="submit">

                <div v-if="hasSpecialty" class="p-4 bg-slate-50 border border-dashed rounded-lg">
                    <FormRemoteSelect
                        label="ESPECIALIDAD"
                        v-model="form.specialtyId"
                        :endpoint="API.SUPERADMIN_API.specialties?.list"
                        :endpoint-by-id="API.SUPERADMIN_API.specialties?.byId"
                        item-label="name"
                        item-value="id"
                        :disabled="hasSpecialty"
                    />
                </div>

                <div v-if="hasOptionalGroup" class="p-4 bg-slate-50 border border-dashed rounded-lg">
                    <FormRemoteSelect
                        label="GRUPO DE MATERIAS OPTATIVAS"
                        v-model="form.optionalGroupId"
                        :endpoint="API.SUPERADMIN_API.optionalGroups?.list"
                        :endpoint-by-id="API.SUPERADMIN_API.optionalGroups?.byId"
                        item-label="name"
                        item-value="id"
                        :disabled="hasOptionalGroup"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="NOMBRE DE LA MATERIA" v-model="form.name" required />
                    <FormInput label="NOMBRE CORTO" v-model="form.shortName" required />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="CLAVE OFICIAL" v-model="form.officialCode" uppercase required />
                    <FormInput label="CRÉDITOS" type="number" v-model.number="form.credits" required />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="HORAS TEÓRICAS (HT)" type="number" v-model.number="form.ht" required />
                    <FormInput label="HORAS PRÁCTICAS (HP)" type="number" v-model.number="form.hp" required />
                </div>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg uppercase" @click="goBack">
                        CANCELAR
                    </button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 uppercase font-bold" :disabled="submitting">
                        ACTUALIZAR MATERIA
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api' // <-- Revisa que este objeto tenga SUPERADMIN_API

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)

const hasSpecialty = ref(false)
const hasOptionalGroup = ref(false)

const form = reactive({
    name: '',
    shortName: '',
    officialCode: '',
    ht: 0,
    hp: 0,
    credits: 0,
    specialtyId: null as number | null,
    optionalGroupId: null as number | null,
})

async function fetchSubject() {
    loading.value = true
    try {
        const { data } = await api.get(API.SUPERADMIN_API.subjects.byId(route.params.id))

        // Mapeo manual para asegurar consistencia
        form.name = data.name
        form.shortName = data.shortName
        form.officialCode = data.officialCode
        form.ht = Number(data.ht)
        form.hp = Number(data.hp)
        form.credits = Number(data.credits)
        form.specialtyId = data.specialtyId
        form.optionalGroupId = data.optionalGroupId

        if (data.specialtyId) hasSpecialty.value = true
        if (data.optionalGroupId) hasOptionalGroup.value = true
    } catch (error) {
        console.error("Error al cargar materia:", error)
    } finally {
        loading.value = false
    }
}

async function submit() {
    submitting.value = true
    try {
        await api.put(API.SUPERADMIN_API.subjects.update(route.params.id), {
            ...form,
            short_name: form.shortName,
            official_code: form.officialCode,
            specialty_id: form.specialtyId,
            optional_group_id: form.optionalGroupId
        })
        router.push({ name: 'superadmin.subjects.show', params: { id: route.params.id } })
    } finally {
        submitting.value = false
    }
}

function goBack() { router.back() }
onMounted(fetchSubject)
</script>
