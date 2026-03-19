<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    PlusIcon,
    XMarkIcon,
    AcademicCapIcon,
    StarIcon,
    ArrowPathIcon,
    CursorArrowRaysIcon,
    ChevronDownIcon
} from '@heroicons/vue/24/solid'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { PeriodTypeEnum } from '@/shared/enums/period-type.enum'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import SubjectCard from '@/modules/superadmin/pages/studyplans/editor/SubjectCard.vue'

/**
 * SpecialtyEditor.vue - Versión Adaptativa SGIv3
 */

const route = useRoute()
const router = useRouter()
const specialtyId = route.params.id as string

// Estados de Datos
const specialty = ref<any>({})
const studyPlan = ref<any>({})
const curriculum = ref<any[]>([])
const loading = ref(true)
const submitting = ref(false)

// Estados de UI
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const showMoveModal = ref(false)
const activePeriods = ref<number[]>([1]) // Para acordeones móviles
const movingItem = ref<any>(null)

// Formularios
const targetCell = reactive({ period: 0, level: 0 })
const moveForm = reactive({ period: 1, level: 1 })
const newSubjectForm = reactive({ subjectId: null })
const itemToDelete = ref<any>(null)
const itemToMove = ref<any>(null)

const periodTypeMap: Record<string, string> = {
    [PeriodTypeEnum.SEMESTER]: 'SEM',
    [PeriodTypeEnum.QUARTER]: 'CUATRI',
    [PeriodTypeEnum.TRIMESTER]: 'TRI'
}

const labelPeriod = computed(() => periodTypeMap[studyPlan.value?.periodType] || 'PER')

const fetchData = async () => {
    loading.value = true
    try {
        const specRes = await api.get(API.SUPERADMIN_API.specialties.byId(specialtyId))
        specialty.value = specRes.data
        const planRes = await api.get(API.SUPERADMIN_API.curriculum.list(specialty.value.studyPlanId) + `?specialty_id=${specialtyId}`)
        studyPlan.value = planRes.data
        curriculum.value = planRes.data.curriculums || []
    } catch (e) {
        console.error("Error SGI-Core:", e)
    } finally {
        loading.value = false
    }
}

// Helpers de lógica
const getItemAt = (period: number, level: number) => {
    return curriculum.value.find(i => i.period === period && i.level === level)
}

const getCurriculumByPeriod = (period: number) => {
    return curriculum.value.filter(i => i.period === period).sort((a, b) => a.level - b.level)
}

const isSpecialtyItem = (item: any) => {
    if (!item) return false
    return String(item.specialtyId) === String(specialtyId) ||
        String(item.subject?.specialtyId) === String(specialtyId)
}

const togglePeriod = (p: number) => {
    const index = activePeriods.value.indexOf(p)
    if (index > -1) activePeriods.value.splice(index, 1)
    else activePeriods.value.push(p)
}

// --- ACCIONES ---

const openAddModal = (p: number, l: number) => {
    targetCell.period = p
    targetCell.level = l
    newSubjectForm.subjectId = null
    showModal.value = true
}

const onMoveItem = (payload) => {
    if (!isSpecialtyItem(payload)) return
    itemToMove.value = payload
    moveForm.period = payload.period
    moveForm.level = payload.level
    showMoveModal.value = true
}

