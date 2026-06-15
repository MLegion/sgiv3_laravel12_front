<template>
    <div class="space-y-5">

        <!-- Encabezado -->
        <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-xl font-semibold text-slate-800 uppercase">Aspirantes Admitidos</h1>
                    <span
                        v-if="filterPeriodId && !loading"
                        class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"
                    >{{ totalItems }} por inscribir</span>
                </div>
                <p class="mt-1 text-sm text-slate-500">
                    Selecciona los aspirantes a inscribir, confirma el plan de estudio y presiona <strong>Inscribir Seleccionados</strong>.
                </p>
            </div>
            <button
                v-if="selected.size > 0"
                class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold uppercase hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                :disabled="enrolling"
                @click="openEnrollModal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Inscribir Seleccionados ({{ selected.size }})
            </button>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap gap-3 items-end">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Período Académico <span class="text-red-500">*</span></label>
                <FormRemoteSelect
                    v-model="filterPeriodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                    item-label="name"
                    item-value="academicPeriodId"
                    placeholder="Selecciona un período..."
                    @update:model-value="onPeriodChange"
                />
            </div>
            <div class="flex-1 min-w-[200px]">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Nombre, CURP, email..."
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    @input="debouncedSearch"
                />
            </div>
        </div>

        <!-- Sin período -->
        <div v-if="!filterPeriodId" class="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 opacity-40">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            Selecciona un período para ver los aspirantes admitidos.
        </div>

        <!-- Cargando -->
        <div v-else-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 opacity-40">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            No hay aspirantes ADMITIDOS en este período.
        </div>

        <!-- Tabla -->
        <div v-else class="space-y-3">
            <!-- Seleccionar todos -->
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" :checked="allSelected" :indeterminate="someSelected && !allSelected" class="w-4 h-4 rounded accent-green-600" @change="toggleAll" />
                    <span>Seleccionar esta página ({{ items.length }})</span>
                </label>
                <button
                    v-if="totalItems > items.length"
                    type="button"
                    class="text-green-700 font-semibold underline hover:text-green-800 transition"
                    @click="selectWholeCohort"
                >
                    Seleccionar todo el cohorte ({{ totalItems }})
                </button>
                <span v-if="selected.size > 0" class="text-green-600 font-semibold">{{ selected.size }} seleccionado(s)</span>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th scope="col" class="w-10 px-3 py-3"></th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-10">#</th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nombre Completo</th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-44">CURP</th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-64">Carrera / Plan de Estudio</th>
                            <th scope="col" class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-20">Puntaje</th>
                            <th scope="col" class="px-4 py-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, idx) in items"
                            :key="item.id"
                            class="border-t border-slate-100 transition-colors"
                            :class="selected.has(item.id) ? 'bg-green-50' : 'bg-white hover:bg-slate-50'"
                        >
                            <!-- Checkbox -->
                            <td class="px-3 py-3 text-center">
                                <input
                                    type="checkbox"
                                    :checked="selected.has(item.id)"
                                    class="w-4 h-4 rounded accent-green-600"
                                    @change="toggleSelect(item.id)"
                                />
                            </td>

                            <!-- # -->
                            <td class="px-4 py-3 text-xs font-mono text-slate-400 font-semibold">
                                {{ (currentPage - 1) * perPage + idx + 1 }}
                            </td>

                            <!-- Nombre -->
                            <td class="px-4 py-3">
                                <p class="font-medium text-slate-800">{{ fullName(item) }}</p>
                                <p class="text-xs text-slate-400">{{ item.email }}</p>
                            </td>

                            <!-- CURP -->
                            <td class="px-4 py-3 font-mono text-xs text-slate-600 uppercase">
                                {{ item.curp || '—' }}
                            </td>

                            <!-- Selector de oferta -->
                            <td class="px-4 py-3">
                                <OfferSelector :applicant="item" @change="onOfferChange(item.id, $event)" />
                            </td>

                            <!-- Puntaje -->
                            <td class="px-4 py-3 text-center">
                                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                    {{ item.entranceScore ?? '—' }}
                                </span>
                            </td>

                            <!-- Ver detalle -->
                            <td class="px-4 py-3 text-center">
                                <button aria-label="Ver detalle"
                                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="Ver detalle"
                                    @click="openDrawer(item)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>

            <!-- Paginación -->
            <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Página {{ currentPage }} de {{ totalPages }} — {{ totalItems }} aspirantes</span>
                <div class="flex gap-1">
                    <button class="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">← Ant.</button>
                    <button v-for="p in visiblePages" :key="p" class="px-3 py-1.5 rounded border transition font-medium" :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-100'" @click="goPage(p)">{{ p }}</button>
                    <button class="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">Sig. →</button>
                </div>
            </div>
        </div>

        <!-- ── DRAWER DETALLE ────────────────────────────────────────────────── -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-200" leave-to-class="opacity-0">
                <div v-if="drawerItem" class="fixed inset-0 z-[100] flex" @click.self="drawerItem = null" @keydown.esc.window="drawerItem = null">
                    <div
                        class="ml-auto w-full max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        :aria-label="`Detalle del aspirante ${fullName(drawerItem)}`"
                    >
                        <!-- Cabecera drawer -->
                        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                            <div>
                                <p class="font-bold text-slate-800 text-sm uppercase">{{ fullName(drawerItem) }}</p>
                                <p class="text-xs text-slate-500 font-mono">{{ drawerItem.curp || '—' }}</p>
                            </div>
                            <button class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition" @click="drawerItem = null">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <!-- Cuerpo drawer con collapsibles -->
                        <div class="flex-1 overflow-y-auto p-4 space-y-2">

                            <CollapseSection title="Información General">
                                <InfoGrid :rows="[
                                    ['Período', drawerItem.academicPeriod?.name],
                                    ['Correo', drawerItem.email],
                                    ['Escuela Procedencia', drawerItem.originSchool?.name],
                                    ['Puntaje Admisión', drawerItem.entranceScore],
                                    ['Folio Pre-Ficha', drawerItem.preApplicationFolio],
                                    ['Folio Solicitud', drawerItem.applicationFolio],
                                ]"/>
                            </CollapseSection>

                            <CollapseSection title="Datos Personales">
                                <InfoGrid :rows="[
                                    ['CURP', drawerItem.curp],
                                    ['RFC', drawerItem.rfc],
                                    ['Fecha Nacimiento', drawerItem.birthDate],
                                    ['Estado Civil', drawerItem.maritalStatus],
                                    ['Dirección', drawerItem.address],
                                    ['Teléfono', drawerItem.phone],
                                    ['Cel.', drawerItem.mobilePhone],
                                    ['Tel. Casa', drawerItem.homePhone],
                                ]"/>
                            </CollapseSection>

                            <CollapseSection title="Último Nivel de Estudio">
                                <InfoGrid :rows="[
                                    ['Escuela Procedencia', drawerItem.originSchool?.name],
                                    ['Área Académica', drawerItem.academicArea?.name],
                                    ['Promedio', drawerItem.academicAverage],
                                    ['Año Egreso', drawerItem.graduationYear],
                                ]"/>
                            </CollapseSection>

                            <CollapseSection title="Preventivos / Salud">
                                <InfoGrid :rows="[
                                    ['NSS', drawerItem.nss],
                                    ['Clínica Médica', drawerItem.medicalClinic],
                                    ['Tipo de Sangre', drawerItem.bloodType],
                                    ['Alergias', drawerItem.allergies],
                                    ['Tratamiento Psicológico', drawerItem.psychologicalTreatment],
                                    ['Discapacidad', drawerItem.disability?.name],
                                ]"/>
                            </CollapseSection>

                            <CollapseSection title="Otros Datos">
                                <InfoGrid :rows="[
                                    ['Beca', drawerItem.scholarship?.name],
                                    ['Empresa', drawerItem.company],
                                    ['Grupo Indígena', drawerItem.indigenousGroup?.name],
                                    ['Lengua Indígena', drawerItem.indigenousLanguage?.name],
                                ]"/>
                            </CollapseSection>

                            <CollapseSection title="Opciones de Carrera">
                                <div class="space-y-2 text-xs">
                                    <div v-for="n in [1,2,3]" :key="n">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Opción {{ n }}</p>
                                        <template v-if="drawerItem[`offerOption${n}`]">
                                            <p class="font-semibold text-slate-700">{{ drawerItem[`offerOption${n}`].career?.name ?? '—' }}</p>
                                            <p class="text-slate-500">
                                                {{ drawerItem[`offerOption${n}`].studyPlans?.map((sp: any) => sp.studyPlan?.name).join(', ') || '—' }}
                                            </p>
                                        </template>
                                        <p v-else class="text-slate-400 italic">No indicó</p>
                                    </div>
                                </div>
                            </CollapseSection>

                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- ── MODAL INSCRIPCIÓN ──────────────────────────────────────────────── -->
        <BaseModal v-model="enrollModal" title="Confirmar Inscripción" size="lg">
            <div class="space-y-4">
                        <!-- Selección de periodo de ingreso -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Período de Ingreso <span class="text-red-500">*</span></label>
                            <FormRemoteSelect
                                v-model="enrollPeriodId"
                                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                                :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                                item-label="name"
                                item-value="academicPeriodId"
                                placeholder="Selecciona el período de ingreso..."
                            />
                        </div>

                        <!-- ÉXITO: resumen + siguiente paso -->
                        <template v-if="enrollSummary !== null">
                            <div class="rounded-lg bg-green-50 border border-green-200 p-4 text-center space-y-1">
                                <p class="text-3xl font-bold text-green-700">{{ enrollSummary }}</p>
                                <p class="text-sm text-green-700">aspirante(s) inscrito(s) correctamente.</p>
                            </div>
                            <p class="text-xs text-slate-500 text-center">El siguiente paso es asignarlos a un grupo (su carga académica de nuevo ingreso).</p>
                            <div class="flex gap-2 justify-end pt-1">
                                <button class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition" @click="enrollModal = false">Cerrar</button>
                                <button class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" @click="goToGroups">Asignar a grupos →</button>
                            </div>
                        </template>

                        <!-- PREVIEW: validación previa antes de comprometer -->
                        <template v-else>
                            <div v-if="previewing" class="flex items-center gap-2 text-sm text-slate-400 italic py-4 justify-center">
                                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                Validando inscripción...
                            </div>

                            <template v-else>
                                <!-- Resumen de validación -->
                                <div class="flex items-center gap-2 text-sm">
                                    <span class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{{ previewOk.length }} a inscribir</span>
                                    <span v-if="previewFail.length" class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{{ previewFail.length }} con problema</span>
                                </div>

                                <!-- Lista -->
                                <div v-if="previewItems.length" class="border rounded-lg overflow-hidden text-xs max-h-56 overflow-y-auto">
                                    <div v-for="p in previewItems" :key="p.applicantId" class="flex items-start gap-2 px-3 py-2 border-b last:border-0" :class="p.ok ? 'bg-green-50' : 'bg-red-50'">
                                        <svg v-if="p.ok" class="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        <svg v-else class="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                        <div class="min-w-0 flex-1">
                                            <p class="font-medium text-slate-700 truncate">{{ p.preview.fullName || ('Aspirante #' + p.applicantId) }}</p>
                                            <p v-if="p.ok" class="text-[10px] text-slate-500">
                                                <span class="font-mono font-semibold text-slate-700">{{ p.preview.numControl }}</span>
                                                · {{ p.preview.careerName }} · {{ p.preview.modalityName }}
                                            </p>
                                            <p v-else class="text-[10px] text-red-600">{{ p.reason }}</p>
                                        </div>
                                    </div>
                                </div>

                                <p v-if="previewFail.length" class="text-[11px] text-slate-400">Solo se inscribirán los válidos; los que tienen problema quedan pendientes para corregir.</p>
                                <p v-if="enrollError" class="text-xs text-red-600 font-medium">{{ enrollError }}</p>

                                <div class="flex gap-2 justify-end pt-1">
                                    <button class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition" :disabled="enrolling" @click="enrollModal = false">Cancelar</button>
                                    <button
                                        class="px-5 py-2 text-sm rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                                        :disabled="enrolling || !enrollPeriodId || previewOk.length === 0"
                                        @click="doEnroll"
                                    >
                                        {{ enrolling ? 'Inscribiendo...' : `Inscribir ${previewOk.length}` }}
                                    </button>
                                </div>
                            </template>
                        </template>
            </div>
        </BaseModal>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const router = useRouter()
