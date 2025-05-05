"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Trash2, Copy, Printer } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSavedOrders, deleteSavedOrder, processOrder } from "@/lib/actions"
import { OrderSummary } from "@/components/order-summary"
import { printOrder } from "@/lib/print-utils"
import { useRouter } from "next/navigation"
import type { ProcessedOrder } from "@/lib/types"

export default function SavedOrders() {
  const [orders, setOrders] = useState<ProcessedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<ProcessedOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getSavedOrders()
      setOrders(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar modelos",
        description: "Não foi possível carregar os modelos de pedidos.",
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
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      try {
        await deleteSavedOrder(id)
        await loadOrders()
        toast({
          title: "Modelo excluído",
          description: "O modelo foi excluído com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o modelo.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePrintOrder = async (order: ProcessedOrder) => {
    try {
      await printOrder(order)
      toast({
        title: "Modelo enviado para impressão",
        description: "O modelo foi enviado para a impressora.",
      })
    } catch (error) {
      toast({
        title: "Erro ao imprimir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao imprimir o modelo.",
        variant: "destructive",
      })
    }
  }

  const handleUseTemplate = async (order: ProcessedOrder) => {
    try {
      // Create a new order based on the template
      const newOrder = await processOrder(order.originalMessage)

      // Update the new order with template data
      newOrder.items = [...order.items]
      newOrder.total = order.total

      // Store in session storage to be loaded in the processor
      sessionStorage.setItem("loadedOrder", JSON.stringify(newOrder))

      // Navigate to the processor tab
      toast({
        title: "Modelo carregado",
        description: "O modelo foi carregado para edição.",
      })

      // Force a refresh to trigger the processor to load the order
      router.refresh()

      // Switch to the processor tab
      document.querySelector('[value="processar"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    } catch (error) {
      toast({
        title: "Erro ao usar modelo",
        description: "Não foi possível carregar o modelo para edição.",
        variant: "destructive",
      })
    }
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      order.customerName.toLowerCase().includes(searchLower) ||
      (order.address && order.address.toLowerCase().includes(searchLower))
    )
  })

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Modelos de Pedidos</CardTitle>
        <CardDescription>Gerencie seus modelos de pedidos salvos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-6">
          <Input
            placeholder="Buscar por cliente ou descrição"
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
          <div className="flex justify-center py-8">Carregando modelos...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhum modelo encontrado para esta busca." : "Nenhum modelo salvo."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.timestamp).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.items.length} item(ns)</TableCell>
                    <TableCell className="text-right">R$ {order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintOrder(order)} title="Imprimir">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUseTemplate(order)}
                          title="Usar modelo"
                          className="text-green-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>Detalhes do Modelo</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="py-4">
              <OrderSummary order={selectedOrder} />
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => handleUseTemplate(selectedOrder)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Usar Modelo
                </Button>
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
