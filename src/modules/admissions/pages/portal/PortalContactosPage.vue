<template>
    <div class="max-w-2xl space-y-4">
        <h1 class="text-xl font-semibold text-slate-800">CONTACTOS</h1>
        <PortalRequiredNotice />
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between">
            <p class="text-sm text-slate-500">Mínimo 1, máximo 3 contactos.</p>
            <button
                v-if="contacts.length < 3"
                class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                + AGREGAR
            </button>
        </div>

        <div v-if="loading" class="text-xs text-slate-400">Cargando...</div>
        <div v-else-if="contacts.length === 0" class="text-xs text-slate-400 italic">Sin contactos registrados.</div>

        <ul v-else class="space-y-3">
            <li v-for="c in contacts" :key="c.id" class="border rounded-xl px-4 py-3 bg-white">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <p class="text-sm font-medium text-slate-700">{{ c.name }} {{ c.firstSurname }} {{ c.secondSurname ?? '' }}</p>
                        <p class="text-xs text-slate-500 capitalize">
                            {{ c.relationship }}
                            <span v-if="c.isEmergencyContact" class="ml-1 text-[10px] font-bold text-amber-600 uppercase">Emergencia</span>
                        </p>
                        <p v-if="c.phone" class="text-xs text-slate-400">{{ c.phone }}</p>
                        <p v-if="c.email" class="text-xs text-slate-400">{{ c.email }}</p>
                    </div>
                    <div v-if="true" class="flex gap-1 shrink-0">
                        <button class="border p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition" @click="openEdit(c)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                        </button>
                        <button class="border p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition" @click="deleteTarget = c">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    </div>

    <!-- Modal Contacto -->
    <Teleport to="body">
        <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/40" @click="modalOpen = false" />
            <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                    {{ editingContact ? 'Editar Contacto' : 'Nuevo Contacto' }}
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre *</label>
                        <input v-model="cForm.name" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Primer Apellido *</label>
                        <input v-model="cForm.first_surname" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Segundo Apellido</label>
                        <input v-model="cForm.second_surname" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Parentesco *</label>
                        <select v-model="cForm.relationship" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="">Seleccionar...</option>
                            <option value="padre">Padre</option>
                            <option value="madre">Madre</option>
                            <option value="tutor_legal">Tutor Legal</option>
                            <option value="hermano">Hermano/a</option>
                            <option value="conyuge">Cónyuge</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Teléfono</label>
                        <input v-model="cForm.phone" type="text" maxlength="20" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
                        <input v-model="cForm.email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div class="sm:col-span-2 flex items-center gap-2">
                        <input v-model="cForm.is_emergency_contact" type="checkbox" id="portal_emergency" class="rounded" />
                        <label for="portal_emergency" class="text-xs text-slate-600">Contacto de emergencia</label>
                    </div>
                </div>
                <p v-if="cError" class="text-xs text-red-600">{{ cError }}</p>
                <div class="flex justify-end gap-2 pt-2">
                    <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" @click="modalOpen = false">CANCELAR</button>
                    <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" :disabled="saving" @click="save">
                        {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Modal Eliminar -->
    <Teleport to="body">
        <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/40" @click="deleteTarget = null" />
            <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar Contacto</h2>
                <p class="text-sm text-slate-600">
                    ¿Eliminar el contacto <span class="font-semibold">{{ deleteTarget.name }} {{ deleteTarget.firstSurname }}</span>?
                </p>
                <div class="flex justify-end gap-2">
                    <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" @click="deleteTarget = null">CANCELAR</button>
                    <button class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" :disabled="deleting" @click="doDelete">
                        {{ deleting ? 'ELIMINANDO...' : 'ELIMINAR' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PortalRequiredNotice from './PortalRequiredNotice.vue'


const loading     = ref(false)
const contacts    = ref<any[]>([])
const modalOpen   = ref(false)
const editingContact = ref<any | null>(null)
const cForm       = ref({ name: '', first_surname: '', second_surname: '', relationship: '', phone: '', email: '', is_emergency_contact: true })
const cError      = ref<string | null>(null)
const saving      = ref(false)
const deleteTarget = ref<any | null>(null)
const deleting    = ref(false)

async function fetchContacts() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.contacts.list)
        contacts.value = Array.isArray(data) ? data : []
    } finally {
        loading.value = false
    }
}

function openCreate() {
    editingContact.value = null
    cForm.value = { name: '', first_surname: '', second_surname: '', relationship: '', phone: '', email: '', is_emergency_contact: true }
    cError.value = null
    modalOpen.value = true
}

function openEdit(c: any) {
    editingContact.value = c
    cForm.value = { name: c.name, first_surname: c.firstSurname, second_surname: c.secondSurname ?? '', relationship: c.relationship, phone: c.phone ?? '', email: c.email ?? '', is_emergency_contact: c.isEmergencyContact }
    cError.value = null
    modalOpen.value = true
}

async function save() {
    cError.value = null
    if (!cForm.value.name.trim() || !cForm.value.first_surname.trim() || !cForm.value.relationship) {
        cError.value = 'Nombre, apellido y parentesco son requeridos.'; return
    }
    saving.value = true
    try {
        const payload = { ...cForm.value, second_surname: cForm.value.second_surname || null, phone: cForm.value.phone || null, email: cForm.value.email || null }
        if (editingContact.value) {
            await api.put(API.ADMISSIONS_API.portal.contacts.update(editingContact.value.id), payload)
        } else {
            await api.post(API.ADMISSIONS_API.portal.contacts.create, payload)
        }
        modalOpen.value = false
        await fetchContacts()
    } catch (e: any) {
        cError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        saving.value = false
    }
}

async function doDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await api.delete(API.ADMISSIONS_API.portal.contacts.delete(deleteTarget.value.id))
        deleteTarget.value = null
        await fetchContacts()
    } finally {
        deleting.value = false
    }
}

onMounted(fetchContacts)
</script>
