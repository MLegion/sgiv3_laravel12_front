<template>
    <div class="h-full flex flex-col text-xs space-y-3">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Periodo</label>
            <select
                v-model="choice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                @change="emit('params', { period_id: choice })"
            >
                <option value="">Periodo vigente</option>
                <option v-for="p in periods" :key="p.id" :value="String(p.id)">
                    {{ p.shortName ?? p.name }}
                </option>
            </select>
        </div>
        <div class="text-[10px] text-slate-400 mt-auto">Cambios aplican al cerrar la configuración.</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Period { id: number; name: string; shortName: string | null }
defineProps<{ periods: Period[] }>()
const emit = defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()
const choice = ref('')
</script>
