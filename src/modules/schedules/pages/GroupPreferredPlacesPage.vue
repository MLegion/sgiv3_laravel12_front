<template>
    <div class="space-y-4">
        <header>
            <h1 class="text-xl font-bold text-slate-800 uppercase">Aulas preferidas por grupo</h1>
            <p class="text-xs text-slate-500 mt-1">
                Fija el aula que usará cada grupo en este período. Opcionalmente limita por rango horario
                para compartir un aula entre turnos (ej. matutino 07:00–14:00 y vespertino 14:00–21:00).
                El generador automático lo toma como restricción y la herramienta manual lo pre-selecciona.
            </p>
        </header>

        <!-- ═════ Periodo + Modalidad ═════ -->
        <section class="bg-white border rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Periodo</label>
                <PeriodSelector v-model="selectedPeriodId" @update:model-value="onPeriodChange" placeholder="SELECCIONE UN PERIODO" />
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Campus</label>
                <select v-model="selectedCampusId" @change="resolveConfig"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Tipo modalidad</label>
                <select v-model="selectedModalityTypeId" @change="resolveConfig"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                </select>
            </div>
        </section>

        <div v-if="configError" class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
            {{ configError }}
        </div>

        <!-- ═════ Tabla grupos ═════ -->
        <section v-if="resolvedConfigId && !loading" class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <header class="px-4 py-3 bg-slate-50 border-b flex items-center justify-between gap-3">
                <div>
                    <h2 class="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                        Grupos · {{ groups.length }}
                    </h2>
                    <p class="text-[10px] text-slate-400">Filtra por carrera o nombre si hay muchos grupos.</p>
                </div>
                <input v-model="search" placeholder="Buscar grupo..." type="search"
                    class="border rounded-lg px-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </header>

            <div v-if="filteredGroups.length === 0" class="p-8 text-center text-xs text-slate-400 italic">
                No hay grupos que coincidan.
            </div>

            <table v-else class="min-w-full text-sm">
                <thead class="bg-slate-50 border-b text-[10px] uppercase text-slate-500 font-semibold tracking-wide">
                    <tr>
                        <th class="px-3 py-2 text-left w-32">Grupo</th>
                        <th class="px-3 py-2 text-left w-20 text-center">Turno</th>
                        <th class="px-3 py-2 text-left">Aula preferida</th>
                        <th class="px-3 py-2 text-left w-28 text-center">Desde</th>
                        <th class="px-3 py-2 text-left w-28 text-center">Hasta</th>
                        <th class="px-3 py-2 text-right w-32">Acción</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-for="row in filteredGroups" :key="row.groupId" class="hover:bg-slate-50 transition">
                        <td class="px-3 py-2 font-mono font-bold text-slate-700">{{ row.groupName }}</td>
                        <td class="px-3 py-2 text-center">
                            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                  :class="shiftClass(row.groupShift)">{{ shiftLabel(row.groupShift) }}</span>
                        </td>
                        <td class="px-3 py-2">
                            <select v-model.number="row.placeId"
                                class="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option :value="null">— Sin aula preferida —</option>
                                <option v-for="p in places" :key="p.id" :value="p.id">
                                    {{ p.name }}<template v-if="p.shortName"> · {{ p.shortName }}</template>
                                </option>
                            </select>
                        </td>
                        <td class="px-3 py-2">
                            <input v-model="row.startTime" type="time" :disabled="!row.placeId"
                                class="w-full border rounded-lg px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400" />
                        </td>
                        <td class="px-3 py-2">
                            <input v-model="row.endTime" type="time" :disabled="!row.placeId"
                                class="w-full border rounded-lg px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400" />
                        </td>
                        <td class="px-3 py-2 text-right">
                            <div class="flex justify-end gap-1">
                                <button v-if="row.id && !isDirty(row)"
                                    type="button" class="text-[10px] font-bold uppercase text-slate-400 cursor-default"
                                    disabled>
                                    Guardado
                                </button>
                                <button v-else-if="row.placeId"
                                    type="button" :disabled="row.saving"
                                    class="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    @click="save(row)">
                                    {{ row.saving ? '...' : 'Guardar' }}
                                </button>
                                <button v-if="row.id"
                                    type="button" :disabled="row.saving"
                                    class="px-2 py-1 text-[10px] rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    title="Quitar aula preferida"
                                    @click="clear(row)">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                                    </svg>
                                </button>
                            </div>
                            <p v-if="row.error" class="text-[10px] text-red-600 mt-1 text-right">{{ row.error }}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <div v-if="loading" class="text-center text-sm text-slate-400 italic py-8">Cargando...</div>

        <!-- Flash global -->
        <div v-if="msg.message" class="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
             :class="msg.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'">
            {{ msg.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

interface GroupRow {
    groupId: number
    groupName: string
    groupShift: string | null
    id: number | null          // id de la fila group_preferred_places si existe
    placeId: number | null
    startTime: string | null
    endTime: string | null
    // baseline para detectar dirty
    baselinePlaceId: number | null
    baselineStart: string | null
    baselineEnd: string | null
    saving: boolean
    error: string | null
}

const selectedPeriodId        = ref<number | null>(null)
const selectedCampusId        = ref<number | null>(null)
const selectedModalityTypeId  = ref<number | null>(null)
const resolvedModalityId      = ref<number | null>(null)
const resolvedConfigId        = ref<number | null>(null)
const configError             = ref<string | null>(null)

const campuses      = ref<any[]>([])
const modalityTypes = ref<any[]>([])
const modalities    = ref<any[]>([])
const places        = ref<any[]>([])
const groups        = ref<GroupRow[]>([])

const search  = ref('')
const loading = ref(false)
const msg     = reactive({ ok: true, message: '' })

function flash(ok: boolean, message: string) {
    msg.ok = ok; msg.message = message
    setTimeout(() => { msg.message = '' }, 4000)
}

function shiftLabel(s: string | null): string {
    if (!s) return '—'
    const m: Record<string, string> = { M: 'Mat', V: 'Vesp', N: 'Noct', E: 'Esp' }
    return m[s] ?? s
}
function shiftClass(s: string | null): string {
    if (!s) return 'bg-slate-100 text-slate-500'
    return s === 'M' ? 'bg-amber-100 text-amber-700'
         : s === 'V' ? 'bg-blue-100 text-blue-700'
         : s === 'N' ? 'bg-indigo-100 text-indigo-700'
         : 'bg-slate-100 text-slate-600'
}

function isDirty(r: GroupRow): boolean {
    return r.placeId !== r.baselinePlaceId
        || (r.startTime ?? '') !== (r.baselineStart ?? '')
        || (r.endTime ?? '')   !== (r.baselineEnd ?? '')
}

const filteredGroups = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return groups.value
    return groups.value.filter(g => g.groupName.toLowerCase().includes(q))
})

