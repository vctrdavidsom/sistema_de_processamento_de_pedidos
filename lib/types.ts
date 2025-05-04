export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export type ProcessedOrderItem = {
  name: string
  quantity: number
  price: number
  medida: string // Adicione esta propriedade
}

export type ProcessedOrder = {
  id: string
  customerName: string
  items: ProcessedOrderItem[]
  total: number
  address?: string
  notes?: string
  timestamp: number
  originalMessage: string
  status: OrderStatus
}

export type OrderStatus = "pending" | "completed" | "cancelled"

export interface PrintOptions {
  width?: number // Width in characters
  showHeader?: boolean
  showFooter?: boolean
  customHeader?: string
  customFooter?: string
}
