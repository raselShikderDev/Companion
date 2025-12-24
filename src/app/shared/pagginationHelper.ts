export type IOptions = {
    page?: string | number
    limit?: string | number
    skip?: string | number
    sortBy?: string
    sortOrder?: string
}

type IOptionsResult = { 
    page: number
    limit: number
    skip: number
    sortBy: string
    sortOrder: string
}


const calculatePaggination = (options: IOptions): IOptionsResult => {
    const page: number = Number(options.page) || 1;
    const limit: number = Number(options.limit) || 10;
    const skip: number = (page - 1) * limit;
    const sortBy = options.sortBy || "createdAt"
    const sortOrder = options.sortOrder || "desc"
    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder
    }
}

export const pagginationHelper = {
    calculatePaggination
}