const toast  = useToast()

// ── Sub-componentes inline ─────────────────────────────────────────────────

// CollapseSection
import { defineComponent, h } from 'vue'

const CollapseSection = defineComponent({
    props: { title: String },
    setup(props, { slots }) {
        const open = ref(true)
        return () => h('div', { class: 'border border-slate-100 rounded-xl overflow-hidden' }, [
            h('button', {
                class: 'w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wide hover:bg-slate-100 transition',
                onClick: () => { open.value = !open.value }
            }, [
                h('span', props.title),
                h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '2', stroke: 'currentColor', class: `w-4 h-4 transition-transform ${open.value ? 'rotate-180' : ''}` },
                    [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19.5 8.25l-7.5 7.5-7.5-7.5' })])
            ]),
            open.value ? h('div', { class: 'p-3 bg-white' }, slots.default?.()) : null,
        ])
    }
})

const InfoGrid = defineComponent({
    props: { rows: Array as () => [string, any][] },
    setup(props) {
        return () => h('dl', { class: 'grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs' },
            (props.rows ?? []).map(([label, value]) =>
                value != null && value !== ''
                    ? [
                        h('dt', { class: 'text-slate-400 font-semibold uppercase text-[10px]' }, label),
                        h('dd', { class: 'text-slate-700' }, String(value))
                      ]
                    : []
            ).flat()
        )
    }
})

