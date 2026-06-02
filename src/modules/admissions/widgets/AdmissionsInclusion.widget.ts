import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsInclusion.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.stats.inclusion',
    component: Component,
    hasSettings: true,
}

export default definition
