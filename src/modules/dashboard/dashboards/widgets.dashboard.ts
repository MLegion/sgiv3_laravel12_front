import type { DashboardDefinition } from '@/shared/types/dashboard'

const definition: DashboardDefinition = {
    type:     'default',
    priority: 10,
    component: () => import('@/modules/dashboard/pages/WidgetsDashboardPage.vue'),
}

export default definition
