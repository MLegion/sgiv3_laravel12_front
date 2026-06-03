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

        <div v-else class="grid md:grid-cols-[260px_1fr] gap-4">
            <!-- Lista de roles -->
            <div class="rounded-xl border bg-white divide-y max-h-[70vh] overflow-y-auto">
                <button v-for="r in roles" :key="r.code" type="button"
                    class="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition"
                    :class="selected?.code === r.code ? 'bg-blue-50' : ''"
                    @click="selected = r">
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-medium text-slate-700">{{ r.name }}</span>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{{ r.menuCount }}</span>
                    </div>
                    <span class="text-[10px] font-mono text-slate-400">{{ r.code }}</span>
                </button>
            </div>

            <!-- Detalle del rol -->
            <div v-if="selected" class="rounded-xl border bg-white p-5 space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 class="text-sm font-bold text-slate-700 uppercase">{{ selected.name }}</h2>
                        <span class="text-[10px] font-mono text-slate-400">{{ selected.code }}</span>
                    </div>
                </div>

                <!-- Contexto requerido por el rol -->
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Contexto requerido</p>
                    <div v-if="selected.requiredContexts.length" class="flex flex-wrap gap-2">
                        <span v-for="c in selected.requiredContexts" :key="c.alias"
                            class="text-[11px] px-2 py-0.5 rounded-full" :class="c.is_required ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
                            {{ c.alias }}<span v-if="c.is_required"> · obligatorio</span><span v-if="c.is_multiple"> · múltiple</span>
                        </span>
                    </div>
                    <p v-else class="text-xs text-slate-400 italic">No requiere contexto (rol global).</p>
                </div>

                <!-- Menús que otorga -->
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Menús que otorga ({{ selected.menus.length }})</p>
                    <div v-if="!selected.menus.length" class="text-xs text-slate-400 italic">Este rol no otorga menús navegables.</div>
                    <table v-else class="w-full text-sm">
                        <thead>
                            <tr class="text-[10px] font-black text-slate-400 uppercase border-b">
                                <th class="text-left py-1.5">Sección</th>
                                <th class="text-left py-1.5">Opción</th>
                                <th class="text-left py-1.5">Ruta</th>
                                <th class="text-left py-1.5">Permiso</th>
                                <th class="text-left py-1.5">Condición</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(m, i) in selected.menus" :key="i" class="border-b last:border-0 align-top">
                                <td class="py-1.5 text-slate-500">{{ m.path || '—' }}</td>
                                <td class="py-1.5 text-slate-700 font-medium">{{ m.label }}</td>
                                <td class="py-1.5"><code class="text-[11px] text-slate-500">{{ m.route }}</code></td>
                                <td class="py-1.5">
                                    <code v-if="m.permission" class="text-[11px] text-indigo-600">{{ m.permission }}</code>
                                    <span v-else class="text-[11px] text-slate-400 italic">público</span>
                                    <span v-if="m.itemContext.length" class="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-600">ctx: {{ m.itemContext.join(', ') }}</span>
                                </td>
                                <td class="py-1.5">
                                    <span v-if="m.excludeRoles.length" class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                                        oculto para: {{ m.excludeRoles.join(', ') }}
                                    </span>
                                    <span v-else class="text-[11px] text-slate-300">—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-else class="rounded-xl border bg-slate-50 p-10 text-center text-sm text-slate-400">
                Selecciona un rol para ver los menús que otorga.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface RoleContext { alias: string; is_required: boolean; is_multiple: boolean }
interface RoleMenuItem { path: string; label: string; route: string; permission: string | null; itemContext: string[]; excludeRoles: string[] }
interface RoleMenus { code: string; name: string; requiredContexts: RoleContext[]; menuCount: number; menus: RoleMenuItem[] }

const loading = ref(true)
const roles = ref<RoleMenus[]>([])
const selected = ref<RoleMenus | null>(null)

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