async function fetchCatalogs() {
    const [camp, mt, mod, pls] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } }).catch(() => ({ data: [] })),
        api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } }).catch(() => ({ data: [] })),
        api.get(API.SCHOOL_SERVICES_API.places.list, { params: { per_page: 500, status: 1 } }).catch(() => ({ data: [] })),
    ])
    campuses.value      = (camp.data?.items ?? camp.data?.data ?? camp.data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName ?? `#${c.id}` }))
    modalityTypes.value = (mt.data?.items ?? mt.data?.data ?? mt.data ?? []).map((m: any) => ({ id: m.id, name: m.name ?? `#${m.id}` }))
    modalities.value    = (mod.data?.items ?? mod.data?.data ?? mod.data ?? [])
    places.value        = (pls.data?.items ?? pls.data?.data ?? pls.data ?? []).filter((p: any) => p.isValidable !== false)
}

function onPeriodChange() {
    resolveConfig()
}

async function resolveConfig() {
    resolvedConfigId.value = null
    resolvedModalityId.value = null
    configError.value = null
    groups.value = []
    if (!selectedPeriodId.value || !selectedCampusId.value || !selectedModalityTypeId.value) return

    // Resolver modality_id
    const modality = modalities.value.find((m: any) =>
        (m.campusId ?? m.campus_id) === selectedCampusId.value &&
        (m.modalityTypeId ?? m.modality_type_id) === selectedModalityTypeId.value,
    )
    if (!modality) {
        configError.value = 'No existe modalidad para este campus y tipo.'
        return
    }
    resolvedModalityId.value = modality.id

    // Resolver academic_load_config
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: {
                per_page: 1,
                search: {
                    college_academic_period_id: selectedPeriodId.value,
                    modality_id: resolvedModalityId.value,
                },
            },
        })
        const items = data?.items ?? data?.data ?? []
        if (!items.length) {
            configError.value = 'No existe configuración de carga académica para este periodo y modalidad.'
            return
        }
        resolvedConfigId.value = items[0].id
        await loadGroups()
    } catch (e: any) {
        configError.value = e?.response?.data?.message ?? 'Error al resolver configuración.'
    }
}

