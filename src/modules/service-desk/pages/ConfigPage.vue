<template>
    <div class="space-y-5 max-w-2xl">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración de la ventanilla</h1>

        <div class="rounded-xl border bg-white p-5 space-y-3">
            <span class="text-xs font-bold text-slate-500 uppercase">División del trabajo</span>
            <label class="flex items-start gap-2 rounded-lg border p-3 cursor-pointer" :class="mode === 'none' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'">
                <input type="radio" value="none" v-model="mode" class="mt-1" />
                <span><b class="text-sm text-slate-700">Sin división</b><br><span class="text-xs text-slate-400">Cualquier ventanilla atiende a cualquier estudiante del plantel.</span></span>
            </label>
            <label class="flex items-start gap-2 rounded-lg border p-3 cursor-pointer" :class="mode === 'by_career' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'">
                <input type="radio" value="by_career" v-model="mode" class="mt-1" />
                <span><b class="text-sm text-slate-700">Por carrera</b><br><span class="text-xs text-slate-400">Cada oficial atiende solo las carreras que le asignes (contexto de carrera del rol de ventanilla, desde Usuarios).</span></span>
            </label>
            <p v-if="msg" class="text-sm" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>
            <div class="flex justify-end">
                <button @click="save" :disabled="busy" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const D = API.SERVICE_DESK_API
const mode = ref('none'), busy = ref(false), msg = ref(''), msgError = ref(false)

async function save() {
    busy.value = true; msg.value = ''; msgError.value = false
    try {
        await api.put(D.config, { division_mode: mode.value })
        msg.value = 'Configuración guardada.'
    } catch (e: any) { msg.value = e?.response?.data?.message ?? 'No se pudo guardar.'; msgError.value = true }
    finally { busy.value = false }
}
onMounted(async () => { mode.value = (await api.get(D.config)).data.division_mode ?? 'none' })
</script>
