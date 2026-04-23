<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Restricciones de Horario por Materia</h1>
            <p class="text-sm text-slate-500 mt-1">
                Bloquea ventanas horarias en las que una materia específica no debe impartirse en este college
                (p. ej. "no dar CALC. INTEGRAL antes de las 10:00" o "no viernes por la tarde").
            </p>
        </div>

        <div v-if="globalMsg.message" class="text-sm px-4 py-3 rounded-lg"
            :class="globalMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
            {{ globalMsg.message }}
        </div>

        <!-- ─────── Selector de materia ─────── -->
        <section class="bg-white border rounded-xl shadow-sm p-5">
            <label class="block max-w-xl">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Materia</span>
                <FormRemoteSelect
                    v-model="selectedSubjectId"
                    :endpoint="API.SUPERADMIN_API.subjects.list"
                    :endpoint-by-id="API.SUPERADMIN_API.subjects.byId"
                    :item-label="subjectLabel"
                    item-value="id"
                    :item-searchs="['name', 'short_name', 'official_code']"
                    placeholder="Buscar materia (por clave o nombre)…"
                />
            </label>
        </section>

        <!-- ─────── Editor de restricciones ─────── -->
        <section v-if="selectedSubjectId" class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <header class="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
                <h2 class="text-sm font-black uppercase tracking-wider text-slate-800">
                    Restricciones configuradas
                </h2>
                <span class="text-[10px] text-slate-400">{{ restrictions.length }} regla(s)</span>
            </header>

            <div class="p-5 space-y-6">
                <!-- Form agregar -->
                <form class="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border rounded-lg bg-slate-50"
                    @submit.prevent="createRule">
                    <label class="md:col-span-2 block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo de modalidad <span class="text-red-500">*</span></span>
                        <select v-model="form.modalityTypeId" @change="onModalityTypeChange" required
                            class="mt-1 w-full h-9 border rounded-md px-2 text-sm">
                            <option :value="null" disabled>— SELECCIONE —</option>
                            <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.shortName }}</option>
                        </select>
                        <span class="text-[10px] text-slate-400 mt-0.5 block">
                            <template v-if="selectedModalityUsesDates">
                                Esta modalidad trabaja con <strong>fechas específicas</strong>.
                            </template>
                            <template v-else-if="form.modalityTypeId !== null">
                                Esta modalidad trabaja con <strong>días de la semana</strong> recurrentes.
                            </template>
                            <template v-else>
                                Selecciona una modalidad — cada una usa un modelo temporal distinto.
                            </template>
                        </span>
                    </label>

                    <!-- Día de la semana: sólo si NO usa fechas específicas -->
                    <label v-if="form.modalityTypeId !== null && !selectedModalityUsesDates" class="block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Día <span class="text-red-500">*</span></span>
                        <select v-model="form.dayOfWeek" required class="mt-1 w-full h-9 border rounded-md px-2 text-sm">
                            <option :value="null" disabled>—</option>
                            <option v-for="d in DAYS" :key="d.value" :value="d.value">{{ d.label }}</option>
                        </select>
                    </label>

                    <!-- Fecha específica: sólo si usa fechas -->
                    <label v-if="form.modalityTypeId !== null && selectedModalityUsesDates" class="block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha <span class="text-red-500">*</span></span>
                        <input v-model="form.specificDate" type="date" required class="mt-1 w-full h-9 border rounded-md px-2 text-sm" />
                    </label>

                    <label class="block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inicio</span>
                        <input v-model="form.startTime" type="time" class="mt-1 w-full h-9 border rounded-md px-2 text-sm" required />
                    </label>

                    <label class="block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fin</span>
                        <input v-model="form.endTime" type="time" class="mt-1 w-full h-9 border rounded-md px-2 text-sm" required />
                    </label>

                    <label class="block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo</span>
                        <select v-model="form.kind" class="mt-1 w-full h-9 border rounded-md px-2 text-sm">
                            <option value="forbidden">PROHIBIDA</option>
                            <option value="preferred">PREFERIDA</option>
                        </select>
                    </label>

                    <label class="md:col-span-4 block">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Motivo / Nota</span>
                        <input v-model="form.reason" type="text" maxlength="200" placeholder="Opcional"
                            class="mt-1 w-full h-9 border rounded-md px-2 text-sm" />
                    </label>

                    <div class="md:col-span-2 flex justify-end items-end">
                        <button
                            type="submit"
                            :disabled="saving"
                            class="px-4 py-2 text-xs font-bold uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {{ saving ? 'Guardando…' : 'Agregar regla' }}
                        </button>
                    </div>
                </form>

                <!-- Lista -->
                <div v-if="loading" class="p-4 text-sm text-slate-400 text-center">Cargando…</div>
                <table v-else-if="restrictions.length" class="w-full text-xs">
                    <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                        <tr>
                            <th class="px-3 py-2 text-left">Modalidad</th>
                            <th class="px-3 py-2 text-left">Día / Fecha</th>
                            <th class="px-3 py-2 text-center">Rango</th>
                            <th class="px-3 py-2 text-center">Tipo</th>
                            <th class="px-3 py-2 text-left">Motivo</th>
                            <th class="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="r in restrictions" :key="r.id">
                            <td class="px-3 py-2 text-slate-600">{{ r.modalityType?.shortName ?? '—' }}</td>
                            <td class="px-3 py-2 text-slate-700 font-medium">
                                <template v-if="r.specificDate">{{ r.specificDate }}</template>
                                <template v-else>{{ dayLabel(r.dayOfWeek) }}</template>
                            </td>
                            <td class="px-3 py-2 text-center font-mono text-slate-700">{{ r.startTime }} — {{ r.endTime }}</td>
                            <td class="px-3 py-2 text-center">
                                <span v-if="r.kind === 'forbidden'" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">PROHIBIDA</span>
                                <span v-else class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">PREFERIDA</span>
                            </td>
                            <td class="px-3 py-2 text-slate-500">{{ r.reason || '—' }}</td>
                            <td class="px-3 py-2 text-right">
                                <button type="button" class="text-red-600 hover:text-red-800" title="Eliminar" @click="deleteRule(r)">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="p-6 text-center text-xs text-slate-400 italic">
                    Sin restricciones para esta materia. Agrega una con el formulario de arriba.
                </p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

