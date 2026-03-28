export interface DocumentType {
    id: number
    name: string
    shortName: string
    code: string
    description: string | null
    acceptsFormats: string[] | null
    maxSizeKb: number | null
    status: boolean
    createdAt: string
    updatedAt: string
}

export const FORMAT_OPTIONS = [
    { value: 'pdf',  label: 'PDF' },
    { value: 'jpg',  label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png',  label: 'PNG' },
    { value: 'gif',  label: 'GIF' },
    { value: 'doc',  label: 'DOC' },
    { value: 'docx', label: 'DOCX' },
    { value: 'xls',  label: 'XLS' },
    { value: 'xlsx', label: 'XLSX' },
]
