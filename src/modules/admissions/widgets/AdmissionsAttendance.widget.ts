import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsAttendance.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.stats.attendance',
    component: Component,
    hasSettings: true,
}

export default definition
