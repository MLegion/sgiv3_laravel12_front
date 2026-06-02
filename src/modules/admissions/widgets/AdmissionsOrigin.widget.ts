import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsOrigin.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.stats.origin',
    component: Component,
    hasSettings: true,
}

export default definition
