import type { ProcessedOrder, PrintOptions } from "./types"

// Default print options for 80mm thermal printer
const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  width: 48, // 80mm thermal printers typically support 48 characters per line
  showHeader: true,
  showFooter: true,
  customHeader: "",
  customFooter: "Obrigado pela preferência!",
}

// Function to center text within a given width
export function centerText(text: string, width: number): string {
  if (text.length >= width) return text
  const padding = Math.floor((width - text.length) / 2)
  return " ".repeat(padding) + text
}

// Function to create a divider line
export function createDivider(width: number, char = "-"): string {
  return char.repeat(width)
}

// Function to truncate and format text to fit within width
export function formatLine(text: string, width: number): string {
  if (text.length <= width) return text
  return text.substring(0, width - 3) + "..."
}

// Function to generate print content for thermal printer
export function generatePrintContent(order: ProcessedOrder, options: PrintOptions = {}): string {
  // Merge default options with provided options
  const printOptions = { ...DEFAULT_PRINT_OPTIONS, ...options }
  const { width, showHeader, showFooter, customHeader, customFooter } = printOptions

  // Start building the print content
  let content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pedido - ${order.customerName}</title>
  <style>
    body {
      font-family: monospace;
      font-size: 12px;
      line-height: 1.2;
      width: ${width ? width * 8 : 384}px; /* Approximate width for thermal printer */
      margin: 0 auto;
      padding: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .item-name {
      flex: 1;
    }
    .item-price {
      text-align: right;
      min-width: 70px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 10px;
    }
    .address {
      margin-top: 10px;
    }
    .total {
      font-weight: bold;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }
    .date {
      text-align: right;
      font-size: 10px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="date">${new Date(order.timestamp).toLocaleString("pt-BR")}</div>
`

  // Add header if enabled
  if (showHeader) {
    content += `
  <div class="header">
    <h1>${customHeader || `PEDIDO - ${order.customerName}`}</h1>
  </div>
  <div class="divider"></div>
`
  }

  // Add items
  content += `
  <div class="items">
`
  order.items.forEach((item) => {
    content += `
    <div class="item">
      <div class="item-name">${item.quantity}x ${item.name}</div>
      <div class="item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
    </div>
`
  })

  content += `
  </div>
  <div class="divider"></div>
  <div class="total">
    <div>TOTAL</div>
    <div>R$ ${order.total.toFixed(2)}</div>
  </div>
`

  // Add address if available
  if (order.address) {
    content += `
  <div class="address">
    <div class="divider"></div>
    <strong>Endereço de entrega:</strong><br>
    ${order.address}
  </div>
`
  }

  // Add notes if available
  if (order.notes) {
    content += `
  <div class="notes">
    <div class="divider"></div>
    <strong>Observações:</strong><br>
    ${order.notes}
  </div>
`
  }

  // Add footer if enabled
  if (showFooter) {
    content += `
  <div class="footer">
    ${customFooter || "Obrigado pela preferência!"}
  </div>
`
  }

  // Close HTML
  content += `
</body>
</html>
`

  return content
}

// Function to print order
export function printOrder(order: ProcessedOrder, options: PrintOptions = {}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Generate print content
      const content = generatePrintContent(order, options)

      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        reject(new Error("Não foi possível abrir a janela de impressão."))
        return
      }

      // Write content to the window
      printWindow.document.write(content)

      // Print and close
      printWindow.document.close()
      printWindow.focus()

      // Add event listener for after print
      printWindow.onafterprint = () => {
        printWindow.close()
        resolve(true)
      }

      // Handle print error or timeout
      setTimeout(() => {
        if (printWindow.closed) {
          resolve(true)
        } else {
          printWindow.close()
          resolve(false)
        }
      }, 5000) // 5 second timeout

      printWindow.print()
    } catch (error) {
      reject(error)
    }
  })
}
