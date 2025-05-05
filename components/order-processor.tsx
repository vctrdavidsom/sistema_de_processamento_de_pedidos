"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Printer, Loader2, RefreshCw } from "lucide-react"
import { processOrder } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import type { ProcessedOrder } from "@/lib/types"

export default function OrderProcessor() {
  const [message, setMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedOrder, setProcessedOrder] = useState<ProcessedOrder | null>(null)
  const { toast } = useToast()

  // Estados locais para os campos editáveis
  const [customerName, setCustomerName] = useState("")
  const [itemsText, setItemsText] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  // Refs para os campos de texto
  const customerNameRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<HTMLTextAreaElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Flag para evitar atualizações circulares
  const isUpdatingRef = useRef(false)

  // Efeito para inicializar os campos quando o pedido é processado
  useEffect(() => {
    if (!processedOrder) return

    // Evita atualizações circulares
    isUpdatingRef.current = true

    // Atualiza os estados locais com os dados do pedido
    setCustomerName(processedOrder.customerName)
    setItemsText(processedOrder.items.map((item) => item.name).join("\n"))
    setAddress(processedOrder.address || "")
    setNotes(processedOrder.notes || "")

    // Reseta a flag após um curto delay
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [processedOrder])

  // Efeito para atualizar o pedido quando os campos são editados
  useEffect(() => {
    // Não atualiza se não houver pedido ou se estivermos no meio de uma atualização programática
    if (!processedOrder || isUpdatingRef.current) return

    // Cria uma cópia do pedido com os novos valores
    const updatedOrder = {
      ...processedOrder,
      customerName,
      address,
      notes,
      items: itemsText.split("\n").map((line) => ({
          name: line,
          quantity: 1,
          price: 0,
          medida: "unidade", // Default value for 'medida'
      })),
    }

    // Atualiza o pedido
    setProcessedOrder(updatedOrder)
  }, [customerName, itemsText, address, notes, processedOrder])

  const handleProcessOrder = async () => {
    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, cole a mensagem do WhatsApp para processar.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await processOrder(message)

      // Simplify the order by removing price and quantity information
      const simplifiedOrder = {
        ...result,
        items: result.items.map((item) => ({
          ...item,
          name: item.quantity > 1 ? `${item.quantity} ${item.medida} ${item.name}` : `1 ${item.medida} ${item.name}`,
          
        })),
        total: 0,
      }

      setProcessedOrder(simplifiedOrder)

      toast({
        title: "Mensagem processada",
        description: "A mensagem foi processada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a mensagem.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = () => {
    if (!processedOrder) return

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Não foi possível abrir a janela de impressão.",
          variant: "destructive",
        })
        return
      }

      // Generate print content with simplified layout
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido - ${processedOrder.customerName}</title>
            <style>
              body { 
                font-family: monospace; 
                font-size: 14px; 
                line-height: 1.3; 
                max-width: 80mm; 
                margin: 0 auto; 
                padding: 10px;
              }
              h1 { 
                font-size: 16px; 
                text-align: center; 
                margin-bottom: 10px; 
              }
              .divider { 
                border-top: 1px dashed #000; 
                margin: 10px 0; 
              }
              .item { 
                margin-bottom: 5px; 
              }
              .section-title {
                font-weight: bold;
                margin-top: 10px;
                margin-bottom: 5px;
              }
              .date { 
                text-align: right; 
                font-size: 12px; 
                margin-bottom: 10px; 
              }
            </style>
          </head>
          <body>
            <div class="date">${new Date().toLocaleString("pt-BR")}</div>
            <h1>PEDIDO - ${processedOrder.customerName}</h1>
            <div class="divider"></div>
            
            <div class="section-title">ITENS:</div>
            ${processedOrder.items
              .map(
                (item) => `
              <div class="item">
                • ${item.name}
              </div>
            `,
              )
              .join("")}
            
            ${
              processedOrder.address
                ? `
              <div class="divider"></div>
              <div class="section-title">ENDEREÇO DE ENTREGA:</div>
              <div>${processedOrder.address}</div>
            `
                : ""
            }
            
            ${
              processedOrder.notes
                ? `
              <div class="divider"></div>
              <div class="section-title">OBSERVAÇÕES:</div>
              <div>${processedOrder.notes}</div>
            `
                : ""
            }
          </body>
        </html>
      `)

      // Print and close
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()

      toast({
        title: "Pedido enviado para impressão",
        description: "O pedido foi enviado para a impressora.",
      })
    } catch (error) {
      toast({
        title: "Erro ao imprimir",
        description: "Ocorreu um erro ao imprimir o pedido.",
        variant: "destructive",
      })
    }
  }

  const handleClear = () => {
    setMessage("")
    setProcessedOrder(null)
    setCustomerName("")
    setItemsText("")
    setAddress("")
    setNotes("")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Mensagem do WhatsApp</CardTitle>
          <CardDescription>Cole a mensagem recebida no WhatsApp abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Cole aqui a mensagem do WhatsApp..."
            className="min-h-[300px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClear}>
            Limpar
          </Button>
          <Button onClick={handleProcessOrder} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Processar Mensagem"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader className="text-center">
          <CardTitle>Resumo do Pedido</CardTitle>
          <CardDescription>Edite as informações antes de imprimir</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {processedOrder ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="customer-name" className="block text-sm font-medium mb-1">
                  Nome do Cliente
                </label>
                <input
                  id="customer-name"
                  ref={customerNameRef}
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="items" className="block text-sm font-medium mb-1">
                  Itens do Pedido
                </label>
                <textarea
                  id="items"
                  ref={itemsRef}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[120px]"
                  rows={Math.max(5, itemsText.split("\n").length)}
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">
                  Endereço de Entrega
                </label>
                <textarea
                  id="address"
                  ref={addressRef}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[60px]"
                  placeholder="Endereço de entrega (opcional)"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Observações
                </label>
                <textarea
                  id="notes"
                  ref={notesRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[60px]"
                  placeholder="Observações adicionais (opcional)"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <p className="mb-4">Processe uma mensagem para ver o resumo do pedido</p>
              <RefreshCw className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handlePrint} disabled={!processedOrder} className="flex items-center w-full max-w-xs">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Pedido
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
