import { supabase } from './supabaseClient'

function throwIfError(error) {
  if (error) throw error
}

function cleanText(value) {
  return String(value ?? '').trim()
}

function validatePositiveQuantity(quantity) {
  const value = Number(quantity)

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Quantity must be greater than zero.')
  }

  return value
}

function validateNonNegativeQuantity(quantity) {
  const value = Number(quantity)

  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Quantity cannot be negative.')
  }

  return value
}

function generateReference(prefix) {
  const now = new Date()

  const date = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '')
    .slice(0, 14)

  const random = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()

  return `${prefix}-${date}-${random}`
}

/* ============================================================
   RECEIPTS
   ============================================================ */

export async function listReceipts() {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      id,
      reference,
      supplier_name,
      destination_location_id,
      status,
      created_by,
      created_at,
      validated_at,
      locations:destination_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  throwIfError(error)

  return data ?? []
}

export async function getReceipt(receiptId) {
  if (!receiptId) {
    throw new Error('Receipt ID is required.')
  }

  const { data, error } = await supabase
    .from('receipts')
    .select(`
      id,
      reference,
      supplier_name,
      destination_location_id,
      status,
      created_by,
      created_at,
      validated_at,
      locations:destination_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      receipt_lines (
        id,
        receipt_id,
        product_id,
        quantity,
        products (
          id,
          name,
          sku,
          unit_of_measure
        )
      )
    `)
    .eq('id', receiptId)
    .single()

  throwIfError(error)

  return data
}

export async function createReceipt({
  supplierName = '',
  destinationLocationId,
  reference = '',
}) {
  if (!destinationLocationId) {
    throw new Error('Destination location is required.')
  }

  const finalReference =
    cleanText(reference) || generateReference('WH-IN')

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  throwIfError(userError)

  const { data, error } = await supabase
    .from('receipts')
    .insert({
      reference: finalReference,
      supplier_name: cleanText(supplierName) || null,
      destination_location_id: destinationLocationId,
      status: 'draft',
      created_by: userData.user?.id ?? null,
    })
    .select(`
      id,
      reference,
      supplier_name,
      destination_location_id,
      status,
      created_by,
      created_at,
      validated_at
    `)
    .single()

  throwIfError(error)

  return data
}

export async function addReceiptLine({
  receiptId,
  productId,
  quantity,
}) {
  if (!receiptId) {
    throw new Error('Receipt ID is required.')
  }

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const validQuantity = validatePositiveQuantity(quantity)

  const { data, error } = await supabase
    .from('receipt_lines')
    .insert({
      receipt_id: receiptId,
      product_id: productId,
      quantity: validQuantity,
    })
    .select(`
      id,
      receipt_id,
      product_id,
      quantity
    `)
    .single()

  throwIfError(error)

  return data
}

export async function updateReceiptLine(lineId, quantity) {
  if (!lineId) {
    throw new Error('Receipt line ID is required.')
  }

  const validQuantity = validatePositiveQuantity(quantity)

  const { data, error } = await supabase
    .from('receipt_lines')
    .update({
      quantity: validQuantity,
    })
    .eq('id', lineId)
    .select(`
      id,
      receipt_id,
      product_id,
      quantity
    `)
    .single()

  throwIfError(error)

  return data
}

export async function deleteReceiptLine(lineId) {
  if (!lineId) {
    throw new Error('Receipt line ID is required.')
  }

  const { error } = await supabase
    .from('receipt_lines')
    .delete()
    .eq('id', lineId)

  throwIfError(error)
}

/* ============================================================
   DELIVERIES
   ============================================================ */

export async function listDeliveries() {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      reference,
      customer_name,
      source_location_id,
      status,
      created_by,
      created_at,
      validated_at,
      locations:source_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  throwIfError(error)

  return data ?? []
}

