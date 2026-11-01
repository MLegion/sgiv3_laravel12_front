<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Instructores</h1>
        </div>
        <p class="text-xs text-slate-400">Pool de instructores de actividades complementarias y extraescolares (distinto de los docentes). Se dan de alta desde el personal del instituto; también se registran solos al asignarlos a una actividad.</p>

        <!-- Alta desde personal -->
        <section class="rounded-xl border bg-white p-4 space-y-2">
            <h2 class="text-sm font-bold uppercase text-slate-500">Agregar instructor desde el personal</h2>
            <div class="max-w-md">
                <FormRemoteSelect
                    v-model="picked"
                    :endpoint="AC.personnel"
                    :endpoint-by-id="AC.personnelById"
                    item-value="user_id"
                    item-label="full_name"
                    :item-searchs="['full_name']"
                    placeholder="Ver listado o buscar personal…"
                    @update:model-value="onPick" />
            </div>
        </section>

        <section class="rounded-xl border bg-white p-4">
            <p v-if="!rows.length" class="text-sm text-slate-400">Sin instructores registrados. Agrega desde el personal.</p>
            <table v-else class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Instructor</th><th>Correo</th><th>Activo</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-700">{{ r.name }}</td>
                        <td class="text-slate-500">{{ r.email ?? '—' }}</td>
                        <td><span :class="r.is_active ? 'text-emerald-600' : 'text-slate-400'">{{ r.is_active ? 'Sí' : 'No' }}</span></td>
                        <td class="text-right">
                            <button @click="toggle(r)" class="text-xs text-emerald-600 hover:underline">{{ r.is_active ? 'desactivar' : 'activar' }}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const AC = API.AC_API
const toast = useToast()
const rows = ref<any[]>([])
const picked = ref<number | null>(null)

async function load() {
    const { data } = await api.get(AC.acInstructors)
    rows.value = data ?? []
}
async function onPick(userId: number | null) {
    if (!userId) return
    try {
        await api.post(AC.acInstructors, { user_id: userId })
        toast.success('Instructor agregado.')
        picked.value = null
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo agregar.') }
}
async function toggle(r: any) {
    try {
        await api.put(AC.acInstructorItem(r.id), { is_active: !r.is_active })
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo actualizar.') }
}

onMounted(load)
</script>
