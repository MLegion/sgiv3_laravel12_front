<template>
    <span
        class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
        :class="ui.color"
    >
        <!-- ICONOS HEROICONS INLINE -->
        <svg
            v-if="ui.icon === 'document-text'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25V6.75A2.25 2.25 0 0017.25 4.5h-6.75L4.5 10.5v6.75A2.25 2.25 0 006.75 19.5h6.75"
            />
        </svg>

        <svg
            v-else-if="ui.icon === 'clock'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6l4 2"
            />
            <circle cx="12" cy="12" r="9" />
        </svg>

        <svg
            v-else-if="ui.icon === 'check-circle'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75l2.25 2.25L15 9.75"
            />
            <circle cx="12" cy="12" r="9" />
        </svg>

        <svg
            v-else-if="ui.icon === 'x-circle'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 9l6 6m0-6l-6 6"
            />
            <circle cx="12" cy="12" r="9" />
        </svg>

        {{ ui.label }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'
import { getApprovalStatusUI } from '@/shared/enums/approval-status.helpers'

const props = defineProps<{
    status: ApprovalStatusEnum
}>()

const ui = computed(() => getApprovalStatusUI(props.status))
</script>
