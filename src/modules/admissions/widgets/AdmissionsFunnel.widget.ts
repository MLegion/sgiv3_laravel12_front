import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsFunnel.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.applicants.funnel',
    component: Component,
    hasSettings: true,
}

export default definition
