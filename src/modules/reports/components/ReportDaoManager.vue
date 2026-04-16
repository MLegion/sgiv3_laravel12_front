<template>
    <div class="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                <h3 class="text-sm font-black uppercase text-slate-800">DAOs vinculados</h3>
            </div>
            <span class="text-[10px] uppercase font-semibold text-slate-500">
                Cada DAO se referencia en la plantilla por su <code class="text-slate-800 font-mono">var_name</code>
            </span>
        </div>

        <div class="p-4 space-y-3">
            <div v-if="linked.length === 0" class="py-6 text-center text-[12px] text-slate-400 italic border border-dashed rounded-lg">
                No hay DAOs vinculados. Agrega uno para poblar tu plantilla con datos.
            </div>

            <div v-for="(item, idx) in linked" :key="idx" class="border rounded-lg bg-slate-50">
                <div class="flex items-start gap-2 p-3">
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <select
                            :value="item.dao_id"
                            class="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            @change="updateField(idx, 'dao_id', Number(($event.target as HTMLSelectElement).value) || null)"
                        >
                            <option :value="null" disabled>— seleccionar DAO —</option>
                            <option v-for="dao in availableDaos" :key="dao.id" :value="dao.id">
                                {{ dao.name }}
                            </option>
                        </select>
                        <input
                            :value="item.var_name"
                            type="text"
                            placeholder="var_name (ej: alumnos)"
                            class="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            @input="updateField(idx, 'var_name', ($event.target as HTMLInputElement).value)"
                        />
                    </div>
                    <button type="button" class="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold border rounded text-slate-600 hover:bg-white" @click="toggleScripts(idx)">
                        {{ expanded[idx] ? 'OCULTAR SCRIPTS' : 'SCRIPTS' }}
                    </button>
                    <button type="button" class="p-1.5 text-red-400 hover:text-red-600" @click="remove(idx)" title="Quitar DAO">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div v-if="expanded[idx]" class="px-3 pb-3 space-y-3">
                    <div>
                        <label class="text-[10px] uppercase font-bold text-slate-500">Pre-script <span class="text-slate-400 lowercase normal-case">(se ejecuta ANTES del DAO, puede modificar parámetros)</span></label>
                        <ScriptEditor
                            :model-value="item.pre_script ?? ''"
                            placeholder="// Se ejecuta antes del DAO. Acceso a: params, context"
                            height="120px"
                            @update:model-value="updateField(idx, 'pre_script', $event || null)"
                        />
                    </div>
                    <div>
                        <label class="text-[10px] uppercase font-bold text-slate-500">Post-script <span class="text-slate-400 lowercase normal-case">(se ejecuta DESPUÉS del DAO, puede transformar el resultado)</span></label>
                        <ScriptEditor
                            :model-value="item.post_script ?? ''"
                            placeholder="// Se ejecuta después del DAO. Acceso a: result, params, context"
                            height="120px"
                            @update:model-value="updateField(idx, 'post_script', $event || null)"
                        />
                    </div>
                </div>
            </div>

            <button
                type="button"
                class="w-full py-2 text-xs border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600"
                @click="add"
            >
                + AGREGAR DAO
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import ScriptEditor from '@/modules/reports/components/ScriptEditor.vue'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'

export interface LinkedDao {
    id?:         number
    dao_id:      number | null
    var_name:    string
    pre_script:  string | null
    post_script: string | null
}

const props = defineProps<{
    linked:        LinkedDao[]
    availableDaos: DataAccessObject[]
}>()

const emit = defineEmits<{
    (e: 'update', linked: LinkedDao[]): void
}>()

const expanded = reactive<Record<number, boolean>>({})

function toggleScripts(idx: number) { expanded[idx] = !expanded[idx] }

function add() {
    emit('update', [...props.linked, { dao_id: null, var_name: '', pre_script: null, post_script: null }])
}

function remove(idx: number) {
    const next = [...props.linked]
    next.splice(idx, 1)
    emit('update', next)
    delete expanded[idx]
}

function updateField(idx: number, key: keyof LinkedDao, value: any) {
    const next = props.linked.map((l, i) => i === idx ? { ...l, [key]: value } : l)
    emit('update', next)
}
</script>
