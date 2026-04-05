<template>
    <div class="p-6 space-y-5">
        <template v-if="editing">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="sm:col-span-2 space-y-1">
                    <label class="text-xs font-medium text-slate-600">GRUPO INDÍGENA</label>
                    <select v-model="form.indigenous_group_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option :value="null">Ninguno</option>
                        <option v-for="g in indigenousGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
                    </select>
                </div>
                <div class="sm:col-span-2 space-y-1">
                    <label class="text-xs font-medium text-slate-600">LENGUA INDÍGENA</label>
                    <select v-model="form.indigenous_language_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option :value="null">Ninguna</option>
                        <option v-for="l in indigenousLanguages" :key="l.id" :value="l.id">{{ l.name }}</option>
                    </select>
                </div>
                <FormInput label="EMPRESA (si trabaja)" v-model="form.company" :maxlength="120" />
                <FormInput label="AÑO DE EGRESO" v-model="form.graduation_year" type="number" min="1950" max="2099" />
                <FormInput label="PROMEDIO (escala 100)" v-model="form.academic_average" type="number" step="0.01" min="0" max="100" />
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">ÁREA ACADÉMICA</label>
                    <select v-model="form.academic_area_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option :value="null">Ninguna</option>
                        <option v-for="a in academicAreas" :key="a.id" :value="a.id">{{ a.name }}</option>
                    </select>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <ReadField label="GRUPO INDÍGENA" :value="indigenousGroups.find(g => g.id === form.indigenous_group_id)?.name ?? '—'" />
                <ReadField label="LENGUA INDÍGENA" :value="indigenousLanguages.find(l => l.id === form.indigenous_language_id)?.name ?? '—'" />
                <ReadField label="EMPRESA" :value="form.company" />
                <ReadField label="AÑO DE EGRESO" :value="form.graduation_year" />
                <ReadField label="PROMEDIO" :value="form.academic_average" />
                <ReadField label="ÁREA ACADÉMICA" :value="academicAreas.find(a => a.id === form.academic_area_id)?.name ?? '—'" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import FormInput from '@/app/components/ui/form/FormInput.vue'
import ReadField from './ReadField.vue'

defineProps<{
    form: {
        indigenous_group_id: number | null
        indigenous_language_id: number | null
        company: string
        graduation_year: string | ''
        academic_average: string | ''
        academic_area_id: number | null
    }
    editing: boolean
    indigenousGroups: { id: number; name: string }[]
    indigenousLanguages: { id: number; name: string }[]
    academicAreas: { id: number; name: string }[]
}>()
</script>
