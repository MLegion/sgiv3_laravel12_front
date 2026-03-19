<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
                <h1 class="text-xl font-black text-slate-800 uppercase tracking-tight">
                    REGISTRAR GRUPO OPTATIVO
                </h1>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Definición de reglas y selección de materias optativas
                </p>
            </div>

            <button
                type="button"
                class="px-4 py-2 text-[11px] font-black border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-slate-500"
                @click="goBack"
            >
                VOLVER
            </button>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <form @submit.prevent="submit" class="divide-y divide-slate-100">

                <!-- Sección 1: Identificación y Origen -->
                <div class="p-8 space-y-6">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-1 h-4 bg-blue-600 rounded-full"></div>
                        <h2 class="text-xs font-black text-slate-800 uppercase tracking-widest">Información General</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Plan de Estudios -->
                        <FormRemoteSelect
                            label="PLAN DE ESTUDIOS"
                            v-model="form.study_plan_id"
                            :endpoint="API.SUPERADMIN_API.studyPlans.list"
                            item-label="officialCode"
                            item-value="id"
                            placeholder="SELECCIONE UN PLAN DE ESTUDIOS..."
                            required
                            class="md:col-span-2"
                        />

                        <!-- Clave Oficial -->
                        <FormInput
                            label="CLAVE DEL GRUPO"
                            v-model="form.official_code"
                            placeholder="EJ. OPT-ISC-2024"
                            uppercase
                            maxlength="30"
                            required
                        />

                        <!-- Nombre Corto -->
                        <FormInput
                            label="NOMBRE CORTO"
                            v-model="form.short_name"
                            placeholder="EJ. OPTATIVAS T.I."
                            uppercase
                            maxlength="50"
                            required
                        />

                        <!-- Nombre Completo -->
                        <FormInput
                            label="NOMBRE COMPLETO DEL GRUPO"
                            v-model="form.name"
                            placeholder="EJ. GRUPO DE OPTATIVAS DE TECNOLOGÍAS DE INFORMACIÓN"
                            uppercase
                            maxlength="255"
                            required
                            class="md:col-span-2"
                        />
                    </div>
                </div>

                <!-- Sección 2: Reglas de Optatividad -->
                <div class="p-8 bg-slate-50/50 space-y-6">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                        <h2 class="text-xs font-black text-slate-800 uppercase tracking-widest">Reglas de Selección</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Mínimo de Materias -->
                        <FormInput
                            label="MIN. MATERIAS"
                            type="number"
                            v-model.number="form.min_subjects"
                            min="1"
                            required
                        />

                        <!-- Máximo de Materias -->
                        <FormInput
                            label="MAX. MATERIAS"
                            type="number"
                            v-model.number="form.max_subjects"
                            min="1"
                            required
                        />

                        <!-- Mínimo de Créditos -->
                        <FormInput
                            label="CRÉDITOS MÍNIMOS"
                            type="number"
                            v-model.number="form.min_credits"
                            min="0"
                            required
                        />
                    </div>
                </div>

                <!-- Sección 3: Descripción -->
                <div class="p-8 space-y-6">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-1 h-4 bg-indigo-500 rounded-full"></div>
                        <h2 class="text-xs font-black text-slate-800 uppercase tracking-widest">Detalles Adicionales</h2>
                    </div>

                    <!-- Descripción (Textarea o Input largo) -->
                    <FormInput
                        label="DESCRIPCIÓN O NOTAS"
                        v-model="form.description"
                        placeholder="DESCRIBA EL PROPÓSITO DE ESTE GRUPO..."
                        class="md:col-span-2"
                    />
                </div>

                <!-- Actions -->
                <div class="px-8 py-6 bg-slate-50 flex justify-end gap-3">
                    <button
                        type="button"
                        class="px-6 py-2.5 text-[11px] font-black border-2 border-slate-200 rounded-xl hover:bg-white transition-all uppercase tracking-widest text-slate-500"
                        @click="goBack"
                    >
                        CANCELAR
                    </button>

                    <button
                        type="submit"
                        class="px-8 py-2.5 text-[11px] font-black rounded-xl
                               bg-blue-600 text-white shadow-lg shadow-blue-100
                               hover:bg-blue-700 active:scale-95 disabled:opacity-60 transition-all uppercase tracking-widest"
                        :disabled="submitting"
                    >
                        {{ submitting ? 'PROCESANDO...' : 'GUARDAR GRUPO' }}
                    </button>
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
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const router = useRouter()
const submitting = ref(false)

/**
 * FORM STATE
 * Adaptado a la OptionalGroupEntity (camelCase para el frontend,
 * el mapper o la API suelen encargarse del snake_case si es necesario)
 */
const form = reactive({
    study_plan_id: null as number | null,
    name: '',
    short_name: '',
    official_code: '',
    description: '',
    min_subjects: 1,
    max_subjects: 1,
    min_credits: 0
})

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goBack() {
    router.back()
}

async function submit() {
    submitting.value = true
    try {
        // Asegurarse de usar el endpoint correcto para optional-groups
        await api.post(API.SUPERADMIN_API.optionalGroups.create, form)
        router.push({ name: 'superadmin.optionalgroups' })
    } catch (error) {
        console.error('Error al guardar el grupo optativo:', error)
        // Aquí podrías añadir un sistema de notificaciones
    } finally {
        submitting.value = false
    }
}
</script>
