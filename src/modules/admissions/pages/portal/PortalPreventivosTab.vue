<template>
    <div class="p-6 space-y-5">
        <template v-if="editing">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="NSS / NÚMERO IMSS" v-model="form.nss" :maxlength="20" />
                <FormInput label="CLÍNICA DE ATENCIÓN" v-model="form.medical_clinic" :maxlength="120" />
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">TIPO DE SANGRE</label>
                    <select v-model="form.blood_type" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar...</option>
                        <option v-for="t in BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">DISCAPACIDAD</label>
                    <select v-model="form.disability_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option :value="null">Ninguna</option>
                        <option v-for="d in disabilities" :key="d.id" :value="d.id">{{ d.name }}</option>
                    </select>
                </div>
                <div class="sm:col-span-2 space-y-1">
                    <label class="text-xs font-medium text-slate-600">ALERGIAS</label>
                    <textarea v-model="form.allergies" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
                <div class="sm:col-span-2 space-y-1">
                    <label class="text-xs font-medium text-slate-600">TRATAMIENTOS PSICOLÓGICOS/PSIQUIÁTRICOS</label>
                    <textarea v-model="form.psychological_treatment" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <ReadField label="NSS / NÚMERO IMSS" :value="form.nss" />
                <ReadField label="CLÍNICA DE ATENCIÓN" :value="form.medical_clinic" />
                <ReadField label="TIPO DE SANGRE" :value="form.blood_type" />
                <ReadField label="DISCAPACIDAD" :value="disabilities.find(d => d.id === form.disability_id)?.name ?? '—'" />
                <div class="col-span-2"><ReadField label="ALERGIAS" :value="form.allergies" /></div>
                <div class="col-span-2"><ReadField label="TRATAMIENTOS PSICOLÓGICOS/PSIQUIÁTRICOS" :value="form.psychological_treatment" /></div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import FormInput from '@/app/components/ui/form/FormInput.vue'
import ReadField from './ReadField.vue'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

defineProps<{
    form: {
        nss: string
        medical_clinic: string
        blood_type: string
        allergies: string
        psychological_treatment: string
        disability_id: number | null
    }
    editing: boolean
    disabilities: { id: number; name: string }[]
}>()
</script>
