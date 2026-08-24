<template>
    <div class="space-y-4 max-w-3xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Padrón de Ciencias Básicas</h1>
            <p class="text-sm text-slate-500">Define qué docentes son de básicas por modalidad y quién es su jefatura (aprueba el horario — fase B).</p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-4">
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Ámbito (modalidad · campus)</label>
            <select v-model.number="modalityId" class="w-full border rounded-lg px-3 py-2 text-sm" @change="loadMembers">
                <option :value="null" disabled>Selecciona un ámbito…</option>
                <option v-for="m in modalities" :key="m.id" :value="m.id">{{ m.label }}</option>
            </select>
        </div>

        <template v-if="modalityId">
            <!-- Agregar docente -->
            <div class="bg-white border rounded-xl shadow-sm p-4 flex items-end gap-3">
                <div class="flex-1">
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Agregar docente al ámbito</label>
                    <FormRemoteSelect
                        v-model="newTeacherId"
                        :endpoint="API.SCA_API.teachers.list"
                        :params="{ per_page: 1000 }"
                        :item-label="teacherLabel" item-value="id" :item-searchs="['name']"
                        placeholder="Busca un docente…"
                    />
                </div>
                <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    :disabled="busy || !newTeacherId" @click="addMember">Agregar</button>
            </div>

            <!-- Miembros -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th class="text-left px-4 py-2">Docente</th><th class="px-4 py-2">Jefatura</th><th class="px-4 py-2"></th></tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="m in members" :key="m.teacherId">
                            <td class="px-4 py-2 text-slate-800">{{ m.name }}</td>
                            <td class="px-4 py-2 text-center">
                                <input type="checkbox" :checked="m.isManager" :disabled="busy" @change="toggleManager(m, $event)" />
                            </td>
                            <td class="px-4 py-2 text-right">
                                <button class="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100" :disabled="busy" @click="removeMember(m)">Quitar</button>
                            </td>
                        </tr>
                        <tr v-if="members.length === 0"><td colspan="3" class="px-4 py-4 text-center text-slate-400">Sin docentes en este ámbito.</td></tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

interface Member { teacherId: number; name: string; isManager: boolean }

const toast = useToast()
const B = API.MIDOCENCIA_API.basicas

const modalities = ref<Array<{ id: number; label: string }>>([])
const modalityId = ref<number | null>(null)
const members = ref<Member[]>([])
const newTeacherId = ref<number | null>(null)
const busy = ref(false)

const teacherLabel = (t: any) => t.displayName ?? t.name ?? `Docente #${t.id}`

onMounted(async () => {
    try { const { data } = await api.get(B.modalities); modalities.value = data ?? [] } catch { toast.error('No se pudieron cargar las modalidades.') }
})

async function loadMembers() {
    if (!modalityId.value) { members.value = []; return }
    try { const { data } = await api.get(B.members(modalityId.value)); members.value = data ?? [] }
    catch { members.value = [] }
}

async function set(teacherId: number, isMember: boolean, isManager: boolean) {
    busy.value = true
    try {
        await api.post(B.setMember, { modality_id: modalityId.value, teacher_id: teacherId, is_member: isMember, is_manager: isManager })
        await loadMembers()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo actualizar.') }
    finally { busy.value = false }
}

async function addMember() {
    if (!newTeacherId.value) return
    await set(newTeacherId.value, true, false)
    newTeacherId.value = null
    toast.success('Docente agregado.')
}
function toggleManager(m: Member, e: Event) {
    set(m.teacherId, true, (e.target as HTMLInputElement).checked)
}
function removeMember(m: Member) {
    set(m.teacherId, false, false)
}
</script>
