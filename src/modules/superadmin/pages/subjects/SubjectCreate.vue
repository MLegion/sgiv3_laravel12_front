<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                REGISTRAR - MATERIA
                <span v-if="isLockedSpecialty" class="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    DE ESPECIALIDAD
                </span>
                <span v-if="isLockedOptionalGroup" class="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                    OPTATIVA
                </span>
            </h1>

            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="goBack"
            >
                REGRESAR
            </button>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <!-- Loading -->
            <div
                v-if="submitting"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    GUARDANDO…
                </span>
            </div>

            <form
                class="space-y-6"
                @submit.prevent="submit"
            >
                <!-- Especialidad -->
                <div v-if="isLockedSpecialty" class="p-4 bg-slate-50 border border-dashed rounded-lg">
                    <FormRemoteSelect
                        label="ESPECIALIDAD ASIGNADA"
                        v-model="form.specialtyId"
                        :endpoint="API.SUPERADMIN_API.specialties.list"
                        :endpoint-by-id="API.SUPERADMIN_API.specialties.byId"
                        item-label="name"
                        item-value="id"
                        disabled
                    />
                    <p class="mt-1 text-[10px] text-slate-400 italic">
                        * Este campo no se puede modificar porque estás registrando la materia desde una especialidad específica.
                    </p>
                </div>

                <!-- Especialidad -->
                <div v-if="isLockedOptionalGroup" class="p-4 bg-slate-50 border border-dashed rounded-lg">
                    <FormRemoteSelect
                        label="GRUPO DE MATERIAS OPTATIVAS"
                        v-model="form.optionalGroupId"
                        :endpoint="API.SUPERADMIN_API.optionalGroups.list"
                        :endpoint-by-id="API.SUPERADMIN_API.optionalGroups.byId"
                        item-label="name"
                        item-value="id"
                        disabled
                    />
                    <p class="mt-1 text-[10px] text-slate-400 italic">
                        * Este campo está bloqueado para asegurar la integridad del grupo.
                    </p>
                </div>

                <!-- Nombre -->
                <FormInput
                    label="NOMBRE DE LA MATERIA"
                    v-model="form.name"
                    required
                    uppercase
                />

                <!-- Nombre corto -->
                <FormInput
                    label="NOMBRE CORTO"
                    v-model="form.shortName"
                    required
                    uppercase
                />

                <!-- Clave oficial -->
                <FormInput
                    label="CLAVE OFICIAL"
                    v-model="form.officialCode"
                    required
                    uppercase
                />

                <!-- Horas teóricas -->
                <FormInput
                    label="HORAS TEÓRICAS (HT)"
                    type="number"
                    v-model.number="form.ht"
                    required
                />

                <!-- Horas prácticas -->
                <FormInput
                    label="HORAS PRÁCTICAS (HP)"
                    type="number"
                    v-model.number="form.hp"
                    required
                />

                <!-- Créditos -->
                <FormInput
                    label="CRÉDITOS"
                    type="number"
                    v-model.number="form.credits"
                    required
                />

                <!-- Actions -->
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
                        REGISTRAR MATERIA
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

// Definimos las props que pueden llegar desde el Router o un Padre
const props = defineProps<{
    specialtyId?: number | string | null,
    optionalGroupId?: number | string | null
}>()

const router = useRouter()
const submitting = ref(false)

const form = reactive({
    name: '',
    shortName: '',
    officialCode: '',
    ht: 0,
    hp: 0,
    credits: 0,
    // Inicializamos con la prop si existe, si no, null
    specialtyId: props.specialtyId ? Number(props.specialtyId) : null,
    optionalGroupId: props.optionalGroupId ? Number(props.optionalGroupId) : null,
})

// Lógica de visibilidad: Solo mostramos si la prop tiene un valor válido
const isLockedSpecialty = computed(() => props.specialtyId !== undefined && props.specialtyId !== null)
const isLockedOptionalGroup = computed(() => props.optionalGroupId !== undefined && props.optionalGroupId !== null)

async function submit() {
    submitting.value = true
    try {
        await api.post(API.SUPERADMIN_API.subjects.create, {
            ...form,
            // Aseguramos el snake_case para el backend de SGIv3
            short_name: form.shortName,
            official_code: form.officialCode,
            specialty_id: form.specialtyId,
            optional_group_id: form.optionalGroupId,
        })
        router.push({ name: 'superadmin.subjects' })
    } catch (error) {
        console.error("Error al guardar:", error)
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}
</script>