export async function getDelivery(deliveryId) {
  if (!deliveryId) {
    throw new Error('Delivery ID is required.')
  }

  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      reference,
      customer_name,
      source_location_id,
      status,
      created_by,
      created_at,
      validated_at,
      locations:source_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      delivery_lines (
        id,
        delivery_id,
        product_id,
        quantity,
        products (
          id,
          name,
          sku,
          unit_of_measure
        )
      )
    `)
    .eq('id', deliveryId)
    .single()

  throwIfError(error)

  return data
}

export async function createDelivery({
  customerName = '',
  sourceLocationId,
  reference = '',
}) {
  if (!sourceLocationId) {
    throw new Error('Source location is required.')
  }

  const finalReference =
    cleanText(reference) || generateReference('WH-OUT')

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  throwIfError(userError)

  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      reference: finalReference,
      customer_name: cleanText(customerName) || null,
      source_location_id: sourceLocationId,
      status: 'draft',
      created_by: userData.user?.id ?? null,
    })
    .select(`
      id,
      reference,
      customer_name,
      source_location_id,
      status,
      created_by,
      created_at,
      validated_at
    `)
    .single()

  throwIfError(error)

  return data
}

export async function addDeliveryLine({
  deliveryId,
  productId,
  quantity,
}) {
  if (!deliveryId) {
    throw new Error('Delivery ID is required.')
  }

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const validQuantity = validatePositiveQuantity(quantity)

  const { data, error } = await supabase
    .from('delivery_lines')
    .insert({
      delivery_id: deliveryId,
      product_id: productId,
      quantity: validQuantity,
    })
    .select(`
      id,
      delivery_id,
      product_id,
      quantity
    `)
    .single()

  throwIfError(error)

  return data
}

export async function updateDeliveryLine(lineId, quantity) {
  if (!lineId) {
    throw new Error('Delivery line ID is required.')
  }

  const validQuantity = validatePositiveQuantity(quantity)

  const { data, error } = await supabase
    .from('delivery_lines')
    .update({
      quantity: validQuantity,
    })
    .eq('id', lineId)
    .select(`
      id,
      delivery_id,
      product_id,
      quantity
    `)
    .single()

  throwIfError(error)

  return data
}

export async function deleteDeliveryLine(lineId) {
  if (!lineId) {
    throw new Error('Delivery line ID is required.')
  }

  const { error } = await supabase
    .from('delivery_lines')
    .delete()
    .eq('id', lineId)

  throwIfError(error)
}

/* ============================================================
   INTERNAL TRANSFERS
   ============================================================ */

export async function listTransfers() {
  const { data, error } = await supabase
    .from('transfers')
    .select(`
      id,
      reference,
      source_location_id,
      destination_location_id,
      status,
      created_by,
      created_at,
      validated_at,
      source:source_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      destination:destination_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  throwIfError(error)

  return data ?? []
}

export async function getTransfer(transferId) {
  if (!transferId) {
    throw new Error('Transfer ID is required.')
  }

  const { data, error } = await supabase
    .from('transfers')
    .select(`
      id,
      reference,
      source_location_id,
      destination_location_id,
      status,
      created_by,
      created_at,
      validated_at,
      source:source_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      destination:destination_location_id (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      transfer_lines (
        id,
        transfer_id,
        product_id,
        quantity,
        products (
          id,
          name,
          sku,
          unit_of_measure
        )
      )
    `)
    .eq('id', transferId)
    .single()

  throwIfError(error)

  return data
}

export async function createTransfer({
  sourceLocationId,
  destinationLocationId,
  reference = '',
}) {
  if (!sourceLocationId) {
    throw new Error('Source location is required.')
  }

  if (!destinationLocationId) {
    throw new Error('Destination location is required.')
  }

  if (sourceLocationId === destinationLocationId) {
    throw new Error(
      'Source and destination locations must be different.'
    )
  }

  const finalReference =
    cleanText(reference) || generateReference('WH-INT')

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  throwIfError(userError)

  const { data, error } = await supabase
    .from('transfers')
    .insert({
      reference: finalReference,
      source_location_id: sourceLocationId,
      destination_location_id: destinationLocationId,
      status: 'draft',
      created_by: userData.user?.id ?? null,
    })
    .select(`
      id,
      reference,
      source_location_id,
      destination_location_id,
      status,
      created_by,
      created_at,
      validated_at
    `)
    .single()

  throwIfError(error)

  return data
}

export async function addTransferLine({
  transferId,
  productId,
  quantity,
}) {
  if (!transferId) {
    throw new Error('Transfer ID is required.')
  }

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const validQuantity = validatePositiveQuantity(quantity)

  const { data, error } = await supabase
    .from('transfer_lines')
    .insert({
      transfer_id: transferId,
      product_id: productId,
      quantity: validQuantity,
    })
    .select(`
      id,
      transfer_id,
      product_id,
      quantity
    `)
    .single()

  throwIfError(error)

  return data
}

export async function updateTransferLine(lineId, quantity) {
  if (!lineId) {
    throw new Error('Transfer line ID is required.')
  }

  const validQuantity = validatePositiveQuantity(quantity)

  const { data, error } = await supabase
    .from('transfer_lines')
    .update({
      quantity: validQuantity,
    })
    .eq('id', lineId)
    .select(`
      id,
      transfer_id,
      product_id,
      quantity
    `)
    .single()

  throwIfError(error)

  return data
}

export async function deleteTransferLine(lineId) {
  if (!lineId) {
    throw new Error('Transfer line ID is required.')
  }

  const { error } = await supabase
    .from('transfer_lines')
    .delete()
    .eq('id', lineId)

  throwIfError(error)
}

/* ============================================================
   INVENTORY ADJUSTMENTS
   ============================================================ */

