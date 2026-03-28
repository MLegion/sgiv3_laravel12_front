<template>
    <div class="max-w-xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">AGREGAR DOCUMENTO REQUERIDO GLOBAL</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div v-if="loadingUsed" class="text-sm text-slate-400 py-6 text-center">Cargando...</div>

        <div v-else-if="noMoreAvailable" class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-700 text-center">
            Todos los tipos de documento ya están configurados como requeridos globales.
        </div>

        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <FormRemoteSelect
                label="TIPO DE DOCUMENTO"
                v-model="form.document_type_id"
                :endpoint="API.ADMISSIONS_API.documentTypes.list"
                :endpoint-by-id="API.ADMISSIONS_API.documentTypes.byId"
                :search-filters="excludeFilters"
                item-label="name"
                item-value="id"
                required
            />

            <FormSwitch label="OBLIGATORIO" v-model="form.is_required" />

            <FormInput label="ORDEN" v-model="form.order" type="number" />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    GUARDAR
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const loadingUsed = ref(true)
const usedTypeIds = ref<number[]>([])
const totalDocumentTypes = ref(0)

const form = ref({
    document_type_id: null as number | null,
    is_required: true,
    order: 0,
})

const noMoreAvailable = computed(() =>
    totalDocumentTypes.value > 0 && usedTypeIds.value.length >= totalDocumentTypes.value
)

const excludeFilters = computed(() =>
    usedTypeIds.value.length > 0 ? { exclude_ids: usedTypeIds.value } : {}
)

async function fetchUsedIds() {
    try {
        const [usedRes, totalRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.globalRequiredDocuments.list, { params: { per_page: 999 } }),
            api.get(API.ADMISSIONS_API.documentTypes.list, { params: { per_page: 1 } }),
        ])
        const items = usedRes.data.items ?? usedRes.data.data ?? []
        usedTypeIds.value = items.map((d: any) => d.documentTypeId)
        totalDocumentTypes.value = totalRes.data.total ?? 0
    } finally {
        loadingUsed.value = false
    }
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.globalRequiredDocuments.create, form.value)
        router.push({ name: 'admissions.global-required-documents.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchUsedIds)
</script>
