<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Plataformas MOOC</h1>
            <button @click="openCreate" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Nueva plataforma</button>
        </div>
        <p class="text-xs text-slate-400">Catálogo configurable de plataformas de cursos MOOC (p. ej. MéxicoX). Las inactivas no aparecen al alumno.</p>

        <section class="rounded-xl border bg-white p-4">
            <p v-if="!rows.length" class="text-sm text-slate-400">Sin plataformas. Crea la primera.</p>
            <table v-else class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Plataforma</th><th>URL</th><th>Ámbito</th><th>Activa</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="p in rows" :key="p.id" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-700">{{ p.name }}</td>
                        <td class="text-slate-500"><a v-if="p.url" :href="p.url" target="_blank" class="text-emerald-600 hover:underline">{{ p.url }}</a><span v-else>—</span></td>
                        <td class="text-slate-500">{{ p.is_global ? 'Global' : 'Plantel' }}</td>
                        <td><span :class="p.is_active ? 'text-emerald-600' : 'text-slate-400'">{{ p.is_active ? 'Sí' : 'No' }}</span></td>
                        <td class="text-right"><button v-if="!p.is_global" @click="openEdit(p)" class="text-xs text-emerald-600 hover:underline">editar</button><span v-else class="text-[10px] text-slate-300">global</span></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4" @click.self="showForm = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">{{ form.id ? 'Editar' : 'Nueva' }} plataforma</h2>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                    <input v-model="form.name" class="w-full rounded-lg border-slate-300 text-sm" placeholder="MéxicoX" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">URL (opcional)</label>
                    <input v-model="form.url" class="w-full rounded-lg border-slate-300 text-sm" placeholder="https://mexicox.gob.mx" />
                </div>
                <label v-if="form.id" class="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" v-model="form.is_active" /> Activa
                </label>
                <div class="flex justify-end gap-2 pt-1">
                    <button @click="showForm = false" class="px-4 py-2 rounded-lg border text-sm text-slate-500">Cancelar</button>
                    <button @click="save" :disabled="busy || !form.name" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const AC = API.AC_API
const toast = useToast()
const rows = ref<any[]>([])
const busy = ref(false)
const showForm = ref(false)
const form = reactive<any>({ id: null, name: '', url: '', is_active: true })

async function load() {
    const { data } = await api.get(AC.moocPlatforms)
    rows.value = data ?? []
}
function openCreate() { Object.assign(form, { id: null, name: '', url: '', is_active: true }); showForm.value = true }
function openEdit(p: any) { Object.assign(form, { id: p.id, name: p.name, url: p.url ?? '', is_active: p.is_active }); showForm.value = true }

async function save() {
    busy.value = true
    try {
        if (form.id) {
            await api.put(AC.moocPlatform(form.id), { name: form.name, url: form.url || null, is_active: form.is_active })
        } else {
            await api.post(AC.moocPlatforms, { name: form.name, url: form.url || null })
        }
        toast.success('Plataforma guardada.')
        showForm.value = false
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
