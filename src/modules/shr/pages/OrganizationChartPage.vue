<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Organigrama institucional
            </h1>
            <button
                type="button"
                class="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
                :disabled="loading"
                @click="load"
            >
                {{ loading ? 'Cargando…' : 'Actualizar' }}
            </button>
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
                    <h2 class="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                        Organigrama configurado
                    </h2>
                    <div v-if="roots.length === 0" class="p-10 text-center text-sm text-gray-500">
                        Aún no hay jerarquía construida. Asigna un padre a las áreas de la sección superior.
                    </div>
                    <ul v-else class="org-tree">
                        <OrgChartNode
                            v-for="root in roots"
                            :key="root.id"
                            :node="root"
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
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import OrgChartNode from '@/modules/shr/components/OrgChartNode.vue'
import EditWorkAreaParentDrawer from '@/modules/shr/components/EditWorkAreaParentDrawer.vue'

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

interface TreeNode extends Omit<WorkAreaFlat, 'parent_work_area_id'> {
    children: TreeNode[]
}

const roots = ref<TreeNode[]>([])
const orphans = ref<TreeNode[]>([])
const flatAreas = ref<WorkAreaFlat[]>([])
const unassigned = ref<Emp[]>([])
const loading = ref(false)
const editingArea = ref<WorkAreaFlat | null>(null)

function openParentEditor(node: TreeNode) {
    const found = flatAreas.value.find(a => a.id === node.id)
    if (found) editingArea.value = found
}

async function onSaved() {
    editingArea.value = null
    await load()
}

function buildTree(flat: WorkAreaFlat[]): TreeNode[] {
    // Excluye el área default del árbol visual
    const visible = flat.filter(w => ! w.is_default)
    const defaultId = flat.find(w => w.is_default)?.id ?? null

    const byId = new Map<number, TreeNode>()
    visible.forEach(w => {
        byId.set(w.id, { ...w, children: [] } as TreeNode)
    })

    const rootList: TreeNode[] = []
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

    const sortRec = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name))
        nodes.forEach(n => sortRec(n.children))
    }
    sortRec(rootList)
    return rootList
}

/** Separa orphans (root sin hijos) del árbol principal. */
function splitOrphans(rootList: TreeNode[]): { tree: TreeNode[]; orphans: TreeNode[] } {
    const orphansList: TreeNode[] = []
    const tree: TreeNode[] = []
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
    } finally {
        loading.value = false
    }
}

onMounted(load)
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
