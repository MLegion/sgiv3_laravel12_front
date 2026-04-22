<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Reglas de Horario por Modalidad</h1>
            <p class="text-sm text-slate-500 mt-1">
                Define para cada tipo de modalidad los límites que el validador aplicará al crear/editar horarios académicos en este college.
            </p>
        </div>

        <div v-if="globalMsg.message" class="text-sm px-4 py-3 rounded-lg"
            :class="globalMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
            {{ globalMsg.message }}
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Cargando modalidades…
        </div>

        <div v-else-if="modalityTypes.length === 0" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            No hay tipos de modalidad configurados.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section
                v-for="mt in modalityTypes"
                :key="mt.id"
                class="bg-white border rounded-xl shadow-sm overflow-hidden"
            >
                <header class="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
                    <div>
                        <h2 class="text-sm font-black uppercase tracking-wider text-slate-800">{{ mt.name }}</h2>
                        <p class="text-[10px] text-slate-400">{{ mt.shortName }}</p>
                    </div>
                    <span v-if="forms[mt.id].id" class="text-[10px] text-emerald-600 font-bold uppercase">Configurada</span>
                    <span v-else class="text-[10px] text-slate-400 font-bold uppercase">Sin reglas</span>
                </header>

                <div class="p-5 space-y-4">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-600">Máx. bloques consecutivos</span>
                        <input
                            type="number" min="1" max="20"
                            v-model.number="forms[mt.id].maxConsecutiveBlocks"
                            placeholder="(sin límite)"
                            class="mt-1 w-full h-9 border rounded-md px-3 text-sm"
                        />
                        <span class="text-[10px] text-slate-400">Cuántos bloques pueden encadenarse seguidos sin hueco.</span>
                    </label>

                    <label class="block">
                        <span class="text-xs font-semibold text-slate-600">Máx. bloques por día (docente)</span>
                        <input
                            type="number" min="1" max="20"
                            v-model.number="forms[mt.id].maxBlocksPerDayTeacher"
                            placeholder="(sin límite)"
                            class="mt-1 w-full h-9 border rounded-md px-3 text-sm"
                        />
                        <span class="text-[10px] text-slate-400">Total de bloques que un docente puede impartir en un mismo día.</span>
                    </label>

                    <label class="block">
                        <span class="text-xs font-semibold text-slate-600">Minutos mínimos entre bloques</span>
                        <input
                            type="number" min="0" max="480"
                            v-model.number="forms[mt.id].minGapBetweenBlocksMinutes"
                            class="mt-1 w-full h-9 border rounded-md px-3 text-sm"
                        />
                        <span class="text-[10px] text-slate-400">Descanso mínimo entre dos bloques del mismo docente (0 = sin mínimo).</span>
                    </label>

                    <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            v-model="forms[mt.id].allowGapsSameDay"
                        />
                        <span class="text-xs text-slate-700">Permitir huecos en el mismo día</span>
                    </label>
                    <p class="text-[10px] text-slate-400 -mt-2">
                        Si está apagado, los bloques del docente en el mismo día deben ser totalmente consecutivos.
                    </p>

                    <div class="flex items-center justify-end gap-2 pt-2 border-t">
                        <span v-if="forms[mt.id].savedFlash" class="text-[10px] text-emerald-600 font-bold uppercase">
                            ✓ Guardado
                        </span>
                        <button
                            type="button"
                            :disabled="forms[mt.id].saving"
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 uppercase"
                            @click="save(mt.id)"
                        >
                            {{ forms[mt.id].saving ? 'Guardando…' : 'Guardar reglas' }}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface ModalityType { id: number; name: string; shortName: string }
interface RuleForm {
    id: number | null
    maxConsecutiveBlocks: number | null
    maxBlocksPerDayTeacher: number | null
    minGapBetweenBlocksMinutes: number
    allowGapsSameDay: boolean
    saving: boolean
    savedFlash: boolean
}

const loading = ref(true)
const modalityTypes = ref<ModalityType[]>([])
const forms = reactive<Record<number, RuleForm>>({})
const globalMsg = reactive<{ ok: boolean; message: string }>({ ok: true, message: '' })

function emptyForm(): RuleForm {
    return {
        id: null,
        maxConsecutiveBlocks: null,
        maxBlocksPerDayTeacher: null,
        minGapBetweenBlocksMinutes: 0,
        allowGapsSameDay: true,
        saving: false,
        savedFlash: false,
    }
}

function flash(ok: boolean, message: string) {
    globalMsg.ok = ok
    globalMsg.message = message
    setTimeout(() => { globalMsg.message = '' }, 4000)
}

async function loadAll() {
    loading.value = true
    try {
        const [mtRes, rulesRes] = await Promise.all([
            api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }),
            api.get(API.SCA_API.scheduleRules.modality.list),
        ])
        modalityTypes.value = (mtRes.data?.items ?? mtRes.data?.data ?? mtRes.data ?? [])
            .map((m: any) => ({ id: m.id, name: m.name, shortName: m.shortName ?? m.short_name ?? '' }))

        for (const mt of modalityTypes.value) {
            if (!forms[mt.id]) forms[mt.id] = emptyForm()
        }

        const rules = Array.isArray(rulesRes.data) ? rulesRes.data : (rulesRes.data?.items ?? [])
        for (const r of rules) {
            const mtId = r.modalityTypeId ?? r.modality_type_id
            if (!mtId || !forms[mtId]) continue
            forms[mtId].id                           = r.id
            forms[mtId].maxConsecutiveBlocks         = r.maxConsecutiveBlocks ?? null
            forms[mtId].maxBlocksPerDayTeacher       = r.maxBlocksPerDayTeacher ?? null
            forms[mtId].minGapBetweenBlocksMinutes   = r.minGapBetweenBlocksMinutes ?? 0
            forms[mtId].allowGapsSameDay             = r.allowGapsSameDay ?? true
        }
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al cargar reglas.')
    } finally {
        loading.value = false
    }
}

async function save(modalityTypeId: number) {
    const f = forms[modalityTypeId]
    f.saving = true
    try {
        const payload = {
            max_consecutive_blocks:          f.maxConsecutiveBlocks ?? null,
            max_blocks_per_day_teacher:      f.maxBlocksPerDayTeacher ?? null,
            min_gap_between_blocks_minutes:  f.minGapBetweenBlocksMinutes ?? 0,
            allow_gaps_same_day:             !!f.allowGapsSameDay,
        }
        const { data } = await api.put(
            API.SCA_API.scheduleRules.modality.upsert(modalityTypeId),
            payload,
        )
        f.id = data.id ?? f.id
        f.savedFlash = true
        setTimeout(() => { f.savedFlash = false }, 2000)
    } catch (e: any) {
        flash(false, e?.response?.data?.message
            ?? e?.response?.data?.errors?.max_consecutive_blocks?.[0]
            ?? e?.response?.data?.errors?.max_blocks_per_day_teacher?.[0]
            ?? 'Error al guardar las reglas.')
    } finally {
        f.saving = false
    }
}

onMounted(loadAll)
</script>