interface ModalityType {
    id: number
    name: string
    shortName: string
    usesSpecificDates: boolean
}
interface Restriction {
    id: number
    subjectId: number
    modalityTypeId: number
    modalityType: { id: number; name: string; shortName: string } | null
    dayOfWeek: number | null
    specificDate: string | null
    startTime: string
    endTime: string
    kind: 'forbidden' | 'preferred'
    reason: string | null
}

const DAYS = [
    { value: 1, label: 'LUN' },
    { value: 2, label: 'MAR' },
    { value: 3, label: 'MIÉ' },
    { value: 4, label: 'JUE' },
    { value: 5, label: 'VIE' },
    { value: 6, label: 'SÁB' },
    { value: 7, label: 'DOM' },
]

const modalityTypes = ref<ModalityType[]>([])
const selectedSubjectId = ref<number | null>(null)
const restrictions = ref<Restriction[]>([])
const loading = ref(false)
const saving = ref(false)

const form = reactive<{
    modalityTypeId: number | null
    dayOfWeek: number | null
    specificDate: string
    startTime: string
    endTime: string
    kind: 'forbidden' | 'preferred'
    reason: string
}>({
    modalityTypeId: null,
    dayOfWeek: 1,
    specificDate: '',
    startTime: '07:00',
    endTime: '10:00',
    kind: 'forbidden',
    reason: '',
})

const selectedModalityUsesDates = computed(() => {
    if (form.modalityTypeId === null) return false
    return modalityTypes.value.find(m => m.id === form.modalityTypeId)?.usesSpecificDates ?? false
})

function onModalityTypeChange() {
    if (selectedModalityUsesDates.value) {
        form.dayOfWeek = null
    } else {
        form.specificDate = ''
    }
}

const globalMsg = reactive<{ ok: boolean; message: string }>({ ok: true, message: '' })
function flash(ok: boolean, message: string) {
    globalMsg.ok = ok
    globalMsg.message = message
    setTimeout(() => { globalMsg.message = '' }, 4000)
}

function dayLabel(d: number | null): string {
    if (!d) return 'TODOS'
    return DAYS.find(x => x.value === d)?.label ?? String(d)
}

function subjectLabel(item: any): string {
    const code = item?.official_code ?? item?.officialCode ?? ''
    const name = item?.name ?? ''
    return code ? `${code} — ${name}` : name
}

async function loadModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        modalityTypes.value = (data?.items ?? data?.data ?? data ?? [])
            .map((m: any) => ({
                id:                m.id,
                name:              m.name,
                shortName:         m.shortName ?? m.short_name ?? '',
                usesSpecificDates: !!(m.config?.schedule?.uses_specific_dates),
            }))
    } catch {
        modalityTypes.value = []
    }
}

async function loadRestrictions() {
    if (!selectedSubjectId.value) { restrictions.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(API.SCA_API.scheduleRules.subjectRestriction.list, {
            params: { subject_id: selectedSubjectId.value },
        })
        restrictions.value = data ?? []
    } catch (e: any) {
        restrictions.value = []
        flash(false, e?.response?.data?.message ?? 'Error al cargar restricciones.')
    } finally {
        loading.value = false
    }
}

async function createRule() {
    if (!selectedSubjectId.value) return
    saving.value = true
    try {
        const payload: Record<string, any> = {
            subject_id:       selectedSubjectId.value,
            modality_type_id: form.modalityTypeId,
            start_time:       form.startTime,
            end_time:         form.endTime,
            kind:             form.kind,
            reason:           form.reason || null,
        }
        if (selectedModalityUsesDates.value) {
            payload.specific_date = form.specificDate
            payload.day_of_week   = null
        } else {
            payload.day_of_week   = form.dayOfWeek
            payload.specific_date = null
        }
        const { data } = await api.post(API.SCA_API.scheduleRules.subjectRestriction.create, payload)
        restrictions.value.push(data)
        form.reason = ''
        flash(true, 'Restricción agregada.')
    } catch (e: any) {
        flash(false, e?.response?.data?.message
            ?? e?.response?.data?.errors?.modality_type_id?.[0]
            ?? e?.response?.data?.errors?.day_of_week?.[0]
            ?? e?.response?.data?.errors?.specific_date?.[0]
            ?? e?.response?.data?.errors?.start_time?.[0]
            ?? e?.response?.data?.errors?.end_time?.[0]
            ?? 'Error al guardar.')
    } finally {
        saving.value = false
    }
}

async function deleteRule(r: Restriction) {
    if (!confirm('¿Eliminar esta restricción?')) return
    try {
        await api.delete(API.SCA_API.scheduleRules.subjectRestriction.delete(r.id))
        restrictions.value = restrictions.value.filter(x => x.id !== r.id)
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al eliminar.')
    }
}

watch(selectedSubjectId, () => loadRestrictions())

onMounted(loadModalityTypes)
</script>
