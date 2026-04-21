<template>
    <teleport to="body">
        <div class="fixed inset-0 z-50">
            <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

            <aside class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto">
                <div class="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
                    <h3 class="text-base font-semibold text-slate-800">
                        Editar jerarquía
                    </h3>
                    <button type="button" class="text-gray-400 hover:text-gray-700" @click="$emit('close')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="px-6 py-5 space-y-4">
                    <div>
                        <div class="text-xs uppercase text-gray-500 tracking-wide">Área de trabajo</div>
                        <div class="text-sm font-semibold text-slate-800 mt-1">
                            {{ area.name }}
                        </div>
                        <div v-if="area.description" class="text-xs text-slate-500 mt-1">
                            {{ area.description }}
                        </div>
                    </div>

                    <label class="block">
                        <span class="text-sm text-gray-700 font-medium">Área padre</span>
                        <select
                            v-model="selectedParentId"
                            class="mt-1 w-full h-10 border rounded-md px-3 text-sm"
                        >
                            <option :value="null">— Sin padre (raíz) —</option>
                            <option
                                v-for="o in validParents"
                                :key="o.id"
                                :value="o.id"
                            >
                                {{ o.indentedName }}
                            </option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">
                            No se pueden elegir descendientes del área actual para evitar ciclos.
                        </p>
                    </label>

                    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                    <div class="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            @click="$emit('close')"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-60"
                            :disabled="saving || selectedParentId === area.parent_work_area_id"
                            @click="save"
                        >
                            {{ saving ? 'Guardando…' : 'Guardar' }}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface WorkArea {
    id: number
    name: string
    description: string | null
    parent_work_area_id: number | null
    head_job_position_id: number | null
    is_default: boolean
    status: boolean
}

const props = defineProps<{
    area: WorkArea
    allAreas: WorkArea[]
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved'): void
}>()

const selectedParentId = ref<number | null>(props.area.parent_work_area_id)
const saving = ref(false)
const error  = ref('')

/** Construye el conjunto de descendientes del área actual (IDs que NO pueden ser su padre). */
const blockedIds = computed<Set<number>>(() => {
    const blocked = new Set<number>([props.area.id])
    const childrenByParent = new Map<number, number[]>()
    for (const a of props.allAreas) {
        if (a.parent_work_area_id != null) {
            const list = childrenByParent.get(a.parent_work_area_id) ?? []
            list.push(a.id)
            childrenByParent.set(a.parent_work_area_id, list)
        }
    }
    const walk = (id: number) => {
        const kids = childrenByParent.get(id) ?? []
        for (const k of kids) {
            if (! blocked.has(k)) {
                blocked.add(k)
                walk(k)
            }
        }
    }
    walk(props.area.id)
    return blocked
})

/** Lista con nombre indentado según profundidad para legibilidad. */
const validParents = computed(() => {
    const depths = new Map<number, number>()
    const calcDepth = (id: number): number => {
        if (depths.has(id)) return depths.get(id)!
        const a = props.allAreas.find(x => x.id === id)
        if (!a || a.parent_work_area_id == null) {
            depths.set(id, 0)
            return 0
        }
        const d = 1 + calcDepth(a.parent_work_area_id)
        depths.set(id, d)
        return d
    }

    return props.allAreas
        .filter(a => ! a.is_default && ! blockedIds.value.has(a.id))
        .map(a => ({
            id: a.id,
            indentedName: '— '.repeat(calcDepth(a.id)) + a.name,
        }))
        .sort((a, b) => a.indentedName.localeCompare(b.indentedName))
})

async function save() {
    saving.value = true
    error.value  = ''
    try {
        await api.put(API.SHR_API.workArea.update(props.area.id), {
            name:              props.area.name,
            description:       props.area.description,
            parent_work_area_id: selectedParentId.value,
            head_job_postion_id: props.area.head_job_position_id,  // typo del backend existente
            is_defautl:          props.area.is_default,            // typo del backend existente
            status:              props.area.status,
        })
        emit('saved')
    } catch (e: any) {
        error.value = e?.response?.data?.message || 'No se pudo guardar la jerarquía.'
    } finally {
        saving.value = false
    }
}
</script>