// OfferSelector
type OfferSel = { offerStudyPlanId: number; studyPlanId: number | null; modalityId: number | null } | null

const OfferSelector = defineComponent({
    props: { applicant: Object as () => any },
    emits: ['change'],
    setup(props, { emit }) {
        const selected = ref<number | null>(null)

        // Construir opciones disponibles
        const options = computed(() => {
            const opts: { label: string; studyPlanId: number | null; offerStudyPlanId: number | null; modalityId: number | null }[] = []
            for (const n of [1, 2, 3]) {
                const offer = props.applicant[`offerOption${n}`]
                if (!offer) continue
                const career = offer.career?.name ?? 'Sin carrera'
                const modalityId = offer.modality?.id ?? null
                if (offer.studyPlans?.length) {
                    for (const sp of offer.studyPlans) {
                        opts.push({
                            label: `Opción ${n}: ${career} — ${sp.studyPlan?.name ?? 'Plan'}`,
                            studyPlanId: sp.studyPlan?.id ?? null,
                            offerStudyPlanId: sp.id,
                            modalityId,
                        })
                    }
                } else {
                    opts.push({ label: `Opción ${n}: ${career} (sin plan)`, studyPlanId: null, offerStudyPlanId: null, modalityId: null })
                }
            }
            return opts
        })

        function emitByOfferId(offerStudyPlanId: number | null) {
            const opt = options.value.find(o => o.offerStudyPlanId === offerStudyPlanId)
            const payload: OfferSel = opt && opt.offerStudyPlanId !== null
                ? { offerStudyPlanId: opt.offerStudyPlanId, studyPlanId: opt.studyPlanId, modalityId: opt.modalityId }
                : null
            emit('change', payload)
        }

        // Default: primera opción con plan
        watch(() => props.applicant?.id, () => {
            const first = options.value.find(o => o.offerStudyPlanId !== null)
            selected.value = first?.offerStudyPlanId ?? null
            emitByOfferId(selected.value)
        }, { immediate: true })

        return () => h('select', {
            value: selected.value,
            class: 'w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-white',
            onChange: (e: Event) => {
                const val = (e.target as HTMLSelectElement).value
                selected.value = val ? Number(val) : null
                emitByOfferId(selected.value)
            }
        }, options.value.map(opt =>
            h('option', { value: opt.offerStudyPlanId ?? '', disabled: !opt.offerStudyPlanId }, opt.label)
        ))
    }
})

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Offer {
    id: number
    career: { id: number; name: string } | null
    modality: { id: number; name: string } | null
    studyPlans: { id: number; studyPlan: { id: number; name: string } | null }[]
}

