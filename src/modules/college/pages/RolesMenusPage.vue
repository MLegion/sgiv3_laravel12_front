<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Roles y sus menús</h1>
            <p class="text-xs text-slate-500 mt-1">
                Vista <strong>informativa</strong>: muestra qué menús vería un usuario con cada rol, el
                contexto que requiere y sus condiciones. No modifica permisos ni asignaciones.
            </p>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>

        <div v-else class="grid md:grid-cols-[240px_1fr] gap-5 items-start">
            <!-- Lista de roles -->
            <div class="rounded-xl border bg-white divide-y max-h-[75vh] overflow-y-auto sticky top-2">
                <button v-for="r in roles" :key="r.code" type="button"
                    class="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition flex items-center justify-between gap-2"
                    :class="selected?.code === r.code ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'"
                    @click="selected = r">
                    <span class="min-w-0">
                        <span class="block text-sm font-medium text-slate-700 truncate">{{ r.name }}</span>
                        <span class="block text-[10px] font-mono text-slate-400 truncate">{{ r.code }}</span>
                    </span>
                    <span class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          :class="r.menuCount ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'">
                        {{ r.menuCount }}
                    </span>
                </button>
            </div>

            <!-- Detalle del rol -->
            <div v-if="selected" class="space-y-4">
                <!-- Encabezado -->
                <div class="rounded-xl border bg-white p-5">
                    <div class="flex items-start justify-between flex-wrap gap-3">
                        <div>
                            <h2 class="text-base font-bold text-slate-800">{{ selected.name }}</h2>
                            <span class="text-[11px] font-mono text-slate-400">{{ selected.code }}</span>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-black text-blue-600 leading-none">{{ selected.menuCount }}</p>
                            <p class="text-[10px] uppercase text-slate-400 tracking-wider">opciones de menú</p>
                        </div>
                    </div>

                    <div class="mt-3 pt-3 border-t">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Contexto requerido por el rol</p>
                        <div v-if="selected.requiredContexts.length" class="flex flex-wrap gap-2">
                            <span v-for="c in selected.requiredContexts" :key="c.alias"
                                class="text-[11px] px-2 py-0.5 rounded-full" :class="c.is_required ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
                                {{ c.alias }}<span v-if="c.is_required"> · obligatorio</span><span v-if="c.is_multiple"> · múltiple</span>
                            </span>
                        </div>
                        <p v-else class="text-xs text-slate-400 italic">No requiere contexto (rol global).</p>
                    </div>
                </div>

                <!-- Menús agrupados por sección -->
                <div v-if="!selected.menus.length" class="rounded-xl border bg-slate-50 p-8 text-center text-sm text-slate-400">
                    Este rol no otorga menús navegables.
                </div>

                <div v-else class="space-y-3">
                    <div v-for="group in groupedMenus" :key="group.section" class="rounded-xl border bg-white overflow-hidden">
                        <div class="px-4 py-2 bg-slate-50 border-b flex items-center gap-2">
                            <FolderIcon class="w-4 h-4 text-slate-400" />
                            <span class="text-xs font-bold text-slate-600 uppercase tracking-wide">{{ group.section || 'General' }}</span>
                            <span class="text-[10px] text-slate-400">({{ group.items.length }})</span>
                        </div>
                        <ul class="divide-y">
                            <li v-for="(m, i) in group.items" :key="i" class="px-4 py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50/60">
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-slate-700">{{ m.label }}</p>
                                    <code class="text-[11px] text-slate-400">{{ m.route }}</code>
                                </div>
                                <div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[55%]">
                                    <span v-if="m.permission" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono">{{ m.permission }}</span>
                                    <span v-else class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">público</span>
                                    <span v-if="m.itemContext.length" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">ctx: {{ m.itemContext.join(', ') }}</span>
                                    <span v-if="m.excludeRoles.length" class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">oculto para: {{ m.excludeRoles.join(', ') }}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div v-else class="rounded-xl border bg-slate-50 p-10 text-center text-sm text-slate-400">
                Selecciona un rol para ver los menús que otorga.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { FolderIcon } from '@heroicons/vue/24/outline'

interface RoleContext { alias: string; is_required: boolean; is_multiple: boolean }
interface RoleMenuItem { path: string; label: string; route: string; permission: string | null; itemContext: string[]; excludeRoles: string[] }
interface RoleMenus { code: string; name: string; requiredContexts: RoleContext[]; menuCount: number; menus: RoleMenuItem[] }

const loading = ref(true)
const roles = ref<RoleMenus[]>([])
const selected = ref<RoleMenus | null>(null)

const groupedMenus = computed<{ section: string; items: RoleMenuItem[] }[]>(() => {
    if (!selected.value) return []
    const map = new Map<string, RoleMenuItem[]>()
    for (const m of selected.value.menus) {
        const key = m.path || ''
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(m)
    }
    return [...map.entries()].map(([section, items]) => ({ section, items }))
})

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.COLLEGE_API.roleMenus)
        roles.value = data ?? []
        selected.value = roles.value[0] ?? null
    } finally { loading.value = false }
}

load()
</script>
