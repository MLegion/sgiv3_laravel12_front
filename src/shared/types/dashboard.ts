export interface DashboardDefinition {
    type: string
    component: () => Promise<any>
    priority?: number
}
