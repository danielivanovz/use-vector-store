import React, { useState, useEffect, useContext, createContext, Fragment } from 'react'
import {
    VectorStore,
    Vector,
    VectorStoreConfig,
    Insertable,
    IndexName,
    initializeDB,
    EmbeddingStrategy,
} from 'indexed-vector-store'

type VectorStoreContextType = {
    vectorStore: VectorStore<any> | null
    loading: boolean
}

const VectorStoreContext = createContext<VectorStoreContextType | null>(null)

export const useVectorStore = () => {
    const context = useContext(VectorStoreContext)
    if (!context) {
        throw new Error('useVectorStore must be used within a VectorStoreProvider')
    }
    return context
}

export const VectorStoreProvider = ({ children, config }: { children: React.ReactNode; config: VectorStoreConfig }) => {
    const [vectorStore, setVectorStore] = useState<VectorStore<unknown> | null>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initializeVectorStore = async () => {
            setLoading(true)
            const db = await initializeDB()
            const store = new VectorStore(db, config)
            setVectorStore(store)
            setLoading(false)
        }

        initializeVectorStore()
    }, [config])

    const value = {
        vectorStore,
        loading,
    } as VectorStoreContextType

    if (loading) {
        return <React.Fragment />
    }

    return <VectorStoreContext.Provider value={value}>{children}</VectorStoreContext.Provider>
}

export const useVectorStoreHook = () => {
    const { vectorStore } = useVectorStore()
    const [time, setTime] = useState('')

    const setEmbeddingStrategy = <T,>(strategy: EmbeddingStrategy<T>) => {
        if (!vectorStore) return
        vectorStore.setEmbeddingStrategy(strategy)
    }

    const fetchVectors = async (indexName: IndexName, vector: Vector, limit: number = 10) => {
        if (!vectorStore) return []
        const start = performance.now()
        const vectors = await vectorStore.searchByIndex(indexName, vector, limit)
        const end = performance.now()

        setTime((end - start).toFixed(2))

        return vectors
    }

    const insertVectors = async (records: Insertable[], skipDuplicates: boolean = false) => {
        if (!vectorStore) return
        await vectorStore.insert(records, skipDuplicates)
    }

    const updateVector = async (id: number, vector: Vector) => {
        if (!vectorStore) return
        await vectorStore.update(id, vector)
    }

    const deleteVector = async (id: number) => {
        if (!vectorStore) return
        await vectorStore.delete(id)
    }

    const clearStore = async () => {
        if (!vectorStore) return
        await vectorStore.clear()
    }

    const exportStore = async () => {
        if (!vectorStore) return
        await vectorStore.exportToFile()
    }

    const importStore = async (data: any) => {
        if (!vectorStore) return
        await vectorStore.importFromFile(data)
    }

    return {
        setEmbeddingStrategy,
        fetchVectors,
        insertVectors,
        updateVector,
        deleteVector,
        clearStore,
        exportStore,
        importStore,
        time
    }
}