interface AdmittedApplicant {
    id: number
    names: string
    firstSurname: string
    secondSurname: string | null
    email: string
    curp: string | null
    entranceScore: string | null
    academicPeriod: { id: number; name: string } | null
    originSchool: { id: number; name: string } | null
    offerOption1: Offer | null
    offerOption2: Offer | null
    offerOption3: Offer | null
    preApplicationFolio: string | null
    applicationFolio: string | null
    rfc: string | null
    birthDate: string | null
    maritalStatus: string | null
    address: string | null
    phone: string | null
    homePhone: string | null
    mobilePhone: string | null
    company: string | null
    graduationYear: number | null
    academicAverage: string | null
    nss: string | null
    medicalClinic: string | null
    bloodType: string | null
    allergies: string | null
    psychologicalTreatment: string | null
    scholarship: { id: number; name: string } | null
    academicArea: { id: number; name: string } | null
    disability: { id: number; name: string } | null
    indigenousGroup: { id: number; name: string } | null
    indigenousLanguage: { id: number; name: string } | null
    [key: string]: any
}

// ── Estado ─────────────────────────────────────────────────────────────────

const filterPeriodId = ref<number | null>(null)
const search         = ref('')
const loading        = ref(false)
const items          = ref<AdmittedApplicant[]>([])
const totalItems     = ref(0)
const currentPage    = ref(1)
const perPage        = 30
const totalPages     = computed(() => Math.max(1, Math.ceil(totalItems.value / perPage)))
const visiblePages   = computed(() => {
    const pages: number[] = []
    for (let i = Math.max(1, currentPage.value - 2); i <= Math.min(totalPages.value, currentPage.value + 2); i++) pages.push(i)
    return pages
})