export async function listAdjustments() {
  const { data, error } = await supabase
    .from('adjustments')
    .select(`
      id,
      reference,
      location_id,
      status,
      created_by,
      created_at,
      validated_at,
      locations (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  throwIfError(error)

  return data ?? []
}

export async function getAdjustment(adjustmentId) {
  if (!adjustmentId) {
    throw new Error('Adjustment ID is required.')
  }

  const { data, error } = await supabase
    .from('adjustments')
    .select(`
      id,
      reference,
      location_id,
      status,
      created_by,
      created_at,
      validated_at,
      locations (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      adjustment_lines (
        id,
        adjustment_id,
        product_id,
        counted_quantity,
        reason,
        products (
          id,
          name,
          sku,
          unit_of_measure
        )
      )
    `)
    .eq('id', adjustmentId)
    .single()

  throwIfError(error)

  return data
}

export async function createAdjustment({
  locationId,
  reference = '',
}) {
  if (!locationId) {
    throw new Error('Location is required.')
  }

  const finalReference =
    cleanText(reference) || generateReference('WH-ADJ')

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  throwIfError(userError)

  const { data, error } = await supabase
    .from('adjustments')
    .insert({
      reference: finalReference,
      location_id: locationId,
      status: 'draft',
      created_by: userData.user?.id ?? null,
    })
    .select(`
      id,
      reference,
      location_id,
      status,
      created_by,
      created_at,
      validated_at
    `)
    .single()

  throwIfError(error)

  return data
}

export async function addAdjustmentLine({
  adjustmentId,
  productId,
  countedQuantity,
  reason = '',
}) {
  if (!adjustmentId) {
    throw new Error('Adjustment ID is required.')
  }

  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const validQuantity =
    validateNonNegativeQuantity(countedQuantity)

  const { data, error } = await supabase
    .from('adjustment_lines')
    .insert({
      adjustment_id: adjustmentId,
      product_id: productId,
      counted_quantity: validQuantity,
      reason: cleanText(reason) || null,
    })
    .select(`
      id,
      adjustment_id,
      product_id,
      counted_quantity,
      reason
    `)
    .single()

  throwIfError(error)

  return data
}

export async function updateAdjustmentLine(
  lineId,
  {
    countedQuantity,
    reason,
  }
) {
  if (!lineId) {
    throw new Error('Adjustment line ID is required.')
  }

  const payload = {}

  if (countedQuantity !== undefined) {
    payload.counted_quantity =
      validateNonNegativeQuantity(countedQuantity)
  }

  if (reason !== undefined) {
    payload.reason = cleanText(reason) || null
  }

  if (Object.keys(payload).length === 0) {
    throw new Error(
      'No adjustment line fields were provided for update.'
    )
  }

  const { data, error } = await supabase
    .from('adjustment_lines')
    .update(payload)
    .eq('id', lineId)
    .select(`
      id,
      adjustment_id,
      product_id,
      counted_quantity,
      reason
    `)
    .single()

  throwIfError(error)

  return data
}

export async function deleteAdjustmentLine(lineId) {
  if (!lineId) {
    throw new Error('Adjustment line ID is required.')
  }

  const { error } = await supabase
    .from('adjustment_lines')
    .delete()
    .eq('id', lineId)

  throwIfError(error)
}

/* ============================================================
   STATUS WORKFLOW
   ============================================================ */

const VALID_DOCUMENT_TYPES = [
  'receipts',
  'deliveries',
  'transfers',
  'adjustments',
]

export async function advanceDocumentStatus(
  documentType,
  documentId,
  targetStatus
) {
  if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error('Invalid document type.')
  }

  if (!documentId) {
    throw new Error('Document ID is required.')
  }

  const validStatuses = [
    'waiting',
    'ready',
    'cancelled',
  ]

  if (!validStatuses.includes(targetStatus)) {
    throw new Error('Invalid target status.')
  }

  const { error } = await supabase.rpc('advance_status', {
    p_table: documentType,
    p_id: documentId,
    p_target: targetStatus,
  })

  throwIfError(error)
}

export async function validateReceipt(receiptId) {
  if (!receiptId) {
    throw new Error('Receipt ID is required.')
  }

  const { error } = await supabase.rpc(
    'validate_receipt',
    {
      p_receipt_id: receiptId,
    }
  )

  throwIfError(error)
}

export async function validateDelivery(deliveryId) {
  if (!deliveryId) {
    throw new Error('Delivery ID is required.')
  }

  const { error } = await supabase.rpc(
    'validate_delivery',
    {
      p_delivery_id: deliveryId,
    }
  )

  throwIfError(error)
}

export async function validateTransfer(transferId) {
  if (!transferId) {
    throw new Error('Transfer ID is required.')
  }

  const { error } = await supabase.rpc(
    'validate_transfer',
    {
      p_transfer_id: transferId,
    }
  )

  throwIfError(error)
}

export async function validateAdjustment(adjustmentId) {
  if (!adjustmentId) {
    throw new Error('Adjustment ID is required.')
  }

  const { error } = await supabase.rpc(
    'validate_adjustment',
    {
      p_adjustment_id: adjustmentId,
    }
  )

  throwIfError(error)
    }
