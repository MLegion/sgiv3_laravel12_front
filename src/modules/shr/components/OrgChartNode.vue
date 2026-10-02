<template>
    <li class="org-node" :class="mode === 'list' ? 'org-node--list' : 'org-node--tree'">
        <div
            class="org-card"
            :class="node.status ? 'org-card--active' : 'org-card--inactive'"
        >
            <button aria-label="Editar jerarquía"
                type="button"
                class="org-card-edit"
                title="Editar jerarquía"
                @click.stop="$emit('edit-parent', node)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z"/>
                </svg>
            </button>

            <div class="org-card-title-row">
                <button
                    v-if="hasChildren"
                    type="button"
                    class="org-collapse-btn"
                    :title="isCollapsed ? 'Expandir' : 'Colapsar'"
                    @click.stop="toggle"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform" :class="isCollapsed ? '-rotate-90' : ''" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                </button>
                <div class="org-card-title">{{ node.name }}</div>
            </div>

            <div v-if="node.description" class="org-card-desc">{{ node.description }}</div>

            <div v-if="node.jobs?.length" class="org-card-jobs">
                <div
                    v-for="job in node.jobs"
                    :key="job.id"
                    class="org-job-row"
                >
                    <span class="org-job-chip" :title="job.description || job.name">
                        {{ job.name }}
                        <span v-if="job.max_holders"
                              class="org-job-count"
                              :class="overLimit(job) ? 'text-red-600' : 'text-gray-500'">
                            ({{ job.current_employees.length }}/{{ job.max_holders }})
                        </span>
                    </span>

                    <div v-if="job.current_employees.length" class="org-job-emps">
                        <div
                            v-for="emp in job.current_employees"
                            :key="emp.employee_job_id"
                            class="org-emp"
                            :title="emp.email || ''"
                        >
                            <span class="org-emp-avatar">
                                <UserAvatar :name="emp.full_name" :url="null" size="sm" fill />
                            </span>
                            <span class="truncate">{{ emp.full_name }}</span>
                        </div>
                    </div>
                    <div v-else class="org-emp-vacant">Vacante</div>
                </div>
            </div>
            <div v-else class="org-card-jobs-empty">
                — Sin puestos activos —
            </div>

            <!-- Badge de conteo cuando está colapsado -->
            <button
                v-if="hasChildren && isCollapsed"
                type="button"
                class="org-collapsed-badge"
                title="Expandir"
                @click.stop="toggle"
            >
                +{{ node.children!.length }} área{{ node.children!.length === 1 ? '' : 's' }}
            </button>
        </div>

        <ul
            v-if="hasChildren && !isCollapsed"
            :class="mode === 'list' ? 'org-list-children' : 'org-children'"
        >
            <OrgChartNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                :mode="mode"
                :collapsed="collapsed"
                @edit-parent="(n) => $emit('edit-parent', n)"
            />
        </ul>
    </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/app/components/ui/UserAvatar.vue'

interface Emp {
    employee_id: number
    user_id: number | null
    full_name: string
    email?: string | null
    employee_job_id: number
    job_id: number
    job_name: string
    work_area_id: number
}
interface Job {
    id: number
    name: string
    description?: string | null
    max_holders?: number | null
    current_employees: Emp[]
}
interface TreeNode {
    id: number
    name: string
    description?: string | null
    status: boolean
    is_default?: boolean
    jobs?: Job[]
    children?: TreeNode[]
}

const props = withDefaults(defineProps<{
    node: TreeNode
    mode?: 'tree' | 'list'
    collapsed?: Set<number>
}>(), {
    mode: 'tree',
    collapsed: () => new Set<number>(),
})

defineEmits<{
    (e: 'edit-parent', node: TreeNode): void
}>()

const hasChildren = computed(() => !!props.node.children?.length)
const isCollapsed = computed(() => props.collapsed.has(props.node.id))

function toggle() {
    if (props.collapsed.has(props.node.id)) props.collapsed.delete(props.node.id)
    else props.collapsed.add(props.node.id)
}

function overLimit(job: Job) {
    return job.max_holders ? job.current_employees.length > job.max_holders : false
}
</script>

<style scoped>
.org-node, .org-children, .org-list-children {
    list-style: none;
    margin: 0;
    padding: 0;
}

/* ============================ MODO ÁRBOL (horizontal) ==================== */
.org-node--tree {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    flex: none;
}

