import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: 'signatures/pending',
        name: 'signatures.pending',
        component: () => import('@/modules/signatures/pages/PendingSignaturesPage.vue'),
        meta: { title: 'Por firmar' },
    },
]

export default routes
