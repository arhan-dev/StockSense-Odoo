import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  Upload,
  ArrowRightLeft,
  Sliders,
  CheckCircle,
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2,
} from 'lucide-react'

import {
  listProductsWithStock,
} from './lib/products'

import {
  listLocations,
} from './lib/locations'

import {
  listReceipts,
  createReceipt,
  getReceipt,
  addReceiptLine,
  deleteReceiptLine,
  listDeliveries,
  createDelivery,
  getDelivery,
  addDeliveryLine,
  deleteDeliveryLine,
  listTransfers,
  createTransfer,
  getTransfer,
  addTransferLine,
  deleteTransferLine,
  listAdjustments,
  createAdjustment,
  getAdjustment,
  addAdjustmentLine,
  deleteAdjustmentLine,
  advanceDocumentStatus,
  validateReceipt,
  validateDelivery,
  validateTransfer,
  validateAdjustment,
} from './lib/operations'

import {
  getProductStockByLocation,
} from './lib/inventory'

export default function OperationsView() {
  const [opTab, setOpTab] =
    useState('receipts')

  return (
    <div>
      <div
        style={{
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
          }}
        >
          Inventory Operations
        </h2>

        <p
          style={{
            color: 'var(--text-muted)',
          }}
        >
          Manage incoming stock, outgoing
          shipments, transfers, and inventory
          counts.
        </p>
      </div>

      <div className="tabs-header">
        <button
          className={`tab-btn ${
            opTab === 'receipts'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setOpTab('receipts')
          }
        >
          <Download
            size={16}
            style={{
              display: 'inline',
              marginRight: '6px',
              verticalAlign:
                'text-bottom',
            }}
          />
          Receipts
        </button>

        <button
          className={`tab-btn ${
            opTab === 'deliveries'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setOpTab('deliveries')
          }
        >
          <Upload
            size={16}
            style={{
              display: 'inline',
              marginRight: '6px',
              verticalAlign:
                'text-bottom',
            }}
          />
          Delivery Orders
        </button>

        <button
          className={`tab-btn ${
            opTab === 'internal'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setOpTab('internal')
          }
        >
          <ArrowRightLeft
            size={16}
            style={{
              display: 'inline',
              marginRight: '6px',
              verticalAlign:
                'text-bottom',
            }}
          />
          Internal Transfers
        </button>

        <button
          className={`tab-btn ${
            opTab === 'adjustments'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setOpTab('adjustments')
          }
        >
          <Sliders
            size={16}
            style={{
              display: 'inline',
              marginRight: '6px',
              verticalAlign:
                'text-bottom',
            }}
          />
          Stock Adjustments
        </button>
      </div>

      {opTab === 'receipts' && (
        <ReceiptsTab />
      )}

      {opTab === 'deliveries' && (
        <DeliveryOrdersTab />
      )}

      {opTab === 'internal' && (
        <InternalTransfersTab />
      )}

      {opTab === 'adjustments' && (
        <StockAdjustmentsTab />
      )}
    </div>
  )
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */

function ErrorMessage({ message }) {
  if (!message) {
    return null
  }

  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '0.85rem 1rem',
        border:
          '1px solid rgba(239, 68, 68, 0.35)',
        backgroundColor:
          'rgba(239, 68, 68, 0.08)',
        color: '#fca5a5',
        fontSize: '0.875rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-start',
      }}
    >
      <AlertCircle size={16} />

      <span>{message}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const classes = {
    draft: 'badge-gray',
    waiting: 'badge-warning',
    ready: 'badge-info',
    done: 'badge-success',
    cancelled: 'badge-danger',
  }

  return (
    <span
      className={`badge ${
        classes[status] ||
        'badge-gray'
      }`}
    >
      {formatStatus(status)}
    </span>
  )
}

function formatStatus(status) {
  if (!status) {
    return 'Unknown'
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  )
}

function formatNumber(value) {
  const number = Number(value ?? 0)

  if (!Number.isFinite(number)) {
    return '0'
  }

  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  )
}

function getProductLabel(product) {
  if (!product) {
    return 'Unknown product'
  }

  return `${product.name} [${product.sku}]`
}

function getLocationLabel(location) {
  if (!location) {
    return 'Unknown location'
  }

  if (location.warehouses?.name) {
    return `${location.name} — ${location.warehouses.name}`
  }

  return location.name
}

