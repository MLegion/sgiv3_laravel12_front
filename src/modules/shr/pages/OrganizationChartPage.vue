<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Organigrama institucional
            </h1>
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 bg-white hover:border-blue-400 hover:text-blue-600 transition"
                    @click="downloadTemplate"
                >
                    <ArrowDownTrayIcon class="w-4 h-4" />
                    Descargar formato
                </button>
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 bg-white hover:border-emerald-400 hover:text-emerald-600 transition"
                    @click="openImport"
                >
                    <ArrowUpTrayIcon class="w-4 h-4" />
                    Importar
                </button>
                <button
                    type="button"
                    class="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
                    :disabled="loading"
                    @click="load"
                >
                    {{ loading ? 'Cargando…' : 'Actualizar' }}
                </button>
            </div>
        </div>

        <!-- Modal de importación del organigrama -->
        <div
            v-if="importOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            @click.self="closeImport"
        >
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-slate-800">Importar organigrama</h2>
                        <p class="text-sm text-slate-500">Crea áreas, puestos y empleados en una sola carga.</p>
                    </div>
                    <button aria-label="Cerrar" class="text-slate-400 hover:text-slate-600" @click="closeImport">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <p class="text-xs text-slate-500">
                    Una fila por nodo del organigrama. Columnas:
                    <code class="bg-slate-100 px-1 rounded">area_name</code>,
                    <code class="bg-slate-100 px-1 rounded">area_parent_name</code>,
                    <code class="bg-slate-100 px-1 rounded">position_name</code>,
                    <code class="bg-slate-100 px-1 rounded">role_code</code>,
                    <code class="bg-slate-100 px-1 rounded">max_holders</code>,
                    <code class="bg-slate-100 px-1 rounded">employee_names</code>,
                    <code class="bg-slate-100 px-1 rounded">employee_first_surname</code>,
                    <code class="bg-slate-100 px-1 rounded">employee_second_surname</code>,
                    <code class="bg-slate-100 px-1 rounded">employee_email</code>.
                    Solo <b>area_name</b> es obligatoria; deja vacío el correo para crear solo estructura.
                </p>

                <label
                    class="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg p-8 cursor-pointer transition"
                    :class="importFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'"
                >
                    <ArrowUpTrayIcon class="w-8 h-8" :class="importFile ? 'text-emerald-500' : 'text-slate-400'" />
                    <span class="text-sm" :class="importFile ? 'text-emerald-700 font-medium' : 'text-slate-500'">
                        {{ importFile ? importFile.name : 'Haz clic o arrastra tu archivo .csv aquí' }}
                    </span>
                    <input type="file" accept=".csv,text/csv" class="hidden" @change="onFileSelected" />
                </label>

                <div v-if="importResult" class="rounded-lg border p-3 text-sm"
                    :class="importResult.errors.length === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'">
                    <p class="font-medium">
                        {{ importResult.areas_created }} área(s), {{ importResult.positions_created }} puesto(s) y {{ importResult.employees_created }} empleado(s) creados<template v-if="importResult.errors.length"> · {{ importResult.errors.length }} fila(s) con error</template>.
                    </p>
                    <ul v-if="importResult.errors.length" class="mt-1 list-disc list-inside max-h-40 overflow-auto">
                        <li v-for="(e, idx) in importResult.errors" :key="idx">Fila {{ e.row }}: {{ e.reason }}</li>
                    </ul>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100" @click="closeImport">
                        Cerrar
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="!importFile || importing"
                        @click="submitImport"
                    >
                        {{ importing ? 'Importando…' : 'Importar' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="p-10 text-center text-sm text-gray-500">
            Cargando organigrama…
        </div>

        <div v-else class="grid grid-cols-12 gap-4">
            <!-- Árbol principal + orphans -->
            <div class="col-span-12 lg:col-span-9 space-y-4">
                <!-- Orphans: áreas sin jerarquía asignada -->
                <div v-if="orphans.length" class="bg-white rounded-xl border border-dashed border-amber-300 p-4">
                    <h2 class="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                        Áreas sin padre ({{ orphans.length }})
                    </h2>
                    <p class="text-xs text-amber-700/80 mb-3">
                        Estas áreas aún no tienen una jerarquía definida. Clic en el lápiz para asignarles un padre y moverlas al organigrama.
                    </p>
                    <ul class="org-orphans">
                        <OrgChartNode
                            v-for="o in orphans"
                            :key="o.id"
                            :node="o"
                            @edit-parent="openParentEditor"
                        />
                    </ul>
                </div>

                <!-- Árbol configurado -->
                <div class="bg-white rounded-xl border p-6 overflow-x-auto">
                    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <h2 class="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Organigrama configurado
                        </h2>
                        <div class="flex items-center gap-2">
                            <!-- Toggle de vista -->
                            <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                                <button
                                    type="button"
                                    class="px-3 py-1.5 font-medium transition"
                                    :class="mode === 'tree' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'"
                                    @click="mode = 'tree'"
                                >
                                    Árbol
                                </button>
                                <button
                                    type="button"
                                    class="px-3 py-1.5 font-medium transition border-l border-slate-200"
                                    :class="mode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'"
                                    @click="mode = 'list'"
                                >
                                    Compacto
                                </button>
                            </div>
                            <button
                                type="button"
                                class="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                                @click="expandAll"
                            >
                                Expandir todo
                            </button>
                            <button
                                type="button"
                                class="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                                @click="collapseAll"
                            >
                                Colapsar todo
                            </button>
                        </div>
                    </div>
                    <div v-if="roots.length === 0" class="p-10 text-center text-sm text-gray-500">
                        Aún no hay jerarquía construida. Asigna un padre a las áreas de la sección superior.
                    </div>
                    <ul v-else :class="mode === 'list' ? 'org-tree-list' : 'org-tree'">
                        <OrgChartNode
                            v-for="root in roots"
                            :key="root.id"
                            :node="root"
                            :mode="mode"
                            :collapsed="collapsed"
                            @edit-parent="openParentEditor"
                        />
                    </ul>
                </div>
            </div>

            <!-- Panel lateral: empleados sin asignar -->
            <aside class="col-span-12 lg:col-span-3 bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
                <div>
                    <h2 class="text-sm font-bold text-amber-800 uppercase">
                        Sin asignar
                    </h2>
                    <p class="text-xs text-amber-700 mt-1">
                        Empleados en puesto <strong>POR DEFECTO</strong> que aún deben reubicarse en el organigrama.
                    </p>
                </div>

                <div v-if="unassigned.length === 0" class="text-xs text-amber-700/70 italic">
                    No hay empleados pendientes por asignar.
                </div>

                <ul v-else class="space-y-2 max-h-[70vh] overflow-y-auto">
                    <li
                        v-for="u in unassigned"
                        :key="u.employee_job_id"
                        class="bg-white rounded-md border border-amber-200 p-2 text-xs space-y-1"
                    >
                        <div class="font-semibold text-slate-800">{{ u.full_name }}</div>
                        <div class="text-slate-500">{{ u.email || '—' }}</div>
                        <div class="text-[10px] text-amber-700">
                            Puesto actual: {{ u.job_name }}
                        </div>
                    </li>
                </ul>

                <div class="text-xs text-amber-700 pt-2 border-t border-amber-200">
                    Total: <span class="font-semibold">{{ unassigned.length }}</span>
                </div>
            </aside>
        </div>

        <EditWorkAreaParentDrawer
            v-if="editingArea"
            :area="editingArea"
            :all-areas="flatAreas"
            @close="editingArea = null"
            @saved="onSaved"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import OrgChartNode from '@/modules/shr/components/OrgChartNode.vue'
import EditWorkAreaParentDrawer from '@/modules/shr/components/EditWorkAreaParentDrawer.vue'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface OrgImportResult {
    total: number
    applied: boolean
    areas_created: number
    positions_created: number
    employees_created: number
    errors: { row: number; reason: string }[]
}

interface Emp {
    employee_id: number
    user_id: number | null
    full_name: string
    email: string | null
    employee_job_id: number
    job_id: number
    job_name: string
    work_area_id: number
}

interface Job {
    id: number
    name: string
    description: string | null
    max_holders: number | null
    current_employees: Emp[]
}

interface WorkAreaFlat {
    id: number
    name: string
    description: string | null
    parent_work_area_id: number | null
    head_job_position_id: number | null
    is_default: boolean
    status: boolean
    jobs: Job[]
}

interface PageTreeNode extends Omit<WorkAreaFlat, 'parent_work_area_id'> {
    children: PageTreeNode[]
}

const roots = ref<PageTreeNode[]>([])
const orphans = ref<PageTreeNode[]>([])
const flatAreas = ref<WorkAreaFlat[]>([])
const unassigned = ref<Emp[]>([])
const loading = ref(false)
const editingArea = ref<WorkAreaFlat | null>(null)

/* Vista (árbol / compacto) + estado de nodos colapsados (por id de área). */
const mode = ref<'tree' | 'list'>('tree')
const collapsed = reactive(new Set<number>())

/** Recolecta los ids de áreas que tienen hijos (para colapsar todo). */
function collectParentIds(nodes: PageTreeNode[], acc: number[] = []): number[] {
    for (const n of nodes) {
        if (n.children && n.children.length) {
            acc.push(n.id)
            collectParentIds(n.children, acc)
        }
    }
    return acc
}

function expandAll() {
    collapsed.clear()
}

function collapseAll() {
    collapsed.clear()
    for (const id of collectParentIds(roots.value)) collapsed.add(id)
}

/** Colapsa todo salvo las raíces (las raíces quedan expandidas). */
function collapseAllButRoots() {
    collapsed.clear()
    for (const root of roots.value) {
        for (const id of collectParentIds(root.children ?? [])) collapsed.add(id)
    }
}

function openParentEditor(node: { id: number }) {
    const found = flatAreas.value.find(a => a.id === node.id)
    if (found) editingArea.value = found
}

async function onSaved() {
    editingArea.value = null
    await load()
}

function buildTree(flat: WorkAreaFlat[]): PageTreeNode[] {
    // Excluye el área default del árbol visual
    const visible = flat.filter(w => ! w.is_default)
    const defaultId = flat.find(w => w.is_default)?.id ?? null

    const byId = new Map<number, PageTreeNode>()
    visible.forEach(w => {
        byId.set(w.id, { ...w, children: [] } as PageTreeNode)
    })

    const rootList: PageTreeNode[] = []
    visible.forEach(w => {
        const node = byId.get(w.id)!
        const parent = w.parent_work_area_id
        // Si apunta al área default o a un parent inexistente, se trata como raíz
        if (parent && parent !== defaultId && byId.has(parent)) {
            byId.get(parent)!.children.push(node)
        } else {
            rootList.push(node)
        }
    })

    const sortRec = (nodes: PageTreeNode[]) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name))
        nodes.forEach(n => sortRec(n.children))
    }
    sortRec(rootList)
    return rootList
}

