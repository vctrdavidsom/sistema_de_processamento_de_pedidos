"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Printer, Trash2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getOrders, deleteOrder, updateOrderStatus } from "@/lib/actions"
import { OrderSummary } from "@/components/order-summary"
import { printOrder } from "@/lib/print-utils"
import { Badge } from "@/components/ui/badge"
import type { ProcessedOrder } from "@/lib/types"

export default function OrderHistory() {
  const [orders, setOrders] = useState<ProcessedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<ProcessedOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar o histórico de pedidos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filter is handled in the filteredOrders calculation
  }

  const handleViewOrder = (order: ProcessedOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleDeleteOrder = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      try {
        await deleteOrder(id)
        await loadOrders()
        toast({
          title: "Pedido excluído",
          description: "O pedido foi excluído com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o pedido.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePrintOrder = async (order: ProcessedOrder) => {
    try {
      await printOrder(order)
      toast({
        title: "Pedido enviado para impressão",
        description: "O pedido foi enviado para a impressora.",
      })
    } catch (error) {
      toast({
        title: "Erro ao imprimir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao imprimir o pedido.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (id: string, status: "completed" | "cancelled") => {
    try {
      await updateOrderStatus(id, status)
      await loadOrders()

      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status })
      }

      toast({
        title: `Pedido ${status === "completed" ? "concluído" : "cancelado"}`,
        description: `O status do pedido foi atualizado com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      })
    }
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      order.customerName.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      (order.address && order.address.toLowerCase().includes(searchLower))
    )
  })

  // Function to render status badge
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelado</Badge>
      case "pending":
      default:
        return <Badge className="bg-yellow-500">Pendente</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Histórico de Pedidos</CardTitle>
        <CardDescription>Consulte pedidos anteriores</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-6">
          <Input
            placeholder="Buscar por cliente ou id do pedido"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-8">Carregando pedidos...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhum pedido encontrado para esta busca." : "Nenhum pedido registrado."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.timestamp).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.items.length} item(ns)</TableCell>
                    <TableCell>{renderStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">R$ {order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintOrder(order)} title="Imprimir">
                          <Printer className="h-4 w-4" />
                        </Button>
                        {order.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatus(order.id, "completed")}
                            title="Marcar como concluído"
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {order.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatus(order.id, "cancelled")}
                            title="Cancelar pedido"
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="py-4">
              <OrderSummary order={selectedOrder} showStatus={true} />
              <div className="mt-6 flex justify-end">
                <Button onClick={() => handlePrintOrder(selectedOrder)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
