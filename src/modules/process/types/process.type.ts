export interface ProcessStage {
    key: string
    label: string
    open: boolean
    exceptionalToOpen: boolean
    exceptionalToClose: boolean
    prerequisite: { ok: boolean; message: string } | null
}

export interface ProcessModality {
    modalityId: number
    modalityLabel: string
    periodStatus: string
    stages: ProcessStage[]
}

export interface ProcessDescriptor {
    key: string
    label: string
    modalities: ProcessModality[]
}
