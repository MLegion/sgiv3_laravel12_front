<template>
    <li class="org-node">
        <div
            class="org-card"
            :class="node.status ? 'org-card--active' : 'org-card--inactive'"
        >
            <button
                type="button"
                class="org-card-edit"
                title="Editar jerarquía"
                @click.stop="$emit('edit-parent', node)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z"/>
                </svg>
            </button>
            <div class="org-card-title">{{ node.name }}</div>
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
                            {{ emp.full_name }}
                        </div>
                    </div>
                    <div v-else class="org-emp-vacant">Vacante</div>
                </div>
            </div>
            <div v-else class="org-card-jobs-empty">
                — Sin puestos activos —
            </div>
        </div>

        <ul v-if="node.children?.length" class="org-children">
            <OrgChartNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                @edit-parent="(n) => $emit('edit-parent', n)"
            />
        </ul>
    </li>
</template>

<script setup lang="ts">
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
defineProps<{ node: TreeNode }>()
defineEmits<{
    (e: 'edit-parent', node: TreeNode): void
}>()

function overLimit(job: Job) {
    return job.max_holders ? job.current_employees.length > job.max_holders : false
}
</script>

<style scoped>
.org-node, .org-children {
    list-style: none;
    margin: 0;
    padding: 0;
}

.org-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    position: relative;
    flex: none;
}

.org-node::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 2px;
    height: 20px;
    background: #94a3b8;
    transform: translateX(-1px);
}

.org-children > .org-node::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    border-top: 2px solid #94a3b8;
    pointer-events: none;
}
.org-children > .org-node:only-child::after { display: none; }
.org-children > .org-node:first-child::after { left: 50%; }
.org-children > .org-node:last-child::after { right: 50%; }

.org-tree > .org-node::before { display: none; }
.org-tree > .org-node { padding-top: 0; }

.org-card {
    min-width: 240px;
    max-width: 300px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 2px solid #cbd5e1;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    text-align: left;
    z-index: 1;
    position: relative;
}
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

.org-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
    text-transform: uppercase;
    text-align: center;
}
.org-card-desc {
    margin-top: 4px;
    font-size: 11px;
    color: #64748b;
    text-align: center;
}
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
    font-size: 11px;
    color: #0f172a;
    padding: 2px 6px;
    background: #f1f5f9;
    border-radius: 4px;
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

.org-children {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    padding-top: 20px;
    position: relative;
    gap: 24px;
}
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
</style>