// Selección y mapa de offerStudyPlanId por aspirante
const selected          = ref<Set<number>>(new Set())
const offerSelections   = ref<Map<number, OfferSel>>(new Map())   // applicantId → { offerStudyPlanId, studyPlanId, modalityId }
const allSelected       = computed(() => items.value.length > 0 && items.value.every(i => selected.value.has(i.id)))
const someSelected      = computed(() => items.value.some(i => selected.value.has(i.id)))

// Drawer
const drawerItem = ref<AdmittedApplicant | null>(null)

// Enroll modal
interface PreviewItem {
    applicantId: number
    ok: boolean
    reason: string | null
    preview: { numControl?: string | null; fullName?: string | null; careerName?: string | null; modalityName?: string | null; periodName?: string | null; currentPeriodNumber?: number }
}
const enrollModal    = ref(false)
const enrollPeriodId  = ref<number | null>(null)
const previewing     = ref(false)
const enrolling      = ref(false)
const enrollError    = ref<string | null>(null)
const previewItems   = ref<PreviewItem[]>([])
const enrollSummary  = ref<number | null>(null)   // # inscritos tras confirmar

const previewOk   = computed(() => previewItems.value.filter(p => p.ok))
const previewFail = computed(() => previewItems.value.filter(p => !p.ok))

// ── Helpers ────────────────────────────────────────────────────────────────

function fullName(item: AdmittedApplicant): string {
    return [item.firstSurname, item.secondSurname, item.names].filter(Boolean).join(' ')
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => loadPage(1), 400)
}

// ── Carga de datos ─────────────────────────────────────────────────────────

async function loadPage(page: number) {
    if (!filterPeriodId.value) return
    loading.value = true
    try {
        const params = new URLSearchParams({
            page:               String(page),
            per_page:           String(perPage),
            academic_period_id: String(filterPeriodId.value),
        })
        if (search.value) params.set('search', search.value)

        const { data } = await api.get(`${API.SCHOOL_SERVICES_API.admittedApplicants.list}?${params}`)
        items.value      = data.data ?? []
        totalItems.value = data.meta?.total ?? 0
        currentPage.value = page
    } finally {
        loading.value = false
    }
}

function goPage(page: number) {
    if (page >= 1 && page <= totalPages.value) loadPage(page)
}

function onPeriodChange(val: number | null) {
    selected.value       = new Set()
    offerSelections.value = new Map()
    if (val) loadPage(1)
    else { items.value = []; totalItems.value = 0 }
}

watch(filterPeriodId, (v) => { if (!v) { items.value = []; totalItems.value = 0 } })

// ── Selección ──────────────────────────────────────────────────────────────

