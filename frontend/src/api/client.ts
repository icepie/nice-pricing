import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

export interface Provider {
  id: number
  name: string
  website: string
  icon: string
}

export interface AIModel {
  id: number
  provider_id: number
  provider: Provider
  name: string
  display_name: string
  context_window: number
  icon: string
  enabled: boolean
}

export interface Price {
  id: number
  model_id: number
  input_price_per_1m: number
  output_price_per_1m: number
  cache_read_price_per_1m: number
  cache_write_price_per_1m: number
  input_audio_price_per_1m: number
  output_audio_price_per_1m: number
  currency: string
  effective_date: string
  notes: string
}

export interface PriceHistory extends Price {
  recorded_at: string
}

export interface CompareResult {
  model: AIModel
  price: Price | null
}

export const api = {
  providers: {
    list: () => client.get<Provider[]>('/providers').then(r => r.data),
    create: (data: Omit<Provider, 'id'>) => client.post<Provider>('/providers', data).then(r => r.data),
    update: (id: number, data: Partial<Provider>) => client.put<Provider>(`/providers/${id}`, data).then(r => r.data),
    delete: (id: number) => client.delete(`/providers/${id}`),
  },
  models: {
    list: (provider_id?: number) =>
      client.get<AIModel[]>('/models', { params: provider_id ? { provider_id } : {} }).then(r => r.data),
    create: (data: Omit<AIModel, 'id' | 'provider'>) => client.post<AIModel>('/models', data).then(r => r.data),
    update: (id: number, data: Partial<AIModel>) => client.put<AIModel>(`/models/${id}`, data).then(r => r.data),
    delete: (id: number) => client.delete(`/models/${id}`),
    batchEnable: (ids: number[]) => client.post('/models/batch/enable', { ids }),
    batchDisable: (ids: number[]) => client.post('/models/batch/disable', { ids }),
  },
  prices: {
    get: (modelId: number) => client.get<Price>(`/models/${modelId}/price`).then(r => r.data),
    upsert: (modelId: number, data: Partial<Price>) =>
      client.post<Price>(`/models/${modelId}/price`, data).then(r => r.data),
    history: (modelId: number) => client.get<PriceHistory[]>(`/models/${modelId}/history`).then(r => r.data),
  },
  compare: (ids: number[]) =>
    client.get<CompareResult[]>('/compare', { params: { ids: ids.join(',') } }).then(r => r.data),
}
