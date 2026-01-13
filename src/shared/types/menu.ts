export interface MenuItem {
    code: string
    label: string
    icon?: string
    route?: string
    children?: MenuItem[]
}
