import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './ApplicantsPeriodCount.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.applicants.period-count',
    component: Component,
    hasSettings: true,
}

export default definition