function ActionButtons({
  document,
  type,
  onRefresh,
  onError,
}) {
  const [busy, setBusy] =
    useState(false)

  async function moveToWaiting() {
    setBusy(true)

    try {
      await advanceDocumentStatus(
        type,
        document.id,
        'waiting'
      )

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to move document to waiting.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function moveToReady() {
    setBusy(true)

    try {
      await advanceDocumentStatus(
        type,
        document.id,
        'ready'
      )

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to move document to ready.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function validate() {
    setBusy(true)

    try {
      if (type === 'receipts') {
        await validateReceipt(
          document.id
        )
      }

      if (type === 'deliveries') {
        await validateDelivery(
          document.id
        )
      }

      if (type === 'transfers') {
        await validateTransfer(
          document.id
        )
      }

      if (type === 'adjustments') {
        await validateAdjustment(
          document.id
        )
      }

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to validate document.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (
    document.status ===
      'cancelled' ||
    document.status === 'done'
  ) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.35rem',
        flexWrap: 'wrap',
      }}
    >
      {document.status ===
        'draft' && (
        <button
          className="btn-secondary"
          type="button"
          disabled={busy}
          onClick={moveToWaiting}
          style={{
            padding:
              '0.35rem 0.65rem',
            fontSize: '0.7rem',
          }}
        >
          Submit
        </button>
      )}

      {document.status ===
        'waiting' && (
        <button
          className="btn-secondary"
          type="button"
          disabled={busy}
          onClick={moveToReady}
          style={{
            padding:
              '0.35rem 0.65rem',
            fontSize: '0.7rem',
          }}
        >
          Ready
        </button>
      )}

      {document.status ===
        'ready' && (
        <button
          className="btn-primary"
          type="button"
          disabled={busy}
          onClick={validate}
          style={{
            padding:
              '0.35rem 0.65rem',
            fontSize: '0.7rem',
          }}
        >
          Validate
        </button>
      )}
    </div>
  )
}

/* ============================================================
   RECEIPTS
   ============================================================ */

function ReceiptsTab() {
  const [receipts, setReceipts] =
    useState([])

  const [products, setProducts] =
    useState([])

  const [locations, setLocations] =
    useState([])

  const [selectedReceipt, setSelectedReceipt] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [showCreate, setShowCreate] =
    useState(false)

  const [form, setForm] =
    useState({
      supplierName: '',
      reference: '',
      destinationLocationId: '',
      productId: '',
      quantity: '',
    })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [
        receiptData,
        productData,
        locationData,
      ] = await Promise.all([
        listReceipts(),
        listProductsWithStock(),
        listLocations(),
      ])

      setReceipts(
        receiptData ?? []
      )

      setProducts(
        productData ?? []
      )

      setLocations(
        locationData ?? []
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load receipts.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function openReceipt(id) {
    try {
      const data =
        await getReceipt(id)

      setSelectedReceipt(data)
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load receipt.'
      )
    }
  }

  async function createNewReceipt(
    event
  ) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (
        !form.destinationLocationId
      ) {
        throw new Error(
          'Destination location is required.'
        )
      }

      if (!form.productId) {
        throw new Error(
          'Select a product.'
        )
      }

      if (
        Number(form.quantity) <= 0
      ) {
        throw new Error(
          'Quantity must be greater than zero.'
        )
      }

      const receipt =
        await createReceipt({
          supplierName:
            form.supplierName,
          reference:
            form.reference,
          destinationLocationId:
            form.destinationLocationId,
        })

      await addReceiptLine({
        receiptId: receipt.id,
        productId:
          form.productId,
        quantity:
          Number(form.quantity),
      })

      setForm({
        supplierName: '',
        reference: '',
        destinationLocationId:
          '',
        productId: '',
        quantity: '',
      })

      setShowCreate(false)

      await loadData()

      await openReceipt(
        receipt.id
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to create receipt.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeLine(lineId) {
    try {
      await deleteReceiptLine(
        lineId
      )

      if (selectedReceipt) {
        await openReceipt(
          selectedReceipt.id
        )
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to remove receipt line.'
      )
    }
  }

  return (
    <div>
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                marginBottom:
                  '0.35rem',
              }}
            >
              Receipts
            </h3>

            <p
              style={{
                color:
                  'var(--text-muted)',
                margin: 0,
                fontSize:
                  '0.8rem',
              }}
            >
              Receive supplier stock and
              increase inventory when the
              receipt is validated.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <button
              className="btn-secondary"
              type="button"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                style={{
                  marginRight:
                    '6px',
                }}
              />
              Refresh
            </button>

            <button
              className="btn-primary"
              type="button"
              onClick={() =>
                setShowCreate(
                  !showCreate
                )
              }
            >
              <Plus
                size={15}
                style={{
                  marginRight:
                    '6px',
                }}
              />
              New Receipt
            </button>
          </div>
        </div>

        <ErrorMessage
          message={error}
        />

        {showCreate && (
          <form
            onSubmit={
              createNewReceipt
            }
            style={{
              border:
                '1px solid var(--border)',
              padding: '1rem',
              marginBottom:
                '1.25rem',
            }}
          >
            <h4
              style={{
                marginBottom:
                  '1rem',
              }}
            >
              Create Receipt
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Supplier
                </label>

                <input
                  className="form-control"
                  value={
                    form.supplierName
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      supplierName:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Supplier name"
                />
              </div>

              <div className="form-group">
                <label>
                  Reference
                </label>

                <input
                  className="form-control"
                  value={
                    form.reference
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reference:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Optional PO/reference"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Destination Location *
                </label>

                <select
                  className="form-control"
                  value={
                    form.destinationLocationId
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      destinationLocationId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select location
                  </option>

                  {locations.map(
                    (location) => (
                      <option
                        key={
                          location.id
                        }
                        value={
                          location.id
                        }
                      >
                        {getLocationLabel(
                          location
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Product *
                </label>

                <select
                  className="form-control"
                  value={
                    form.productId
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      productId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {getProductLabel(
                          product
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Quantity *
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="any"
                  className="form-control"
                  value={
                    form.quantity
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      quantity:
                        event.target
                          .value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Creating...'
                : 'Create Receipt'}
            </button>
          </form>
        )}

        {loading ? (
          <LoadingText />
        ) : receipts.length ===
          0 ? (
          <EmptyText text="No receipts found." />
        ) : (
          <div
            style={{
              overflowX:
                'auto',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Reference
                  </th>
                  <th>
                    Supplier
                  </th>
                  <th>
                    Destination
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {receipts.map(
                  (receipt) => (
                    <tr
                      key={
                        receipt.id
                      }
                    >
                      <td>
                        {receipt.reference}
                      </td>

                      <td>
                        {receipt.supplier_name ||
                          '—'}
                      </td>

                      <td>
                        {receipt
                          .locations
                          ?.name ||
                          '—'}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            receipt.status
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() =>
                            openReceipt(
                              receipt.id
                            )
                          }
                          style={{
                            padding:
                              '0.35rem 0.7rem',
                            fontSize:
                              '0.7rem',
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReceipt && (
        <ReceiptDetail
          receipt={selectedReceipt}
          products={products}
          onClose={() =>
            setSelectedReceipt(
              null
            )
          }
          onRefresh={async () => {
            await loadData()

            await openReceipt(
              selectedReceipt.id
            )
          }}
          onError={setError}
          onDeleteLine={removeLine}
        />
      )}
    </div>
  )
}

function ReceiptDetail({
  receipt,
  products,
  onClose,
  onRefresh,
  onError,
  onDeleteLine,
}) {
  const [productId, setProductId] =
    useState('')

  const [quantity, setQuantity] =
    useState('')

  const [adding, setAdding] =
    useState(false)

  async function addLine() {
    if (!productId) {
      onError('Select a product.')
      return
    }

    if (Number(quantity) <= 0) {
      onError(
        'Quantity must be greater than zero.'
      )
      return
    }

    setAdding(true)

    try {
      await addReceiptLine({
        receiptId: receipt.id,
        productId,
        quantity:
          Number(quantity),
      })

      setProductId('')
      setQuantity('')

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to add receipt line.'
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h3>
            Receipt{' '}
            {receipt.reference}
          </h3>

          <p
            style={{
              color:
                'var(--text-muted)',
              fontSize:
                '0.8rem',
              marginTop:
                '0.25rem',
            }}
          >
            {receipt.supplier_name ||
              'No supplier'}{' '}
            →{' '}
            {receipt.locations
              ?.name ||
              'Unknown location'}
          </p>
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div
        style={{
          marginBottom:
            '1rem',
          display: 'flex',
          alignItems:
            'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge
          status={receipt.status}
        />

        <ActionButtons
          document={receipt}
          type="receipts"
          onRefresh={onRefresh}
          onError={onError}
        />
      </div>

      {receipt.status ===
        'draft' && (
        <div
          style={{
            border:
              '1px solid var(--border)',
            padding: '1rem',
            marginBottom:
              '1rem',
          }}
        >
          <strong
            style={{
              display:
                'block',
              marginBottom:
                '0.75rem',
            }}
          >
            Add line
          </strong>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <select
              className="form-control"
              value={productId}
              onChange={(event) =>
                setProductId(
                  event.target
                    .value
                )
              }
              style={{
                minWidth:
                  '240px',
                maxWidth:
                  '100%',
              }}
            >
              <option value="">
                Select product
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {getProductLabel(
                      product
                    )}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              min="0.01"
              step="any"
              className="form-control"
              placeholder="Quantity"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target
                    .value
                )
              }
              style={{
                width:
                  '140px',
              }}
            />

            <button
              className="btn-primary"
              type="button"
              disabled={adding}
              onClick={addLine}
            >
              <Plus
                size={15}
                style={{
                  marginRight:
                    '5px',
                }}
              />
              Add
            </button>
          </div>
        </div>
      )}

      <OperationLines
        lines={
          receipt.receipt_lines ??
          []
        }
        editable={
          receipt.status ===
          'draft'
        }
        onDelete={
          onDeleteLine
        }
      />
    </div>
  )
}

/* ============================================================
   DELIVERIES
   ============================================================ */

function DeliveryOrdersTab() {
  const [deliveries, setDeliveries] =
    useState([])

  const [products, setProducts] =
    useState([])

  const [locations, setLocations] =
    useState([])

  const [selectedDelivery, setSelectedDelivery] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [showCreate, setShowCreate] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [form, setForm] =
    useState({
      customerName: '',
      reference: '',
      sourceLocationId: '',
      productId: '',
      quantity: '',
    })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [
        deliveryData,
        productData,
        locationData,
      ] = await Promise.all([
        listDeliveries(),
        listProductsWithStock(),
        listLocations(),
      ])

      setDeliveries(
        deliveryData ?? []
      )

      setProducts(
        productData ?? []
      )

      setLocations(
        locationData ?? []
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load delivery orders.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function openDelivery(id) {
    try {
      const data =
        await getDelivery(id)

      setSelectedDelivery(data)
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load delivery.'
      )
    }
  }

  async function createNewDelivery(
    event
  ) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.sourceLocationId) {
        throw new Error(
          'Source location is required.'
        )
      }

      if (!form.productId) {
        throw new Error(
          'Select a product.'
        )
      }

      if (
        Number(form.quantity) <= 0
      ) {
        throw new Error(
          'Quantity must be greater than zero.'
        )
      }

      const delivery =
        await createDelivery({
          customerName:
            form.customerName,
          reference:
            form.reference,
          sourceLocationId:
            form.sourceLocationId,
        })

      await addDeliveryLine({
        deliveryId:
          delivery.id,
        productId:
          form.productId,
        quantity:
          Number(form.quantity),
      })

      setForm({
        customerName: '',
        reference: '',
        sourceLocationId:
          '',
        productId: '',
        quantity: '',
      })

      setShowCreate(false)

      await loadData()

      await openDelivery(
        delivery.id
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to create delivery.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeLine(lineId) {
    try {
      await deleteDeliveryLine(
        lineId
      )

      if (selectedDelivery) {
        await openDelivery(
          selectedDelivery.id
        )
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to remove delivery line.'
      )
    }
  }

  return (
    <div>
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom:
              '1rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                marginBottom:
                  '0.35rem',
              }}
            >
              Delivery Orders
            </h3>

            <p
              style={{
                color:
                  'var(--text-muted)',
                margin: 0,
                fontSize:
                  '0.8rem',
              }}
            >
              Pick, pack, and validate
              outgoing stock.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <button
              className="btn-secondary"
              type="button"
              onClick={loadData}
            >
              <RefreshCw
                size={15}
                style={{
                  marginRight:
                    '6px',
                }}
              />
              Refresh
            </button>

            <button
              className="btn-primary"
              type="button"
              onClick={() =>
                setShowCreate(
                  !showCreate
                )
              }
            >
              <Plus
                size={15}
                style={{
                  marginRight:
                    '6px',
                }}
              />
              New Delivery
            </button>
          </div>
        </div>

        <ErrorMessage
          message={error}
        />

        {showCreate && (
          <form
            onSubmit={
              createNewDelivery
            }
            style={{
              border:
                '1px solid var(--border)',
              padding: '1rem',
              marginBottom:
                '1.25rem',
            }}
          >
            <h4
              style={{
                marginBottom:
                  '1rem',
              }}
            >
              Create Delivery Order
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Customer
                </label>

                <input
                  className="form-control"
                  value={
                    form.customerName
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customerName:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Customer name"
                />
              </div>

              <div className="form-group">
                <label>
                  Reference
                </label>

                <input
                  className="form-control"
                  value={
                    form.reference
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reference:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Optional sales order"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Source Location *
                </label>

                <select
                  className="form-control"
                  value={
                    form.sourceLocationId
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      sourceLocationId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select location
                  </option>

                  {locations.map(
                    (location) => (
                      <option
                        key={
                          location.id
                        }
                        value={
                          location.id
                        }
                      >
                        {getLocationLabel(
                          location
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Product *
                </label>

                <select
                  className="form-control"
                  value={
                    form.productId
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      productId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {getProductLabel(
                          product
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Quantity *
              </label>

              <input
                type="number"
                min="0.01"
                step="any"
                className="form-control"
                value={
                  form.quantity
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantity:
                      event.target
                        .value,
                  })
                }
                style={{
                  maxWidth:
                    '200px',
                }}
                required
              />
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Creating...'
                : 'Create Delivery'}
            </button>
          </form>
        )}

        {loading ? (
          <LoadingText />
        ) : deliveries.length ===
          0 ? (
          <EmptyText text="No delivery orders found." />
        ) : (
          <div
            style={{
              overflowX:
                'auto',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Reference
                  </th>
                  <th>
                    Customer
                  </th>
                  <th>
                    Source
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {deliveries.map(
                  (delivery) => (
                    <tr
                      key={
                        delivery.id
                      }
                    >
                      <td>
                        {delivery.reference}
                      </td>

                      <td>
                        {delivery.customer_name ||
                          '—'}
                      </td>

                      <td>
                        {delivery
                          .locations
                          ?.name ||
                          '—'}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            delivery.status
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() =>
                            openDelivery(
                              delivery.id
                            )
                          }
                          style={{
                            padding:
                              '0.35rem 0.7rem',
                            fontSize:
                              '0.7rem',
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDelivery && (
        <DeliveryDetail
          delivery={
            selectedDelivery
          }
          products={products}
          onClose={() =>
            setSelectedDelivery(
              null
            )
          }
          onRefresh={async () => {
            await loadData()

            await openDelivery(
              selectedDelivery.id
            )
          }}
          onError={setError}
          onDeleteLine={removeLine}
        />
      )}
    </div>
  )
}

function DeliveryDetail({
  delivery,
  products,
  onClose,
  onRefresh,
  onError,
  onDeleteLine,
}) {
  const [productId, setProductId] =
    useState('')

  const [quantity, setQuantity] =
    useState('')

  const [adding, setAdding] =
    useState(false)

  async function addLine() {
    if (!productId) {
      onError('Select a product.')
      return
    }

    if (Number(quantity) <= 0) {
      onError(
        'Quantity must be greater than zero.'
      )
      return
    }

    setAdding(true)

    try {
      await addDeliveryLine({
        deliveryId:
          delivery.id,
        productId,
        quantity:
          Number(quantity),
      })

      setProductId('')
      setQuantity('')

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to add delivery line.'
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom:
            '1rem',
        }}
      >
        <div>
          <h3>
            Delivery{' '}
            {delivery.reference}
          </h3>

          <p
            style={{
              color:
                'var(--text-muted)',
              fontSize:
                '0.8rem',
              marginTop:
                '0.25rem',
            }}
          >
            {delivery.customer_name ||
              'No customer'}{' '}
            ←{' '}
            {delivery.locations
              ?.name ||
              'Unknown location'}
          </p>
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom:
            '1rem',
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge
          status={delivery.status}
        />

        <ActionButtons
          document={delivery}
          type="deliveries"
          onRefresh={onRefresh}
          onError={onError}
        />
      </div>

      {delivery.status ===
        'draft' && (
        <div
          style={{
            border:
              '1px solid var(--border)',
            padding: '1rem',
            marginBottom:
              '1rem',
          }}
        >
          <strong
            style={{
              display:
                'block',
              marginBottom:
                '0.75rem',
            }}
          >
            Add line
          </strong>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <select
              className="form-control"
              value={productId}
              onChange={(event) =>
                setProductId(
                  event.target
                    .value
                )
              }
              style={{
                minWidth:
                  '240px',
              }}
            >
              <option value="">
                Select product
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {getProductLabel(
                      product
                    )}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              min="0.01"
              step="any"
              className="form-control"
              placeholder="Quantity"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target
                    .value
                )
              }
              style={{
                width:
                  '140px',
              }}
            />

            <button
              className="btn-primary"
              type="button"
              disabled={adding}
              onClick={addLine}
            >
              <Plus
                size={15}
                style={{
                  marginRight:
                    '5px',
                }}
              />
              Add
            </button>
          </div>
        </div>
      )}

      <OperationLines
        lines={
          delivery.delivery_lines ??
          []
        }
        editable={
          delivery.status ===
          'draft'
        }
        onDelete={
          onDeleteLine
        }
      />

      {delivery.status ===
        'ready' && (
        <div
          style={{
            marginTop:
              '1rem',
            padding:
              '0.75rem 1rem',
            border:
              '1px solid var(--border)',
            color:
              'var(--text-muted)',
            fontSize:
              '0.8rem',
          }}
        >
          The delivery is ready for
          validation. Validation checks
          source-location stock before
          reducing inventory.
        </div>
      )}
    </div>
  )
}

/* ============================================================
   TRANSFERS
   ============================================================ */

function InternalTransfersTab() {
  const [transfers, setTransfers] =
    useState([])

  const [products, setProducts] =
    useState([])

  const [locations, setLocations] =
    useState([])

  const [selectedTransfer, setSelectedTransfer] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [form, setForm] =
    useState({
      reference: '',
      sourceLocationId: '',
      destinationLocationId:
        '',
      productId: '',
      quantity: '',
    })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [
        transferData,
        productData,
        locationData,
      ] = await Promise.all([
        listTransfers(),
        listProductsWithStock(),
        listLocations(),
      ])

      setTransfers(
        transferData ?? []
      )

      setProducts(
        productData ?? []
      )

      setLocations(
        locationData ?? []
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load transfers.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function openTransfer(id) {
    try {
      const data =
        await getTransfer(id)

      setSelectedTransfer(data)
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load transfer.'
      )
    }
  }

  async function createNewTransfer(
    event
  ) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (
        !form.sourceLocationId
      ) {
        throw new Error(
          'Source location is required.'
        )
      }

      if (
        !form.destinationLocationId
      ) {
        throw new Error(
          'Destination location is required.'
        )
      }

      if (
        form.sourceLocationId ===
        form.destinationLocationId
      ) {
        throw new Error(
          'Source and destination must be different.'
        )
      }

      if (!form.productId) {
        throw new Error(
          'Select a product.'
        )
      }

      if (
        Number(form.quantity) <= 0
      ) {
        throw new Error(
          'Quantity must be greater than zero.'
        )
      }

      const transfer =
        await createTransfer({
          reference:
            form.reference,
          sourceLocationId:
            form.sourceLocationId,
          destinationLocationId:
            form.destinationLocationId,
        })

      await addTransferLine({
        transferId:
          transfer.id,
        productId:
          form.productId,
        quantity:
          Number(form.quantity),
      })

      setForm({
        reference: '',
        sourceLocationId:
          '',
        destinationLocationId:
          '',
        productId: '',
        quantity: '',
      })

      await loadData()

      await openTransfer(
        transfer.id
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to create transfer.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeLine(lineId) {
    try {
      await deleteTransferLine(
        lineId
      )

      if (selectedTransfer) {
        await openTransfer(
          selectedTransfer.id
        )
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to remove transfer line.'
      )
    }
  }

  const destinationOptions =
    useMemo(
      () =>
        locations.filter(
          (location) =>
            location.id !==
            form.sourceLocationId
        ),
      [
        locations,
        form.sourceLocationId,
      ]
    )

  return (
    <div>
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom:
              '1rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                marginBottom:
                  '0.35rem',
              }}
            >
              Internal Transfers
            </h3>

            <p
              style={{
                color:
                  'var(--text-muted)',
                margin: 0,
                fontSize:
                  '0.8rem',
              }}
            >
              Move stock between locations
              without changing total company
              stock.
            </p>
          </div>

          <button
            className="btn-secondary"
            type="button"
            onClick={loadData}
          >
            <RefreshCw
              size={15}
              style={{
                marginRight:
                  '6px',
              }}
            />
            Refresh
          </button>
        </div>

        <ErrorMessage
          message={error}
        />

        <form
          onSubmit={
            createNewTransfer
          }
          style={{
            border:
              '1px solid var(--border)',
            padding: '1rem',
            marginBottom:
              '1.5rem',
          }}
        >
          <h4
            style={{
              marginBottom:
                '1rem',
            }}
          >
            Create Transfer
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label>
                Source Location *
              </label>

              <select
                className="form-control"
                value={
                  form.sourceLocationId
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    sourceLocationId:
                      event.target
                        .value,
                    destinationLocationId:
                      '',
                  })
                }
                required
              >
                <option value="">
                  Select source
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {getLocationLabel(
                        location
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Destination Location *
              </label>

              <select
                className="form-control"
                value={
                  form.destinationLocationId
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    destinationLocationId:
                      event.target
                        .value,
                  })
                }
                required
              >
                <option value="">
                  Select destination
                </option>

                {destinationOptions.map(
                  (location) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {getLocationLabel(
                        location
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Product *
              </label>

              <select
                className="form-control"
                value={
                  form.productId
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    productId:
                      event.target
                        .value,
                  })
                }
                required
              >
                <option value="">
                  Select product
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={
                        product.id
                      }
                      value={
                        product.id
                      }
                    >
                      {getProductLabel(
                        product
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Quantity *
              </label>

              <input
                type="number"
                min="0.01"
                step="any"
                className="form-control"
                value={
                  form.quantity
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantity:
                      event.target
                        .value,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Reference
            </label>

            <input
              className="form-control"
              value={
                form.reference
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  reference:
                    event.target
                      .value,
                })
              }
              placeholder="Optional transfer reference"
            />
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Creating...'
              : 'Create Transfer'}
          </button>
        </form>

        {loading ? (
          <LoadingText />
        ) : transfers.length ===
          0 ? (
          <EmptyText text="No internal transfers found." />
        ) : (
          <div
            style={{
              overflowX:
                'auto',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Reference
                  </th>
                  <th>
                    Source
                  </th>
                  <th>
                    Destination
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {transfers.map(
                  (transfer) => (
                    <tr
                      key={
                        transfer.id
                      }
                    >
                      <td>
                        {transfer.reference}
                      </td>

                      <td>
                        {transfer.source
                          ?.name ||
                          '—'}
                      </td>

                      <td>
                        {transfer
                          .destination
                          ?.name ||
                          '—'}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            transfer.status
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() =>
                            openTransfer(
                              transfer.id
                            )
                          }
                          style={{
                            padding:
                              '0.35rem 0.7rem',
                            fontSize:
                              '0.7rem',
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTransfer && (
        <TransferDetail
          transfer={
            selectedTransfer
          }
          products={products}
          onClose={() =>
            setSelectedTransfer(
              null
            )
          }
          onRefresh={async () => {
            await loadData()

            await openTransfer(
              selectedTransfer.id
            )
          }}
          onError={setError}
          onDeleteLine={removeLine}
        />
      )}
    </div>
  )
}

function TransferDetail({
  transfer,
  products,
  onClose,
  onRefresh,
  onError,
  onDeleteLine,
}) {
  const [productId, setProductId] =
    useState('')

  const [quantity, setQuantity] =
    useState('')

  const [adding, setAdding] =
    useState(false)

  async function addLine() {
    if (!productId) {
      onError('Select a product.')
      return
    }

    if (Number(quantity) <= 0) {
      onError(
        'Quantity must be greater than zero.'
      )
      return
    }

    setAdding(true)

    try {
      await addTransferLine({
        transferId:
          transfer.id,
        productId,
        quantity:
          Number(quantity),
      })

      setProductId('')
      setQuantity('')

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to add transfer line.'
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom:
            '1rem',
        }}
      >
        <div>
          <h3>
            Transfer{' '}
            {transfer.reference}
          </h3>

          <p
            style={{
              color:
                'var(--text-muted)',
              fontSize:
                '0.8rem',
              marginTop:
                '0.25rem',
            }}
          >
            {transfer.source
              ?.name ||
              'Unknown'}{' '}
            →{' '}
            {transfer.destination
              ?.name ||
              'Unknown'}
          </p>
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom:
            '1rem',
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge
          status={transfer.status}
        />

        <ActionButtons
          document={transfer}
          type="transfers"
          onRefresh={onRefresh}
          onError={onError}
        />
      </div>

      {transfer.status ===
        'draft' && (
        <div
          style={{
            border:
              '1px solid var(--border)',
            padding: '1rem',
            marginBottom:
              '1rem',
          }}
        >
          <strong
            style={{
              display:
                'block',
              marginBottom:
                '0.75rem',
            }}
          >
            Add line
          </strong>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <select
              className="form-control"
              value={productId}
              onChange={(event) =>
                setProductId(
                  event.target
                    .value
                )
              }
              style={{
                minWidth:
                  '240px',
              }}
            >
              <option value="">
                Select product
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {getProductLabel(
                      product
                    )}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              min="0.01"
              step="any"
              className="form-control"
              placeholder="Quantity"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target
                    .value
                )
              }
              style={{
                width:
                  '140px',
              }}
            />

            <button
              className="btn-primary"
              type="button"
              disabled={adding}
              onClick={addLine}
            >
              <Plus
                size={15}
                style={{
                  marginRight:
                    '5px',
                }}
              />
              Add
            </button>
          </div>
        </div>
      )}

      <OperationLines
        lines={
          transfer.transfer_lines ??
          []
        }
        editable={
          transfer.status ===
          'draft'
        }
        onDelete={
          onDeleteLine
        }
      />
    </div>
  )
}

/* ============================================================
   ADJUSTMENTS
   ============================================================ */

function StockAdjustmentsTab() {
  const [adjustments, setAdjustments] =
    useState([])

  const [products, setProducts] =
    useState([])

  const [locations, setLocations] =
    useState([])

  const [selectedAdjustment, setSelectedAdjustment] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [form, setForm] =
    useState({
      reference: '',
      locationId: '',
      productId: '',
      countedQuantity: '',
      reason: '',
    })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [
        adjustmentData,
        productData,
        locationData,
      ] = await Promise.all([
        listAdjustments(),
        listProductsWithStock(),
        listLocations(),
      ])

      setAdjustments(
        adjustmentData ?? []
      )

      setProducts(
        productData ?? []
      )

      setLocations(
        locationData ?? []
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load adjustments.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function openAdjustment(id) {
    try {
      const data =
        await getAdjustment(id)

      setSelectedAdjustment(data)
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load adjustment.'
      )
    }
  }

  async function createNewAdjustment(
    event
  ) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.locationId) {
        throw new Error(
          'Location is required.'
        )
      }

      if (!form.productId) {
        throw new Error(
          'Select a product.'
        )
      }

      if (
        !Number.isFinite(
          Number(
            form.countedQuantity
          )
        ) ||
        Number(
          form.countedQuantity
        ) < 0
      ) {
        throw new Error(
          'Physical count must be zero or greater.'
        )
      }

      const adjustment =
        await createAdjustment({
          locationId:
            form.locationId,
          reference:
            form.reference,
        })

      await addAdjustmentLine({
        adjustmentId:
          adjustment.id,
        productId:
          form.productId,
        countedQuantity:
          Number(
            form.countedQuantity
          ),
        reason:
          form.reason,
      })

      setForm({
        reference: '',
        locationId: '',
        productId: '',
        countedQuantity: '',
        reason: '',
      })

      await loadData()

      await openAdjustment(
        adjustment.id
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to create adjustment.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeLine(lineId) {
    try {
      await deleteAdjustmentLine(
        lineId
      )

      if (selectedAdjustment) {
        await openAdjustment(
          selectedAdjustment.id
        )
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to remove adjustment line.'
      )
    }
  }

  return (
    <div>
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom:
              '1rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                marginBottom:
                  '0.35rem',
              }}
            >
              Inventory Adjustments
            </h3>

            <p
              style={{
                color:
                  'var(--text-muted)',
                margin: 0,
                fontSize:
                  '0.8rem',
              }}
            >
              Reconcile recorded stock with
              the physical count. The backend
              calculates the adjustment delta.
            </p>
          </div>

          <button
            className="btn-secondary"
            type="button"
            onClick={loadData}
          >
            <RefreshCw
              size={15}
              style={{
                marginRight:
                  '6px',
              }}
            />
            Refresh
          </button>
        </div>

        <ErrorMessage
          message={error}
        />

        <form
          onSubmit={
            createNewAdjustment
          }
          style={{
            border:
              '1px solid var(--border)',
            padding: '1rem',
            marginBottom:
              '1.5rem',
          }}
        >
          <h4
            style={{
              marginBottom:
                '1rem',
            }}
          >
            Create Adjustment
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label>
                Location *
              </label>

              <select
                className="form-control"
                value={
                  form.locationId
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    locationId:
                      event.target
                        .value,
                  })
                }
                required
              >
                <option value="">
                  Select location
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {getLocationLabel(
                        location
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Product *
              </label>

              <select
                className="form-control"
                value={
                  form.productId
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    productId:
                      event.target
                        .value,
                  })
                }
                required
              >
                <option value="">
                  Select product
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={
                        product.id
                      }
                      value={
                        product.id
                      }
                    >
                      {getProductLabel(
                        product
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Physical Count *
              </label>

              <input
                type="number"
                min="0"
                step="any"
                className="form-control"
                value={
                  form.countedQuantity
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    countedQuantity:
                      event.target
                        .value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                Reference
              </label>

              <input
                className="form-control"
                value={
                  form.reference
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    reference:
                      event.target
                        .value,
                  })
                }
                placeholder="Optional adjustment reference"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Reason
            </label>

            <input
              className="form-control"
              value={
                form.reason
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  reason:
                    event.target
                      .value,
                })
              }
              placeholder="e.g. 3 kg steel damaged"
            />
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Creating...'
              : 'Create Adjustment'}
          </button>
        </form>

        {loading ? (
          <LoadingText />
        ) : adjustments.length ===
          0 ? (
          <EmptyText text="No inventory adjustments found." />
        ) : (
          <div
            style={{
              overflowX:
                'auto',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Reference
                  </th>
                  <th>
                    Location
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {adjustments.map(
                  (adjustment) => (
                    <tr
                      key={
                        adjustment.id
                      }
                    >
                      <td>
                        {adjustment.reference}
                      </td>

                      <td>
                        {adjustment
                          .locations
                          ?.name ||
                          '—'}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            adjustment.status
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() =>
                            openAdjustment(
                              adjustment.id
                            )
                          }
                          style={{
                            padding:
                              '0.35rem 0.7rem',
                            fontSize:
                              '0.7rem',
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAdjustment && (
        <AdjustmentDetail
          adjustment={
            selectedAdjustment
          }
          products={products}
          onClose={() =>
            setSelectedAdjustment(
              null
            )
          }
          onRefresh={async () => {
            await loadData()

            await openAdjustment(
              selectedAdjustment.id
            )
          }}
          onError={setError}
          onDeleteLine={removeLine}
        />
      )}
    </div>
  )
}

function AdjustmentDetail({
  adjustment,
  products,
  onClose,
  onRefresh,
  onError,
  onDeleteLine,
}) {
  const [productId, setProductId] =
    useState('')

  const [countedQuantity, setCountedQuantity] =
    useState('')

  const [reason, setReason] =
    useState('')

  const [adding, setAdding] =
    useState(false)

  async function addLine() {
    if (!productId) {
      onError('Select a product.')
      return
    }

    if (
      !Number.isFinite(
        Number(countedQuantity)
      ) ||
      Number(countedQuantity) < 0
    ) {
      onError(
        'Physical count must be zero or greater.'
      )
      return
    }

    setAdding(true)

    try {
      await addAdjustmentLine({
        adjustmentId:
          adjustment.id,
        productId,
        countedQuantity:
          Number(
            countedQuantity
          ),
        reason,
      })

      setProductId('')
      setCountedQuantity('')
      setReason('')

      await onRefresh()
    } catch (error) {
      onError(
        error?.message ||
          'Unable to add adjustment line.'
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom:
            '1rem',
        }}
      >
        <div>
          <h3>
            Adjustment{' '}
            {adjustment.reference}
          </h3>

          <p
            style={{
              color:
                'var(--text-muted)',
              fontSize:
                '0.8rem',
              marginTop:
                '0.25rem',
            }}
          >
            {adjustment.locations
              ?.name ||
              'Unknown location'}
          </p>
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom:
            '1rem',
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge
          status={
            adjustment.status
          }
        />

        <ActionButtons
          document={adjustment}
          type="adjustments"
          onRefresh={onRefresh}
          onError={onError}
        />
      </div>

      {adjustment.status ===
        'draft' && (
        <div
          style={{
            border:
              '1px solid var(--border)',
            padding: '1rem',
            marginBottom:
              '1rem',
          }}
        >
          <strong
            style={{
              display:
                'block',
              marginBottom:
                '0.75rem',
            }}
          >
            Add count
          </strong>

          <div className="form-row">
            <div className="form-group">
              <label>
                Product
              </label>

              <select
                className="form-control"
                value={
                  productId
                }
                onChange={(event) =>
                  setProductId(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Select product
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={
                        product.id
                      }
                      value={
                        product.id
                      }
                    >
                      {getProductLabel(
                        product
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Physical Count
              </label>

              <input
                type="number"
                min="0"
                step="any"
                className="form-control"
                value={
                  countedQuantity
                }
                onChange={(event) =>
                  setCountedQuantity(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Reason
            </label>

            <input
              className="form-control"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              placeholder="Reason for count adjustment"
            />
          </div>

          <button
            className="btn-primary"
            type="button"
            disabled={adding}
            onClick={addLine}
          >
            <Plus
              size={15}
              style={{
                marginRight:
                  '5px',
              }}
            />
            Add Count
          </button>
        </div>
      )}

      <OperationLines
        lines={
          adjustment.adjustment_lines ??
          []
        }
        editable={
          adjustment.status ===
          'draft'
        }
        adjustmentMode
        onDelete={
          onDeleteLine
        }
      />

      {adjustment.status ===
        'ready' && (
        <div
          style={{
            marginTop:
              '1rem',
            padding:
              '0.75rem 1rem',
            border:
              '1px solid var(--border)',
            color:
              'var(--text-muted)',
            fontSize:
              '0.8rem',
          }}
        >
          Validation will compare the
          physical count with current
          stock and create only the required
          adjustment delta.
        </div>
      )}
    </div>
  )
}

/* ============================================================
   LINES
   ============================================================ */

function OperationLines({
  lines,
  editable,
  onDelete,
  adjustmentMode = false,
}) {
  if (!lines || lines.length === 0) {
    return (
      <EmptyText text="No line items yet." />
    )
  }

  return (
    <div
      style={{
        overflowX: 'auto',
      }}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>
              Product
            </th>

            <th>
              {adjustmentMode
                ? 'Physical Count'
                : 'Quantity'}
            </th>

            {adjustmentMode && (
              <th>
                Reason
              </th>
            )}

            {editable && (
              <th>
                Action
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td>
                <div
                  style={{
                    fontWeight:
                      '500',
                  }}
                >
                  {getProductLabel(
                    line.products
                  )}
                </div>
              </td>

              <td>
                {formatNumber(
                  adjustmentMode
                    ? line.counted_quantity
                    : line.quantity
                )}{' '}
                <span
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize:
                      '0.7rem',
                  }}
                >
                  {line.products
                    ?.unit_of_measure ||
                    ''}
                </span>
              </td>

              {adjustmentMode && (
                <td>
                  {line.reason ||
                    '—'}
                </td>
              )}

              {editable && (
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      onDelete(
                        line.id
                      )
                    }
                    style={{
                      background:
                        'none',
                      border:
                        'none',
                      color:
                        'var(--danger)',
                      cursor:
                        'pointer',
                    }}
                    title="Delete line"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ============================================================
   SMALL UI HELPERS
   ============================================================ */

function LoadingText() {
  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        color:
          'var(--text-muted)',
      }}
    >
      Loading...
    </div>
  )
}

function EmptyText({ text }) {
  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        color:
          'var(--text-muted)',
        border:
          '1px solid var(--border)',
      }}
    >
      {text}
    </div>
  )
}