function toggleSelect(id: number) {
    const next = new Set(selected.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selected.value = next
}

function toggleAll() {
    if (allSelected.value) {
        const next = new Set(selected.value)
        items.value.forEach(i => next.delete(i.id))
        selected.value = next
    } else {
        const next = new Set(selected.value)
        items.value.forEach(i => next.add(i.id))
        selected.value = next
    }
}

function onOfferChange(applicantId: number, sel: OfferSel) {
    offerSelections.value.set(applicantId, sel)
}

// ── Drawer ─────────────────────────────────────────────────────────────────

function openDrawer(item: AdmittedApplicant) {
    drawerItem.value = item
}

// ── Inscripción ────────────────────────────────────────────────────────────

/** Construye los items para preview/bulk; separa los inválidos del lado cliente. */
function buildEnrollItems(): {
    valid: Array<{ applicant_id: number; study_plan_id: number; modality_id: number; current_period_number: number }>
    invalid: PreviewItem[]
} {
    const sel = items.value.filter(i => selected.value.has(i.id))
    const valid: Array<{ applicant_id: number; study_plan_id: number; modality_id: number; current_period_number: number }> = []
    const invalid: PreviewItem[] = []
    for (const i of sel) {
        const o = offerSelections.value.get(i.id)
        if (!o || !o.studyPlanId) {
            invalid.push({ applicantId: i.id, ok: false, reason: 'Sin plan de estudio seleccionado', preview: { fullName: fullName(i) } })
            continue
        }
        if (!o.modalityId) {
            invalid.push({ applicantId: i.id, ok: false, reason: 'La oferta no tiene modalidad', preview: { fullName: fullName(i) } })
            continue
        }
        valid.push({ applicant_id: i.id, study_plan_id: o.studyPlanId, modality_id: o.modalityId, current_period_number: 1 })
    }
    return { valid, invalid }
}

function openEnrollModal() {
    enrollError.value   = null
    enrollSummary.value = null
    previewItems.value  = []
    enrollPeriodId.value = filterPeriodId.value
    enrollModal.value   = true
    runPreview()
}

/** Llama a /enroll/preview para mostrar qué pasará antes de comprometer. */
async function runPreview() {
    if (!enrollPeriodId.value) return
    enrollError.value   = null
    enrollSummary.value = null
    const { valid, invalid } = buildEnrollItems()
    if (!valid.length) { previewItems.value = invalid; return }
    previewing.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.students.enrollPreview, {
            entry_period_id: enrollPeriodId.value,
            items:           valid,
        })
        previewItems.value = [...(data as PreviewItem[]), ...invalid]
    } catch (e: any) {
        enrollError.value  = e?.response?.data?.message ?? 'No se pudo validar la inscripción.'
        previewItems.value = invalid
    } finally {
        previewing.value = false
    }
}

/** Inscribe en bloque (atómico) solo los items válidos del preview. */
async function doEnroll() {
    if (!enrollPeriodId.value || previewOk.value.length === 0) return
    enrolling.value   = true
    enrollError.value = null
    try {
        const payloadItems = previewOk.value.map(p => {
            const sel = offerSelections.value.get(p.applicantId)!
            return {
                applicant_id:          p.applicantId,
                study_plan_id:         sel!.studyPlanId,
                modality_id:           sel!.modalityId,
                current_period_number: p.preview.currentPeriodNumber ?? 1,
            }
        })
        const { data } = await api.post(API.SCHOOL_SERVICES_API.students.enrollBulk, {
            entry_period_id: enrollPeriodId.value,
            items:           payloadItems,
        })
        enrollSummary.value = data.enrolled ?? payloadItems.length
        toast.success(`Se inscribieron ${enrollSummary.value} aspirante(s).`)

        const enrolledIds = new Set(previewOk.value.map(p => p.applicantId))
        selected.value = new Set([...selected.value].filter(id => !enrolledIds.has(id)))
        await loadPage(currentPage.value)
    } catch (e: any) {
        if (e?.response?.status === 422 && Array.isArray(e.response.data?.failed)) {
            enrollError.value = e.response.data.message ?? 'Ningún aspirante fue inscrito.'
            await runPreview()
        } else {
            enrollError.value = e?.response?.data?.message ?? 'No se pudo inscribir.'
        }
    } finally {
        enrolling.value = false
    }
}

function goToGroups() {
    router.push({ name: 'school-services.group-assignment' })
}

// Re-valida cuando cambia el periodo de ingreso con el modal abierto.
watch(enrollPeriodId, () => { if (enrollModal.value) runPreview() })

/** Selecciona TODOS los admitidos del periodo (todas las páginas). */
async function selectWholeCohort() {
    if (!filterPeriodId.value) return
    loading.value = true
    try {
        const params = new URLSearchParams({
            page:               '1',
            per_page:           String(Math.max(totalItems.value, perPage)),
            academic_period_id: String(filterPeriodId.value),
        })
        if (search.value) params.set('search', search.value)
        const { data } = await api.get(`${API.SCHOOL_SERVICES_API.admittedApplicants.list}?${params}`)
        items.value       = data.data ?? []
        totalItems.value  = data.meta?.total ?? items.value.length
        currentPage.value = 1
        selected.value    = new Set(items.value.map((i: AdmittedApplicant) => i.id))
    } finally {
        loading.value = false
    }
}
</script>