.org-children {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    position: relative;
    padding-top: 20px;
}
/* Línea vertical del padre hacia la barra horizontal de los hijos */
.org-children::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 2px;
    height: 20px;
    background: #94a3b8;
    transform: translateX(-1px);
}
/* Conectores por hijo: dos mitades con borde superior + caída vertical.
   Se usa PADDING horizontal (no gap) para que las mitades se toquen. */
.org-children > .org-node {
    position: relative;
    padding: 20px 14px 0 14px;
}
.org-children > .org-node::before,
.org-children > .org-node::after {
    content: '';
    position: absolute;
    top: 0;
    width: 50%;
    height: 20px;
    border-top: 2px solid #94a3b8;
}
.org-children > .org-node::before { right: 50%; }
.org-children > .org-node::after  { left: 50%; border-left: 2px solid #94a3b8; }
/* Un solo hijo: solo la caída vertical, sin barra horizontal */
.org-children > .org-node:only-child::before { display: none; }
.org-children > .org-node:only-child::after { left: 50%; border-top: 0; }
/* Recorta los sobrantes horizontales de los extremos */
.org-children > .org-node:first-child::before { border: 0; }
.org-children > .org-node:last-child::after { border-top: 0; }

/* ============================ MODO COMPACTO (indentado) ================== */
.org-node--list {
    display: block;
    position: relative;
}
.org-list-children {
    margin-left: 22px;
    border-left: 2px solid #e2e8f0;
}
.org-list-children > .org-node--list {
    position: relative;
    padding: 8px 0 0 22px;
}
/* Tick horizontal desde la guía vertical hasta la tarjeta */
.org-list-children > .org-node--list::before {
    content: '';
    position: absolute;
    left: 0;
    top: 26px;
    width: 20px;
    height: 2px;
    background: #e2e8f0;
}
.org-node--list > .org-card { text-align: left; }

/* ============================ TARJETA (compartida) ====================== */
.org-card {
    min-width: 240px;
    max-width: 320px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 2px solid #cbd5e1;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    text-align: left;
    z-index: 1;
    position: relative;
}
.org-node--list .org-card { min-width: 260px; max-width: 420px; }

.org-card-edit {
    position: absolute;
    top: 6px;
    right: 6px;
    background: transparent;
    border: 1px solid transparent;
    padding: 3px;
    border-radius: 4px;
    color: #64748b;
    cursor: pointer;
}
.org-card-edit:hover {
    background: #e0f2fe;
    color: #0369a1;
    border-color: #bae6fd;
}
.org-card--active { border-color: #60a5fa; background: #eff6ff; }
.org-card--inactive { opacity: 0.6; }

.org-card-title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding-right: 18px; /* espacio para el lápiz */
}
.org-node--list .org-card-title-row { justify-content: flex-start; }
.org-collapse-btn {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    color: #475569;
    background: #e2e8f0;
    cursor: pointer;
}
.org-collapse-btn:hover { background: #cbd5e1; color: #0f172a; }

.org-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
    text-transform: uppercase;
    text-align: center;
}
.org-node--list .org-card-title { text-align: left; }

.org-collapsed-badge {
    margin-top: 8px;
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    background: #e0f2fe;
    color: #0369a1;
    font-size: 10px;
    font-weight: 700;
    border: 1px solid #bae6fd;
    cursor: pointer;
}
.org-collapsed-badge:hover { background: #bae6fd; }

.org-card-desc {
    margin-top: 4px;
    font-size: 11px;
    color: #64748b;
    text-align: center;
}
.org-node--list .org-card-desc { text-align: left; }
.org-card-jobs {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.org-job-row {
    border-top: 1px dashed #e2e8f0;
    padding-top: 6px;
}
.org-job-chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: #dbeafe;
    color: #1e40af;
    font-size: 10px;
    font-weight: 700;
    margin-bottom: 4px;
}
.org-job-count {
    font-weight: 500;
    margin-left: 4px;
}
.org-job-emps {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.org-emp {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #0f172a;
    padding: 4px 8px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
/* Contenedor del avatar: borde + fondo blanco para que resalte sobre la fila y
   recorte correctamente una foto real (circular). */
.org-emp-avatar {
    display: inline-flex;
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 9999px;
    overflow: hidden;
    background: #ffffff;
    border: 2px solid #93c5fd;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.org-emp-vacant {
    font-size: 10px;
    color: #94a3b8;
    font-style: italic;
    padding: 2px 6px;
}
.org-card-jobs-empty {
    margin-top: 6px;
    font-size: 10px;
    color: #94a3b8;
    font-style: italic;
    text-align: center;
}
.org-node--list .org-card-jobs-empty { text-align: left; }
</style>
