<template>
    <div class="space-y-6 max-w-[1600px] mx-auto p-4">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
            <div v-if="studyPlan.id">
                <h2 class="text-lg font-bold text-slate-800 uppercase leading-none">
                    Plan de estudio: {{ studyPlan.officialCode }}
                </h2>
                <p class="text-xs text-slate-500 mt-1 uppercase font-semibold">
                    {{ studyPlan.career?.name }} - {{ studyPlan.periods }} {{ labelPeriod }}s
                </p>
            </div>
            <div v-else class="h-10 w-48 bg-slate-100 animate-pulse rounded"></div>

            <button @click="router.back()" class="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-slate-50 uppercase transition-colors">
                Regresar
            </button>
        </div>

        <!-- Vista Móvil (Acordeones) -->
        <div class="block lg:hidden space-y-4">
            <div v-for="p in studyPlan.periods" :key="'mobile-p-'+p" class="bg-white border rounded-xl overflow-hidden shadow-sm">
                <button
                    @click="togglePeriod(p)"
                    class="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                    <span class="font-bold text-slate-700 uppercase tracking-tight">{{ p }}° {{ labelPeriod }}</span>
                    <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {{ getCurriculumByPeriod(p).length }} MATERIAS
                    </span>
                </button>

                <div v-show="activePeriods.includes(p)" class="border-t overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[400px]">
                        <thead class="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black border-b">
                        <tr>
                            <th class="p-3">Materia</th>
                            <th class="p-3 text-center">HT</th>
                            <th class="p-3 text-center">HP</th>
                            <th class="p-3 text-center">Créditos</th>
                            <th class="p-3 text-right">Acción</th>
                        </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                        <tr v-for="item in getCurriculumByPeriod(p)" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
                            <td class="p-3">
                                <div class="flex items-center gap-2">
                                    <div v-if="item.optional_group_id" class="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                                    <div>
                                        <p class="font-mono text-slate-400 uppercase text-[10px]">{{ item.subject?.officialCode }}</p>
                                        <p class="font-bold text-slate-800 text-xs leading-tight uppercase">{{ item.subject?.name }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="p-3 text-center font-mono text-xs text-slate-600">{{ item.subject?.ht }}</td>
                            <td class="p-3 text-center font-mono text-xs text-slate-600">{{ item.subject?.hp }}</td>
                            <td class="p-3 text-center font-mono text-xs text-slate-600">{{ item.subject?.credits }}</td>
                            <td class="p-3 text-right">
                                <button @click="confirmRemove(item)" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                    <XMarkIcon class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="5" class="p-2">
                                <button @click="openAddModal(p, getNextAvailableLevel(p))" class="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-all uppercase">
                                    + Agregar a este periodo
                                </button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Grid Principal (Desktop) -->
        <div class="hidden lg:block bg-slate-50 p-8 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner relative">
            <!-- Overlay de Modo Vinculación -->
            <div v-if="isLinkingMode" class="absolute inset-0 bg-blue-500/5 pointer-events-none border-4 border-blue-400 rounded-2xl z-40 animate-pulse"></div>

            <div
                class="grid gap-4 mx-auto"
                :style="{
                    gridTemplateColumns: `repeat(${studyPlan.periods || 1}, 200px)`,
                    gridTemplateRows: 'auto repeat(8, 160px)',
                    width: 'max-content'
                }"
            >
                <!-- Cabeceras de Periodos -->
                <div v-for="p in studyPlan.periods" :key="'h-'+p" class="text-center font-black text-slate-400 pb-4 border-b-2 border-slate-200 uppercase tracking-tighter text-[11px] flex items-end justify-center h-12">
                    {{ p }}° {{ labelPeriod }}
                </div>

                <!-- Celdas de la Materia -->
                <template v-for="row in 8" :key="'row-'+row">
                    <template v-for="col in studyPlan.periods" :key="'cell-'+col+'-'+row">

                        <div class="w-[200px] h-[160px]">
                            <SubjectCard
                                v-if="getItemAt(col, row)"
                                :item="getItemAt(col, row)"
                                :is-linking="isLinkingMode"
                                :is-active-link="selectedForLink?.id === getItemAt(col, row).id"
                                :is-potential-req="isLinkingMode && col < selectedForLink?.period"
                                class="w-full h-full"
                                @remove="confirmRemove"
                                @link="handleLinkStart"
                                @move="handleMoveStart"
                                @select-as-req="handleSelectAsRequirement"
                            />

                            <button
                                v-else
                                :disabled="isLinkingMode"
                                @click="openAddModal(col, row)"
                                :class="[
                                    'w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group',
                                    isLinkingMode ? 'border-slate-100 opacity-20' : 'border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white shadow-sm'
                                ]"
                            >
                                <PlusIcon class="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span class="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100">Asignar</span>
                            </button>
                        </div>

                    </template>
                </template>
            </div>
        </div>

        <!-- Panel Flotante de Requisitos -->
        <Transition
            enter-active-class="transform transition ease-out duration-300"
            enter-from-class="translate-y-10 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transform transition ease-in duration-200"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="translate-y-10 opacity-0"
        >
            <div v-if="isLinkingMode" class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-5 rounded-3xl shadow-2xl z-[100] flex items-center gap-10 border border-slate-700">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/50">
                        <LinkIcon class="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <p class="text-xs font-black uppercase tracking-widest text-blue-400">Modo Requisitos</p>
                        <p class="text-[13px] text-slate-300">
                            Selecciona una materia de periodos anteriores para <span class="text-white font-bold">{{ selectedForLink?.subject?.shortName }}</span>
                        </p>
                    </div>
                </div>
                <button @click="isLinkingMode = false" class="px-6 py-2.5 bg-slate-800 hover:bg-red-600 rounded-xl text-xs font-black uppercase transition-all border border-slate-700">
                    Cancelar
                </button>
            </div>
        </Transition>

        <!-- Modal Agregar Materia -->
        <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div class="p-5 border-b bg-slate-50 flex justify-between items-center text-slate-900">
                    <div>
                        <h3 class="font-black uppercase text-sm tracking-tight">Agregar materia</h3>
                        <p class="text-[10px] text-slate-500 uppercase font-bold">P {{ targetCell.period }} • Nivel {{ targetCell.row }}</p>
                    </div>
                    <button @click="showModal = false" class="text-slate-400 hover:text-slate-600"><XMarkIcon class="w-5 h-5"/></button>
                </div>

                <form @submit.prevent="handleAddSubject" class="p-6 space-y-5">
                    <FormRemoteSelect
                        v-if="API?.SUPERADMIN_API?.subjects"
                        label="BUSCAR MATERIA"
                        v-model="newSubjectForm.subjectId"
                        :endpoint="API.SUPERADMIN_API.subjects.list"
                        :endpoint-by-id="API.SUPERADMIN_API.subjects.byId"
                        :params="{ exclude: { study_plan_id: route.params.id } }"
                        item-label="name"
                        item-value="id"
                        placeholder="Buscar materia..."
                        required
                    />

                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <button type="button" @click="showModal = false" class="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Cancelar</button>
                        <button type="submit" :disabled="submitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 uppercase">
                            {{ submitting ? 'Guardando...' : 'Confirmar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal Mover Materia -->
        <div v-if="showMoveModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div class="p-5 border-b bg-slate-50 flex justify-between items-center text-slate-900">
                    <div>
                        <h3 class="font-black uppercase text-sm tracking-tight">Reubicar materia</h3>
                        <p class="text-[10px] text-slate-500 uppercase font-bold">{{ itemToMove?.subject?.name }}</p>
                    </div>
                    <button @click="showMoveModal = false" class="text-slate-400 hover:text-slate-600"><XMarkIcon class="w-5 h-5"/></button>
                </div>

                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase">Nuevo Periodo</label>
                            <select v-model="moveForm.period" class="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-colors">
                                <option v-for="p in studyPlan.periods" :key="p" :value="p">{{ p }}° {{ labelPeriod }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase">Nuevo Nivel (Fila)</label>
                            <select v-model="moveForm.level" class="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-colors">
                                <option v-for="l in 8" :key="l" :value="l">Nivel {{ l }}</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="getItemAt(moveForm.period, moveForm.level) && getItemAt(moveForm.period, moveForm.level).id !== itemToMove?.id" class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <div class="p-1 bg-amber-200 rounded-lg text-amber-700">
                            <XMarkIcon class="w-4 h-4 rotate-45" />
                        </div>
                        <p class="text-[11px] text-amber-800 leading-tight">
                            <span class="font-bold">Aviso:</span> La posición seleccionada ya está ocupada por <span class="font-bold">{{ getItemAt(moveForm.period, moveForm.level)?.subject?.name }}</span>. Se requiere liberar el espacio antes de mover.
                        </p>
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <button type="button" @click="showMoveModal = false" class="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Cancelar</button>
                        <button
                            @click="handleMoveConfirm"
                            :disabled="submitting || (getItemAt(moveForm.period, moveForm.level) && getItemAt(moveForm.period, moveForm.level).id !== itemToMove?.id)"
                            class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 uppercase disabled:opacity-50"
                        >
                            {{ submitting ? 'Moviendo...' : 'Confirmar Cambio' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Confirmar Eliminación -->
        <div v-if="showDeleteModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                <div class="p-8 text-center">
                    <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XMarkIcon class="w-8 h-8" />
                    </div>
                    <h3 class="text-lg font-black text-slate-800 uppercase leading-tight">¿Quitar materia?</h3>
                    <p class="text-slate-500 text-xs mt-2 font-medium uppercase tracking-wide">
                        Estás a punto de quitar <span class="text-slate-900 font-bold">{{ itemToDelete?.subject?.name }}</span> de la malla curricular.
                    </p>
                </div>
                <div class="flex border-t divide-x">
                    <button @click="showDeleteModal = false" class="flex-1 p-4 text-[11px] font-black text-slate-400 hover:bg-slate-50 uppercase transition-colors">
                        Cancelar
                    </button>
                    <button @click="handleRemoveConfirm" :disabled="submitting" class="flex-1 p-4 text-[11px] font-black text-red-600 hover:bg-red-50 uppercase transition-colors disabled:opacity-50">
                        {{ submitting ? 'Quitando...' : 'Sí, Quitar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon, XMarkIcon, LinkIcon } from '@heroicons/vue/24/solid'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { PeriodTypeEnum } from '@/shared/enums/period-type.enum'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import SubjectCard from '@/modules/superadmin/pages/studyplans/editor/SubjectCard.vue'

const route = useRoute()
const router = useRouter()

const studyPlan = ref<any>({})
const curriculum = ref<any[]>([])
const activePeriods = ref<number[]>([1])
const showModal = ref(false)
const submitting = ref(false)
const targetCell = reactive({ period: 0, row: 0 })
const newSubjectForm = reactive({ subjectId: null, optionalGroupId: null })

// Estados para Prerrequisitos
const isLinkingMode = ref(false)
const selectedForLink = ref<any>(null)

// Estados para Mover Materia
const showMoveModal = ref(false)
const itemToMove = ref<any>(null)
const moveForm = reactive({ period: 1, level: 1 })

// Estados para Eliminación
const showDeleteModal = ref(false)
const itemToDelete = ref<any>(null)

const periodTypeMap: Record<string, string> = {
    [PeriodTypeEnum.SEMESTER]: 'SEMESTRE',
    [PeriodTypeEnum.QUARTER]: 'CUATRIMESTRE',
    [PeriodTypeEnum.TRIMESTER]: 'TRIMESTRE'
}

const labelPeriod = computed(() => periodTypeMap[studyPlan.value?.periodType] || 'PERIODO')

const getItemAt = (period: number, level: number) => curriculum.value.find(i => i.period === period && i.level === level)

const getCurriculumByPeriod = (period: number) => curriculum.value.filter(i => i.period === period).sort((a,b) => a.level - b.level)

const togglePeriod = (p: number) => activePeriods.value.includes(p) ? activePeriods.value = activePeriods.value.filter(i => i !== p) : activePeriods.value.push(p)

const getNextAvailableLevel = (period: number) => {
    for (let l = 1; l <= 8; l++) { if (!getItemAt(period, l)) return l }
    return 1
}

const fetchCurriculum = async () => {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.curruculum.list(route.params.id))
        studyPlan.value = data
        curriculum.value = data.curriculums || []
    } catch (e) { console.error(e) }
}

const handleLinkStart = (item: any) => {
    isLinkingMode.value = true
    selectedForLink.value = item
}

const handleSelectAsRequirement = async (requirementItem: any) => {
    try {
        await api.put(API.SUPERADMIN_API.curruculum.update(route.params.id, selectedForLink.value.id), {
            prerequisite_1_id: requirementItem.id
        })
        isLinkingMode.value = false
        selectedForLink.value = null
        fetchCurriculum()
    } catch (e) {
        console.error("Error al asignar requisito", e)
    }
}

// Lógica de Movimiento
const handleMoveStart = (item: any) => {
    itemToMove.value = item
    moveForm.period = item.period
    moveForm.level = item.level
    showMoveModal.value = true
}

const handleMoveConfirm = async () => {
    if (!itemToMove.value) return
    submitting.value = true
    try {
        await api.put(API.SUPERADMIN_API.curruculum.put(route.params.id, itemToMove.value.id), {
            subject_id: itemToMove.value.subjectId,
            period: moveForm.period,
            level: moveForm.level
        })
        showMoveModal.value = false
        fetchCurriculum()
    } catch (e) {
        console.error("Error al mover materia", e)
    } finally {
        submitting.value = false
    }
}

// Lógica de Eliminación con Modal
const confirmRemove = (item: any) => {
    itemToDelete.value = item
    showDeleteModal.value = true
}

const handleRemoveConfirm = async () => {
    if (!itemToDelete.value) return
    submitting.value = true
    try {
        await api.delete(API.SUPERADMIN_API.curruculum.delete(route.params.id, itemToDelete.value))
        showDeleteModal.value = false
        itemToDelete.value = null
        fetchCurriculum()
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
}

const openAddModal = (period: number, row: number) => {
    targetCell.period = period
    targetCell.row = row
    newSubjectForm.subjectId = null
    showModal.value = true
}

const handleAddSubject = async () => {
    submitting.value = true
    try {
        await api.post(API.SUPERADMIN_API.curruculum.create(route.params.id), {
            subject_id: newSubjectForm.subjectId,
            period: targetCell.period,
            level: targetCell.row
        })
        fetchCurriculum()
        showModal.value = false
    } finally { submitting.value = false }
}

onMounted(fetchCurriculum)
</script>
