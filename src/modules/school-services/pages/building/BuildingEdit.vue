<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Editar Edificio</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="loading || submitting" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                <span class="text-sm text-slate-500 font-bold uppercase tracking-widest">{{ loading ? 'CARGANDO...' : 'GUARDANDO...' }}</span>
            </div>

            <form v-if="!loading" class="space-y-6" @submit.prevent="submit">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE DEL EDIFICIO" v-model="form.name" required />
                    <FormInput label="NOMBRE CORTO" v-model="form.shortName" />
                </div>
                <FormInput label="DESCRIPCIÓN" v-model="form.description" />
                <FormSwitch label="ACTIVO" v-model="form.status" />

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">ACTUALIZAR</button>
                </div>
            </form>
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
const loading = ref(true)
const submitting = ref(false)

const form = reactive({ campusId: null as number | null, name: '', shortName: '', description: '', status: true })

async function fetchBuilding() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.buildings.byId(route.params.id as string))
        form.campusId    = data.campusId
        form.name        = data.name
        form.shortName   = data.shortName ?? ''
        form.description = data.description ?? ''
        form.status      = data.status
    } finally { loading.value = false }
}

async function submit() {
    submitting.value = true
    try {
        await api.put(API.SCHOOL_SERVICES_API.buildings.update(route.params.id as string), {
            campus_id:   form.campusId,
            name:        form.name,
            short_name:  form.shortName || null,
            description: form.description || null,
            status:      form.status,
        })
        router.push({ name: 'school-services.buildings.show', params: { id: route.params.id } })
    } finally { submitting.value = false }
}

onMounted(fetchBuilding)
</script>