const handleMoveConfirm = async () => {
    if (!itemToMove.value) return
    submitting.value = true
    try {
        await api.patch(API.SUPERADMIN_API.curriculum.update(studyPlan.value.id, itemToMove.value.id), {
            period: moveForm.period,
            level: moveForm.level,
            specialty_id: specialtyId
        })
        showMoveModal.value = false
        await fetchData()
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
}

const handleAddSubject = async () => {
    if (!newSubjectForm.subjectId) return
    submitting.value = true
    try {
        await api.post(API.SUPERADMIN_API.curriculum.create(specialty.value.studyPlanId), {
            specialty_id: specialtyId,
            subject_id: newSubjectForm.subjectId,
            period: targetCell.period,
            level: targetCell.level
        })
        showModal.value = false
        await fetchData()
    } catch (e) { console.error(e) }
    finally { submitting.value = false }
}

const onRemoveItem = (item: any) => {
    itemToDelete.value = item
    showDeleteConfirm.value = true
}

const handleRemoveConfirm = async () => {
    submitting.value = true
    try {
        await api.delete(API.SUPERADMIN_API.curriculum.delete(studyPlan.value.id, itemToDelete.value.id))
        showDeleteConfirm.value = false
        await fetchData()
    } catch (e) { console.error(e) }
    finally { submitting.value = false }
}

onMounted(fetchData)
</script>

<template>
    <div class="space-y-6 max-w-[1600px] mx-auto p-4 font-sans bg-slate-50 min-h-screen">

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
            <div v-if="specialty.id" class="flex items-center gap-4">
                <div class="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                    <AcademicCapIcon class="w-6 h-6" />
                </div>
                <div>
                    <h2 class="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">
                        {{ specialty.name }}
                    </h2>
                    <p class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                        {{ studyPlan.periods }} {{ labelPeriod }}S / MALLA DE ESPECIALIDAD
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto">
                <button @click="fetchData" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowPathIcon class="w-5 h-5" :class="{'animate-spin': loading}" />
                </button>
                <button @click="router.back()" class="flex-1 md:flex-none px-6 py-2.5 text-[10px] font-black border border-slate-200 rounded-xl hover:bg-slate-50 uppercase transition-all text-slate-500 tracking-widest shadow-sm">
                    Regresar
                </button>
            </div>
        </div>

        <div class="block lg:hidden space-y-4">
            <div v-for="p in studyPlan.periods" :key="'mobile-p-'+p" class="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                <button @click="togglePeriod(p)" class="w-full flex justify-between items-center p-5 bg-white hover:bg-slate-50 transition-colors">
                    <span class="font-black text-slate-700 uppercase tracking-tighter text-sm">{{ p }}° {{ labelPeriod }}</span>
                    <div class="flex items-center gap-3">
                        <span class="text-[9px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-black uppercase">
                            {{ getCurriculumByPeriod(p).length }} Materias
                        </span>
                        <ChevronDownIcon class="w-5 h-5 text-slate-400 transition-transform" :class="{'rotate-180': activePeriods.includes(p)}" />
                    </div>
                </button>

                <div v-show="activePeriods.includes(p)" class="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30">
                    <div v-for="item in getCurriculumByPeriod(p)" :key="item.id" class="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div class="flex items-center gap-3">
                            <StarIcon v-if="isSpecialtyItem(item)" class="w-4 h-4 text-yellow-400" />
                            <div>
                                <p class="text-[10px] font-bold text-slate-400 uppercase leading-none">{{ item.subject?.officialCode }}</p>
                                <p class="text-xs font-black text-slate-800 uppercase">{{ item.subject?.name }}</p>
                            </div>
                        </div>
                        <div class="flex gap-1" v-if="isSpecialtyItem(item)">
                            <button @click="onMoveItem(item)" class="p-2 text-slate-400 hover:text-indigo-600"><CursorArrowRaysIcon class="w-4 h-4"/></button>
                            <button @click="onRemoveItem(item)" class="p-2 text-slate-400 hover:text-red-500"><XMarkIcon class="w-4 h-4"/></button>
                        </div>
                    </div>
                    <button @click="openAddModal(p, 1)" class="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase hover:border-indigo-300 hover:text-indigo-500 transition-all">
                        + Añadir Materia
                    </button>
                </div>
            </div>
        </div>

        <div class="hidden lg:block bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-x-auto min-h-[700px]">
            <div class="grid gap-4 mx-auto" :style="{
                gridTemplateColumns: `repeat(${studyPlan.periods || 1}, 160px)`,
                gridTemplateRows: 'auto repeat(10, 170px)',
                width: 'max-content'
            }">
                <div v-for="p in studyPlan.periods" :key="'h-'+p" class="text-center font-black text-slate-400 pb-4 uppercase tracking-widest text-[10px] border-b border-slate-100">
                    {{ p }}° {{ labelPeriod }}
                </div>

                <template v-for="row in 10" :key="'row-'+row">
                    <template v-for="col in studyPlan.periods" :key="'cell-'+col+'-'+row">
                        <div class="w-[160px] h-[170px] relative">
                            <template v-if="getItemAt(col, row)">
                                <div v-if="isSpecialtyItem(getItemAt(col, row))" class="absolute -top-2 left-2 z-30 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase ring-2 ring-white">
                                    <StarIcon class="w-2.5 h-2.5 text-yellow-300" /> Especialidad
                                </div>
                                <SubjectCard
                                    :item="getItemAt(col, row)"
                                    class="w-full h-full rounded-2xl transition-all duration-300"
                                    :class="[isSpecialtyItem(getItemAt(col, row)) ? 'ring-1 ring-slate-200 hover:shadow-md' : 'opacity-10 grayscale pointer-events-none scale-95']"
                                    :can-remove="isSpecialtyItem(getItemAt(col, row))"
                                    :can-move="isSpecialtyItem(getItemAt(col, row))"
                                    :can-link="false"
                                    @remove="onRemoveItem"
                                    @move="onMoveItem"
                                />
                            </template>
                            <button v-else @click="openAddModal(col, row)" class="w-full h-full border-2 border-dashed border-slate-100 text-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-400 hover:bg-indigo-50/50 transition-all group">
                                <PlusIcon class="w-6 h-6 group-hover:scale-110 transition-transform" />
                                <span class="text-[9px] font-black uppercase opacity-0 group-hover:opacity-100">Asignar</span>
                            </button>
                        </div>
                    </template>
                </template>
            </div>
        </div>

        <div v-if="showMoveModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                <div class="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 class="font-black uppercase text-xs tracking-widest text-slate-800">Reubicar Materia</h3>
                        <p class="text-[9px] text-indigo-500 font-bold uppercase mt-1">{{ itemToMove?.subject?.name }}</p>
                    </div>
                    <button @click="showMoveModal = false" class="text-slate-400 hover:text-red-500 transition-colors"><XMarkIcon class="w-5 h-5"/></button>
                </div>
                <div class="p-8 space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-1">Periodo</label>
                            <select v-model="moveForm.period" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all">
                                <option v-for="p in studyPlan.periods" :key="p" :value="p">{{ p }}° {{ labelPeriod }}</option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-1">Nivel (Fila)</label>
                            <select v-model="moveForm.level" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all">
                                <option v-for="l in 10" :key="l" :value="l">Nivel {{ l }}</option>
                            </select>
                        </div>
                    </div>
                    <div v-if="getItemAt(moveForm.period, moveForm.level) && getItemAt(moveForm.period, moveForm.level).id !== itemToMove?.id" class="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                        <XMarkIcon class="w-5 h-5 text-amber-500 rotate-45 shrink-0" />
                        <p class="text-[10px] text-amber-800 font-bold uppercase leading-tight">Espacio ocupado por: {{ getItemAt(moveForm.period, moveForm.level)?.subject?.name }}. Libera el espacio primero.</p>
                    </div>
                    <button @click="handleMoveConfirm" :disabled="submitting || (getItemAt(moveForm.period, moveForm.level) && getItemAt(moveForm.period, moveForm.level).id !== itemToMove?.id)" class="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50">
                        {{ submitting ? 'Procesando...' : 'Confirmar Cambio' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
                <div class="p-6 border-b bg-slate-50/50 flex justify-between items-center text-slate-800 font-black uppercase text-xs">
                    <span>Añadir a {{ targetCell.period }}° {{ labelPeriod }} (Fila {{ targetCell.level }})</span>
                    <button @click="showModal = false"><XMarkIcon class="w-5 h-5"/></button>
                </div>
                <div class="p-8 space-y-6">
                    <FormRemoteSelect
                        label="Buscar Materia"
                        v-model="newSubjectForm.subjectId"
                        :endpoint="API.SUPERADMIN_API.specialties.listSubjescts(specialtyId)"
                        :params="{ specialty_id: specialtyId, exclude_assigned_study_plan: true }"
                        item-label="name"
                        item-value="id"
                        placeholder="Nombre de la materia..."
                        required
                    />
                    <button @click="handleAddSubject" :disabled="submitting || !newSubjectForm.subjectId" class="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl active:scale-95 disabled:opacity-50">
                        {{ submitting ? 'Guardando...' : 'Asignar Materia' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showDeleteConfirm" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div class="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><XMarkIcon class="w-8 h-8" /></div>
                <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">¿Eliminar materia?</h3>
                <p class="text-xs text-slate-500 mb-8 uppercase font-bold tracking-wide leading-relaxed">Se quitará de la especialidad: <br> <span class="text-slate-900">{{ itemToDelete?.subject?.name }}</span></p>
                <div class="flex gap-3">
                    <button @click="showDeleteConfirm = false" class="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
                    <button @click="handleRemoveConfirm" :disabled="submitting" class="flex-1 py-4 bg-red-500 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg active:scale-95 disabled:opacity-50">Confirmar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grayscale { filter: grayscale(100%); }
div::-webkit-scrollbar { height: 8px; width: 6px; }
div::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
