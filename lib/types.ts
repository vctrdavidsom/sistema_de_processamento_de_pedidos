export interface OrderItem {
  name: string
  quantity: number
  price: number
  medida: string // Adicionando a propriedade medida
}

export interface ProcessedOrder {
  id: string
  customerName: string
  items: OrderItem[]
  total: number
  address?: string
  notes?: string
  timestamp: number
  originalMessage: string
  status?: OrderStatus
  isSaved?: boolean
}

export type OrderStatus = "pending" | "completed" | "cancelled"

export interface PrintOptions {
  width?: number // Width in characters
  showHeader?: boolean
  showFooter?: boolean
  customHeader?: string
  customFooter?: string
}