/** Separa orphans (root sin hijos) del árbol principal. */
function splitOrphans(rootList: PageTreeNode[]): { tree: PageTreeNode[]; orphans: PageTreeNode[] } {
    const orphansList: PageTreeNode[] = []
    const tree: PageTreeNode[] = []
    for (const r of rootList) {
        if (!r.children || r.children.length === 0) orphansList.push(r)
        else tree.push(r)
    }
    return { tree, orphans: orphansList }
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.SHR_API.organizationChart.workAreas)
        const flat: WorkAreaFlat[] = data['work-areas'] ?? []
        flatAreas.value = flat
        const fullTree = buildTree(flat)
        const { tree, orphans: orphList } = splitOrphans(fullTree)
        roots.value = tree
        orphans.value = orphList
        unassigned.value = data['unassigned_employees'] ?? []
        // Inicia con las raíces expandidas y el resto compactado.
        collapseAllButRoots()
    } finally {
        loading.value = false
    }
}

onMounted(load)

/* -------------------------------------------------------------------------- */
/* IMPORTAR / FORMATO */
/* -------------------------------------------------------------------------- */
const importOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<OrgImportResult | null>(null)

function downloadTemplate() {
    const content =
        'area_name,area_parent_name,position_name,role_code,max_holders,employee_names,employee_first_surname,employee_second_surname,employee_email\n' +
        'DIRECCIÓN GENERAL,,DIRECTOR GENERAL,,1,ELVIS JAVIER,RECIO,CAMPOS,director.general@ejemplo.mx\n' +
        'DIRECCIÓN ACADÉMICA,DIRECCIÓN GENERAL,DIRECTOR ACADÉMICO,,1,RUBÍ,REYES,HERNÁNDEZ,dir.academica@ejemplo.mx\n' +
        'DEPARTAMENTO DE RECURSOS HUMANOS,SUBDIRECCIÓN ADMINISTRATIVA,JEFE DEL DEPARTAMENTO DE RECURSOS HUMANOS,,1,XÓCHITL JANET,COLINS,SOLIS,rh@ejemplo.mx\n'
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formato_organigrama.csv'
    a.click()
    URL.revokeObjectURL(url)
}

