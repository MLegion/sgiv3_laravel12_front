<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-lg font-bold text-slate-800 uppercase">Configuración de Carreras</h1>
        </div>

        <!-- Cargando -->
        <div v-if="loading" class="flex justify-center py-12">
            <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Tabla -->
        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                        <th class="px-4 py-2.5 w-16 text-center">ID</th>
                        <th class="px-4 py-2.5 w-24">Clave</th>
                        <th class="px-4 py-2.5">Carrera</th>
                        <th class="px-4 py-2.5 w-56">Formato de Grupo</th>
                        <th class="px-4 py-2.5 w-24 text-center">Color</th>
                        <th class="px-4 py-2.5 w-24 text-center">Preview</th>
                        <th class="px-4 py-2.5 w-20 text-center">Acción</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="item in careers" :key="item.careerId" class="hover:bg-slate-50 transition">
                        <td class="px-4 py-3 text-center text-xs text-slate-400 font-bold">{{ item.careerId }}</td>
                        <td class="px-4 py-3 text-xs font-bold text-slate-600 uppercase">{{ item.careerCode }}</td>
                        <td class="px-4 py-3 text-sm font-bold text-slate-800 uppercase">{{ item.careerName }}</td>
                        <td class="px-4 py-3">
                            <span class="text-xs font-mono text-slate-600">{{ item.groupFormat || '—' }}</span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-1.5">
                                <span class="w-5 h-5 rounded-full border inline-block" :style="{ backgroundColor: item.careerColor || '#e2e8f0' }"></span>
                                <span class="text-[10px] font-mono text-slate-400">{{ item.careerColor || '—' }}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span v-if="item.groupFormat"
                                class="px-2 py-0.5 rounded text-[10px] font-bold border inline-block"
                                :style="colorStyle(item.careerColor)">
                                {{ previewGroupName(item, item.groupFormat, item.careerCode) }}
                            </span>
                            <span v-else class="text-[10px] text-slate-300">—</span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <button @click="openModal(item)"
                                class="px-3 py-1 text-[10px] font-bold rounded bg-blue-100 text-blue-600 hover:bg-blue-200 uppercase">
                                Editar
                            </button>
                        </td>
                    </tr>

                    <tr v-if="careers.length === 0">
                        <td colspan="7" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            No hay carreras configuradas. Registra ofertas académicas primero.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal de edición -->
        <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="modal.open = false">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-5">
                <!-- Título -->
                <div>
                    <h3 class="text-sm font-bold text-slate-800 uppercase">Configurar Carrera</h3>
                    <p class="text-xs text-slate-500 mt-1">{{ modal.careerCode }} — {{ modal.careerName }}</p>
                </div>

                <!-- Color -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Color de la Carrera</label>
                    <div class="flex items-center gap-3">
                        <input type="color" v-model="modal.careerColor" class="w-10 h-10 rounded cursor-pointer border-2 border-slate-200 p-0" />
                        <input type="text" v-model="modal.careerColor" maxlength="7" placeholder="#3B82F6"
                            class="border-2 rounded-lg px-3 py-2 text-sm font-mono border-slate-200 focus:border-blue-500 outline-none w-28 uppercase" />
                        <span class="w-8 h-8 rounded-full border" :style="{ backgroundColor: modal.careerColor || '#e2e8f0' }"></span>
                    </div>
                </div>

                <!-- Formato -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Formato de Grupo</label>
                    <input v-model="modal.groupFormat"
                        placeholder="[D,numberPeriod][DD,carreraId]-[L,sec]"
                        class="w-full border-2 rounded-lg px-3 py-2 text-sm font-mono border-slate-200 focus:border-blue-500 outline-none" />
                </div>

                <!-- Preview en vivo -->
                <div v-if="modal.groupFormat" class="bg-slate-50 border rounded-lg px-4 py-3 flex items-center gap-3">
                    <span class="text-[10px] font-black text-slate-400 uppercase">Preview:</span>
                    <span class="px-3 py-1 rounded text-sm font-bold border"
                        :style="colorStyle(modal.careerColor)">
                        {{ previewGroupName(modal, modal.groupFormat, modal.careerCode) }}
                    </span>
                    <span class="text-[10px] text-slate-400">(semestre 5, grupo A)</span>
                </div>

                <!-- Referencia de variables -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <h4 class="text-[10px] font-black text-blue-600 uppercase mb-2">Variables disponibles</h4>
                    <table class="w-full text-xs">
                        <tbody class="divide-y divide-blue-100">
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[D,numberPeriod]</td>
                                <td class="py-1.5 text-slate-600">Semestre, 1 dígito</td>
                                <td class="py-1.5 text-slate-400 text-right">5 &rarr; <b>5</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[DD,numberPeriod]</td>
                                <td class="py-1.5 text-slate-600">Semestre, 2 dígitos con cero</td>
                                <td class="py-1.5 text-slate-400 text-right">5 &rarr; <b>05</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[D,carreraId]</td>
                                <td class="py-1.5 text-slate-600">ID de carrera, sin padding</td>
                                <td class="py-1.5 text-slate-400 text-right">{{ modal.careerId }} &rarr; <b>{{ modal.careerId }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[DD,carreraId]</td>
                                <td class="py-1.5 text-slate-600">ID de carrera, 2 dígitos</td>
                                <td class="py-1.5 text-slate-400 text-right">{{ modal.careerId }} &rarr; <b>{{ String(modal.careerId).padStart(2, '0') }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[DDD,carreraId]</td>
                                <td class="py-1.5 text-slate-600">ID de carrera, 3 dígitos</td>
                                <td class="py-1.5 text-slate-400 text-right">{{ modal.careerId }} &rarr; <b>{{ String(modal.careerId).padStart(3, '0') }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[C,officialCode]</td>
                                <td class="py-1.5 text-slate-600">Clave de carrera completa</td>
                                <td class="py-1.5 text-slate-400 text-right"><b>{{ modal.careerCode }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[CC,officialCode]</td>
                                <td class="py-1.5 text-slate-600">Clave a 2 chars, rellena con 0</td>
                                <td class="py-1.5 text-slate-400 text-right">{{ modal.careerCode }} &rarr; <b>{{ (modal.careerCode || '').substring(0, 2).padStart(2, '0') }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[CCC,officialCode]</td>
                                <td class="py-1.5 text-slate-600">Clave a 3 chars, rellena con 0</td>
                                <td class="py-1.5 text-slate-400 text-right">{{ modal.careerCode }} &rarr; <b>{{ (modal.careerCode || '').substring(0, 3).padStart(3, '0') }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[CC,officialCode,X]</td>
                                <td class="py-1.5 text-slate-600">Clave a 2 chars, rellena con X (cualquier carácter)</td>
                                <td class="py-1.5 text-slate-400 text-right">{{ modal.careerCode }} &rarr; <b>{{ (modal.careerCode || '').substring(0, 2).padStart(2, 'X') }}</b></td>
                            </tr>
                            <tr>
                                <td class="py-1.5 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">[L,sec]</td>
                                <td class="py-1.5 text-slate-600">Letra consecutiva</td>
                                <td class="py-1.5 text-slate-400 text-right"><b>A</b>, B, C...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Botones -->
                <div class="flex justify-end gap-2 pt-2">
                    <button @click="modal.open = false"
                        class="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase">
                        Cancelar
                    </button>
                    <button @click="saveModal" :disabled="saving"
                        class="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 uppercase">
                        {{ saving ? 'Guardando...' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface CareerSetting {
    careerId: number
    careerCode: string
    careerName: string
    groupFormat: string
    careerColor: string
}

const loading = ref(true)
const saving = ref(false)
const careers = ref<CareerSetting[]>([])

const modal = reactive({
    open: false,
    careerId: 0,
    careerCode: '',
    careerName: '',
    groupFormat: '',
    careerColor: '#3B82F6',
})

function colorStyle(color: string) {
    const c = color || '#94a3b8'
    return { borderColor: c, backgroundColor: c + '20', color: '#1e293b' }
}

function previewGroupName(item: { careerId: number }, format: string, code: string): string {
    let name = format || '[D,numberPeriod][DD,carreraId]-[L,sec]'
    name = name.replace(/\[D,numberPeriod\]/gi, '5')
    name = name.replace(/\[DD,numberPeriod\]/gi, '05')
    name = name.replace(/\[D,carreraId\]/gi, String(item.careerId))
    name = name.replace(/\[DD,carreraId\]/gi, String(item.careerId).padStart(2, '0'))
    name = name.replace(/\[DDD,carreraId\]/gi, String(item.careerId).padStart(3, '0'))
    name = name.replace(/\[C,officialCode\]/gi, code)
    // [CC+,officialCode] o [CC+,officialCode,<char>]
    name = name.replace(/\[(C{2,}),officialCode(?:,(.))?]/gi, (_m, cs: string, pad: string) => {
        const len = cs.length
        const p = pad || '0'
        return (code || '').substring(0, len).padStart(len, p)
    })
    name = name.replace(/\[L,sec\]/gi, 'A')
    return name
}

function openModal(item: CareerSetting) {
    modal.careerId = item.careerId
    modal.careerCode = item.careerCode
    modal.careerName = item.careerName
    modal.groupFormat = item.groupFormat
    modal.careerColor = item.careerColor || '#3B82F6'
    modal.open = true
}

async function saveModal() {
    saving.value = true
    try {
        await api.post(API.SCHOOL_SERVICES_API.collegeCareerSettings.upsert, {
            career_id: modal.careerId,
            group_format: modal.groupFormat || null,
            career_color: modal.careerColor || null,
        })
        const target = careers.value.find(c => c.careerId === modal.careerId)
        if (target) {
            target.groupFormat = modal.groupFormat
            target.careerColor = modal.careerColor
        }
        modal.open = false
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Error al guardar')
    } finally {
        saving.value = false
    }
}

async function fetchData() {
    loading.value = true
    try {
        const { data: offersData } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200 } })
        const offers = offersData?.items ?? offersData?.data ?? offersData ?? []

        const careerMap = new Map<number, { id: number; code: string; name: string }>()
        for (const offer of offers) {
            const career = offer.career ?? offer.careerData
            const careerId = career?.id ?? offer.careerId ?? offer.career_id
            if (careerId && !careerMap.has(careerId)) {
                careerMap.set(careerId, {
                    id: careerId,
                    code: career?.official_code ?? career?.officialCode ?? '',
                    name: career?.name ?? '',
                })
            }
        }

        const { data: settingsData } = await api.get(API.SCHOOL_SERVICES_API.collegeCareerSettings.list)
        const settings = settingsData ?? []
        const settingsMap = new Map<number, any>()
        for (const s of settings) {
            settingsMap.set(s.careerId, s)
        }

        careers.value = Array.from(careerMap.values())
            .sort((a, b) => a.code.localeCompare(b.code))
            .map(c => {
                const existing = settingsMap.get(c.id)
                return {
                    careerId: c.id,
                    careerCode: c.code,
                    careerName: c.name,
                    groupFormat: existing?.groupFormat ?? '',
                    careerColor: existing?.careerColor ?? '',
                }
            })
    } catch (e) {
        console.error('Error loading career settings:', e)
        careers.value = []
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)
</script>
