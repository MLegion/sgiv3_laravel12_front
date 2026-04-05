<template>
    <div class="max-w-2xl space-y-4">
        <PortalEditHeader
            title="OTROS DATOS"
            :editing="editing" :submitting="submitting" :has-draft="hasDraft" :save-error="saveError"
            @edit="startEditing" @cancel="cancel" @save="save"
        />
        <PortalRequiredNotice />

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>
        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <template v-if="editing">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div class="sm:col-span-2 space-y-1">
                        <label class="text-xs font-medium text-slate-600">GRUPO INDÍGENA</label>
                        <select v-model="form.indigenous_group_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase">
                            <option :value="null">NINGUNO</option>
                            <option v-for="g in indigenousGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
                        </select>
                    </div>
                    <div class="sm:col-span-2 space-y-1">
                        <label class="text-xs font-medium text-slate-600">LENGUA INDÍGENA</label>
                        <select v-model="form.indigenous_language_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase">
                            <option :value="null">NINGUNA</option>
                            <option v-for="l in indigenousLanguages" :key="l.id" :value="l.id">{{ l.name }}</option>
                        </select>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <ReadField label="GRUPO INDÍGENA" :value="indigenousGroups.find(g => g.id === form.indigenous_group_id)?.name ?? '—'" />
                    <ReadField label="LENGUA INDÍGENA" :value="indigenousLanguages.find(l => l.id === form.indigenous_language_id)?.name ?? '—'" />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PortalEditHeader from './PortalEditHeader.vue'
import PortalRequiredNotice from './PortalRequiredNotice.vue'
import ReadField from './ReadField.vue'

const DRAFT = 'otros'

const loading = ref(true); const editing = ref(false); const submitting = ref(false)
const saveError = ref<string | null>(null); const hasDraft = ref(false)
const indigenousGroups    = ref<{ id: number; name: string }[]>([])
const indigenousLanguages = ref<{ id: number; name: string }[]>([])
let applicantId: number | null = null

const form = reactive({
    indigenous_group_id:    null as number | null,
    indigenous_language_id: null as number | null,
})

function draftKey() { return applicantId ? `portal_${applicantId}_${DRAFT}` : null }

watch(form, () => {
    const k = draftKey()
    if (editing.value && k) { localStorage.setItem(k, JSON.stringify({ ...form })); hasDraft.value = true }
}, { deep: true })

function mapData(data: any) {
    form.indigenous_group_id    = data.indigenousGroupId ?? null
    form.indigenous_language_id = data.indigenousLanguageId ?? null
}

async function fetchMe() {
    loading.value = true
    try {
        const [{ data }, groupsRes, langsRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.portal.me),
            api.get(API.ADMISSIONS_API.portal.catalogs.indigenousGroups),
            api.get(API.ADMISSIONS_API.portal.catalogs.indigenousLanguages),
        ])
        applicantId = data.id; mapData(data)
        indigenousGroups.value    = Array.isArray(groupsRes.data) ? groupsRes.data : []
        indigenousLanguages.value = Array.isArray(langsRes.data) ? langsRes.data : []
        const draft = localStorage.getItem(`portal_${data.id}_${DRAFT}`)
        if (draft) { Object.assign(form, JSON.parse(draft)); hasDraft.value = true }
    } finally { loading.value = false }
}

function startEditing() { saveError.value = null; editing.value = true }

function cancel() {
    editing.value = false; saveError.value = null; fetchMe()
    const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
}

async function save() {
    saveError.value = null; submitting.value = true
    try {
        await api.put(API.ADMISSIONS_API.portal.update, {
            indigenous_group_id:    form.indigenous_group_id    || null,
            indigenous_language_id: form.indigenous_language_id || null,
        })
        editing.value = false
        const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { submitting.value = false }
}

onMounted(fetchMe)
</script>
