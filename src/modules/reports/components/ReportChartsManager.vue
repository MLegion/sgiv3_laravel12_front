<template>
    <div class="bg-white border rounded-xl shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-sm font-black uppercase text-slate-700">Gráficas</h2>
            <button type="button" class="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700" @click="addChart">
                + Agregar gráfica
            </button>
        </div>
        <p class="text-[11px] text-slate-400 -mt-2">
            Cada gráfica genera una imagen en el cliente y se coloca en el tag
            <code class="bg-slate-100 px-1 rounded">{%variable}</code> de la plantilla, a partir de un DAO.
        </p>

        <div v-if="!charts.length" class="text-xs text-slate-400 italic">Sin gráficas. Agrega una para dibujar a partir de un DAO.</div>

        <div v-for="(c, i) in charts" :key="i" class="border rounded-lg p-3 space-y-2 bg-slate-50/50">
            <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-500 uppercase">Gráfica #{{ i + 1 }}</span>
                <button type="button" class="text-xs text-red-600 hover:underline" @click="removeChart(i)">Quitar</button>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Variable (tag imagen)
                    <input v-model="c.var" @input="emitCharts" placeholder="grafica" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Tipo
                    <select v-model="c.type" @change="emitCharts" class="mt-0.5 w-full border rounded px-2 py-1 text-sm">
                        <option value="bar">Barras</option>
                        <option value="line">Líneas</option>
                    </select>
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">DAO fuente
                    <select v-model="c.source" @change="emitCharts" class="mt-0.5 w-full border rounded px-2 py-1 text-sm">
                        <option value="" disabled>Selecciona…</option>
                        <option v-for="s in sources" :key="s" :value="s">{{ s }}</option>
                    </select>
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Color
                    <input v-model="c.color" @input="emitCharts" type="text" placeholder="#93c5fd" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Campo eje X
                    <input v-model="c.x" @input="emitCharts" placeholder="letra" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Campo eje Y
                    <input v-model="c.y" @input="emitCharts" placeholder="puntaje" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Título eje X
                    <input v-model="c.xTitle" @input="emitCharts" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Título eje Y
                    <input v-model="c.yTitle" @input="emitCharts" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Máximo eje Y (opcional)
                    <input v-model.number="c.yMax" @input="emitCharts" type="number" step="any" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Fuente etiquetas ejes (px)
                    <input v-model.number="c.tickFontSize" @input="emitCharts" type="number" min="6" placeholder="12" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Fuente títulos ejes (px)
                    <input v-model.number="c.titleFontSize" @input="emitCharts" type="number" min="6" placeholder="12" class="mt-0.5 w-full border rounded px-2 py-1 text-sm" />
                </label>
            </div>
        </div>

        <!-- Script avanzado (sandbox) -->
        <div class="border-t pt-4 space-y-2">
            <div class="flex items-center justify-between">
                <h3 class="text-xs font-black uppercase text-slate-600">Script avanzado (opcional)</h3>
                <button type="button" class="text-[11px] text-blue-600 hover:underline" @click="showHelp = !showHelp">
                    {{ showHelp ? 'Ocultar ayuda' : 'Ver contrato/ejemplo' }}
                </button>
            </div>
            <p class="text-[11px] text-slate-400">
                JS evaluado en un <b>sandbox</b> (sin acceso a sesión/DOM). Genera imágenes/valores a partir de la data.
                Debe <code class="bg-slate-100 px-1 rounded">return</code> un objeto con <code class="bg-slate-100 px-1 rounded">images</code> y/o <code class="bg-slate-100 px-1 rounded">fields</code>.
            </p>
            <pre v-if="showHelp" class="text-[10px] bg-slate-900 text-slate-100 rounded-md p-3 overflow-auto leading-snug">// Recibes: context (datos de los DAOs), Chart (Chart.js), helpers.
// Devuelve SOLO datos (las imágenes deben ser PNG/JPEG base64 ≤ 5MB).
const rows = context.aspectos || [];
const labels = rows.map(r => r.letra);
const values = rows.map(r => Number(r.puntaje));
const png = helpers.barChart(labels, values, { yMax: 5, yTitle: 'PUNTAJE', xTitle: 'ASPECTOS' });
return { images: { grafica: png }, fields: { total_aspectos: rows.length } };</pre>
            <textarea
                :value="clientScript"
                @input="emitScript(($event.target as HTMLTextAreaElement).value)"
                rows="8"
                spellcheck="false"
                placeholder="// return { images: { grafica: helpers.barChart(labels, values, opts) } }"
                class="w-full border rounded-md px-3 py-2 text-xs font-mono bg-slate-50"
            ></textarea>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { ChartSpec } from '@/modules/reports/types/report.type'

const props = defineProps<{
    charts: ChartSpec[] | null | undefined
    clientScript: string | null | undefined
    sources: string[]
}>()
const emit = defineEmits<{
    (e: 'update:charts', v: ChartSpec[]): void
    (e: 'update:clientScript', v: string): void
}>()

const showHelp = ref(false)
const charts = reactive<ChartSpec[]>((props.charts ?? []).map(c => ({ ...c })))

// Si el padre carga los datos después (async), sincroniza una vez.
watch(() => props.charts, (v) => {
    if (v && charts.length === 0 && v.length) {
        charts.splice(0, charts.length, ...v.map(c => ({ ...c })))
    }
})

function addChart() {
    charts.push({ var: 'grafica', type: 'bar', source: props.sources[0] ?? '', x: '', y: '', color: '#93c5fd' })
    emitCharts()
}
function removeChart(i: number) {
    charts.splice(i, 1)
    emitCharts()
}
function emitCharts() {
    emit('update:charts', charts.map(c => ({ ...c })))
}
function emitScript(v: string) {
    emit('update:clientScript', v)
}
</script>