function openImport() {
    importFile.value = null
    importResult.value = null
    importOpen.value = true
}

function closeImport() {
    importOpen.value = false
}

function onFileSelected(e: Event) {
    const files = (e.target as HTMLInputElement).files
    importFile.value = files && files.length ? files[0]! : null
    importResult.value = null
}

async function submitImport() {
    if (!importFile.value) return
    importing.value = true
    importResult.value = null
    try {
        const fd = new FormData()
        fd.append('file', importFile.value)
        const { data } = await api.post(API.SHR_API.organizationChart.import, fd)
        importResult.value = data
        if ((data.areas_created ?? 0) + (data.positions_created ?? 0) + (data.employees_created ?? 0) > 0) {
            load()
        }
    } catch (e: any) {
        importResult.value = {
            total: 0, applied: false, areas_created: 0, positions_created: 0, employees_created: 0,
            errors: [{ row: 0, reason: e?.response?.data?.message ?? 'Error al procesar el archivo.' }],
        }
    } finally {
        importing.value = false
    }
}
</script>

<style scoped>
.org-tree {
    list-style: none;
    margin: 0;
    padding: 20px 0;
    display: flex;
    flex-direction: row;
    gap: 40px;
    justify-content: center;
    align-items: flex-start;
    min-width: max-content;
}
/* Vista compacta: raíces apiladas verticalmente (indentado tipo árbol de archivos) */
.org-tree-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: stretch;
}
.org-orphans {
    list-style: none;
    margin: 0;
    padding: 8px 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
}
.org-orphans :deep(.org-node) { padding-top: 0; }
.org-orphans :deep(.org-node::before) { display: none; }
.org-orphans :deep(.org-node .org-card) { min-width: 200px; max-width: 240px; }
</style>