async function loadGroups() {
    if (!resolvedConfigId.value) return
    loading.value = true
    try {
        const [groupsRes, prefRes] = await Promise.all([
            api.get(API.SCA_API.groups.list(resolvedConfigId.value)),
            api.get(API.SCHEDULES_API.groupPreferredPlaces.list, {
                params: { academic_load_config_id: resolvedConfigId.value },
            }),
        ])
        const rawGroups = groupsRes.data?.items ?? groupsRes.data?.data ?? groupsRes.data ?? []
        const prefs = prefRes.data ?? []
        const prefByGroup = new Map<number, any>()
        for (const p of prefs) prefByGroup.set(p.groupId, p)

        groups.value = rawGroups
            .map((g: any) => {
                const pref = prefByGroup.get(g.id)
                return {
                    groupId:    g.id,
                    groupName:  g.name,
                    groupShift: g.shift ?? null,
                    id:              pref?.id ?? null,
                    placeId:         pref?.placeId ?? null,
                    startTime:       pref?.startTime ?? null,
                    endTime:         pref?.endTime ?? null,
                    baselinePlaceId: pref?.placeId ?? null,
                    baselineStart:   pref?.startTime ?? null,
                    baselineEnd:     pref?.endTime ?? null,
                    saving: false,
                    error:  null,
                } as GroupRow
            })
            .sort((a: GroupRow, b: GroupRow) => a.groupName.localeCompare(b.groupName))
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al cargar grupos.')
    } finally {
        loading.value = false
    }
}

async function save(row: GroupRow) {
    if (!row.placeId) return
    row.saving = true
    row.error = null
    try {
        const payload = {
            group_id:   row.groupId,
            place_id:   row.placeId,
            start_time: row.startTime || null,
            end_time:   row.endTime   || null,
        }
        const { data } = await api.post(API.SCHEDULES_API.groupPreferredPlaces.create, payload)
        row.id              = data.id
        row.baselinePlaceId = row.placeId
        row.baselineStart   = row.startTime
        row.baselineEnd     = row.endTime
        flash(true, `Aula asignada al grupo ${row.groupName}.`)
    } catch (e: any) {
        row.error = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        row.saving = false
    }
}

async function clear(row: GroupRow) {
    if (!row.id) return
    if (!confirm(`¿Quitar el aula preferida del grupo ${row.groupName}?`)) return
    row.saving = true
    row.error = null
    try {
        await api.delete(API.SCHEDULES_API.groupPreferredPlaces.delete(row.id))
        row.id              = null
        row.placeId         = null
        row.startTime       = null
        row.endTime         = null
        row.baselinePlaceId = null
        row.baselineStart   = null
        row.baselineEnd     = null
        flash(true, `Aula quitada del grupo ${row.groupName}.`)
    } catch (e: any) {
        row.error = e?.response?.data?.message ?? 'Error al quitar.'
    } finally {
        row.saving = false
    }
}

onMounted(fetchCatalogs)
</script>
