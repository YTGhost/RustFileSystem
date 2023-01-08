export interface Fcb {
    name: string
    file_type: any
    first_cluster: any
    length: any
}

export interface FileItem {
    fcb?: Fcb,
    op: String
}