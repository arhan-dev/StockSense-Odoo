import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react'

import {
  listProductsWithStock,
  createProduct,
  updateProduct,
  deleteProduct,
} from './lib/products'

import {
  listCategories,
  listLocations,
} from './lib/locations'

import {
  listStockByLocation,
} from './lib/inventory'

const EMPTY_FORM = {
  name: '',
  sku: '',
  categoryId: '',
  unitOfMeasure: 'unit',
  reorderThreshold: '0',
  reorderQuantity: '0',
  initialStock: '0',
  initialLocationId: '',
}

export default function ProductsView() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])

  const [stockByLocation, setStockByLocation] =
    useState([])

  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] =
    useState(false)

  const [editingProduct, setEditingProduct] =
    useState(null)

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [deletingId, setDeletingId] =
    useState(null)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [
        productData,
        categoryData,
        locationData,
        locationStockData,
      ] = await Promise.all([
        listProductsWithStock(),
        listCategories(),
        listLocations(),
        listStockByLocation(),
      ])

      setProducts(productData)
      setCategories(categoryData)
      setLocations(locationData)
      setStockByLocation(locationStockData)
    } catch (err) {
      console.error(
        'Unable to load products:',
        err
      )

      setError(
        err?.message ||
          'Unable to load product data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingProduct(null)
    setShowCreate(false)
  }

  function handleFormChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function openCreateForm() {
    clearMessages()

    setEditingProduct(null)

    setForm({
      ...EMPTY_FORM,
      unitOfMeasure: 'unit',
    })

    setShowCreate(true)
  }

  function openEditForm(product) {
    clearMessages()

    setEditingProduct(product)

    setForm({
      name: product.name ?? '',
      sku: product.sku ?? '',
      categoryId: product.category_id ?? '',
      unitOfMeasure:
        product.unit_of_measure ?? 'unit',
      reorderThreshold: String(
        product.reorder_threshold ?? 0
      ),
      reorderQuantity: String(
        product.reorder_quantity ?? 0
      ),
      initialStock: '0',
      initialLocationId: '',
    })

    setShowCreate(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    clearMessages()
    setSaving(true)

    try {
      if (!form.name.trim()) {
        throw new Error(
          'Product name is required.'
        )
      }

      if (!form.sku.trim()) {
        throw new Error('SKU is required.')
      }

      const threshold = Number(
        form.reorderThreshold
      )

      const reorderQuantity = Number(
        form.reorderQuantity
      )

      const initialStock = Number(
        form.initialStock
      )

      if (
        !Number.isFinite(threshold) ||
        threshold < 0
      ) {
        throw new Error(
          'Reorder threshold must be zero or greater.'
        )
      }

      if (
        !Number.isFinite(reorderQuantity) ||
        reorderQuantity < 0
      ) {
        throw new Error(
          'Reorder quantity must be zero or greater.'
        )
      }

      if (
        !Number.isFinite(initialStock) ||
        initialStock < 0
      ) {
        throw new Error(
          'Initial stock must be zero or greater.'
        )
      }

      if (
        !editingProduct &&
        initialStock > 0 &&
        !form.initialLocationId
      ) {
        throw new Error(
          'Select a location when initial stock is greater than zero.'
        )
      }

      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          {
            name: form.name,
            sku: form.sku,
            categoryId:
              form.categoryId || null,
            unitOfMeasure:
              form.unitOfMeasure,
            reorderThreshold:
              threshold,
            reorderQuantity:
              reorderQuantity,
          }
        )

        setSuccess(
          `Product "${form.name.trim()}" updated successfully.`
        )
      } else {
        await createProduct({
          name: form.name,
          sku: form.sku,
          categoryId:
            form.categoryId || null,
          unitOfMeasure:
            form.unitOfMeasure,
          reorderThreshold:
            threshold,
          reorderQuantity:
            reorderQuantity,
          initialStock,
          initialLocationId:
            form.initialLocationId || null,
        })

        setSuccess(
          `Product "${form.name.trim()}" created successfully.`
        )
      }

      resetForm()
      await loadData()
    } catch (err) {
      console.error(
        'Unable to save product:',
        err
      )

      setError(
        err?.message ||
          'Unable to save the product.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    clearMessages()

    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis cannot be undone. Products referenced by inventory history may not be removable.`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(product.id)

    try {
      await deleteProduct(product.id)

      setSuccess(
        `Product "${product.name}" deleted successfully.`
      )

      await loadData()
    } catch (err) {
      console.error(
        'Unable to delete product:',
        err
      )

      setError(
        err?.message ||
          'Unable to delete this product.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    if (!query) {
      return products
    }

    return products.filter((product) => {
      const name =
        String(product.name ?? '')
          .toLowerCase()

      const sku =
        String(product.sku ?? '')
          .toLowerCase()

      const category =
        String(
          product.categories?.name ?? ''
        ).toLowerCase()

      return (
        name.includes(query) ||
        sku.includes(query) ||
        category.includes(query)
      )
    })
  }, [products, search])

  function getProductLocations(productId) {
    return stockByLocation.filter(
      (row) =>
        row.productId === productId &&
        Number(row.quantity) !== 0
    )
  }

  function renderLocation(product) {
    const rows = getProductLocations(
      product.id
    )

    if (rows.length === 0) {
      return (
        <span
          style={{
            color: 'var(--text-muted)',
          }}
        >
          No stock location
        </span>
      )
    }

    if (rows.length === 1) {
      const row = rows[0]

      return (
        <div>
          <div>
            {row.location?.name ??
              'Unknown location'}
          </div>

          {row.location?.warehouses?.name && (
            <div
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              {row.location.warehouses.name}
            </div>
          )}
        </div>
      )
    }

    return (
      <div>
        <div>
          {rows.length} locations
        </div>

        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {rows
            .map(
              (row) =>
                row.location?.name
            )
            .filter(Boolean)
            .join(', ')}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-main)',
              marginBottom: '0.25rem',
            }}
          >
            Product Directory
          </h2>

          <p
            style={{
              color:
                'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            Manage products and track
            stock levels across locations.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <button
            className="btn-secondary"
            type="button"
            onClick={loadData}
            disabled={loading}
            title="Refresh products"
          >
            <RefreshCw
              size={16}
              style={{
                marginRight: '6px',
              }}
            />

            Refresh
          </button>

          <button
            className="btn-primary"
            type="button"
            onClick={
              showCreate
                ? resetForm
                : openCreateForm
            }
            disabled={saving}
          >
            {showCreate ? (
              <>
                <X
                  size={16}
                  style={{
                    marginRight: '6px',
                  }}
                />

                Cancel
              </>
            ) : (
              <>
                <Plus
                  size={16}
                  style={{
                    marginRight: '6px',
                  }}
                />

                Create Product
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
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
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            border:
              '1px solid rgba(16, 185, 129, 0.35)',
            backgroundColor:
              'rgba(16, 185, 129, 0.08)',
            color: '#6ee7b7',
            fontSize: '0.875rem',
          }}
        >
          {success}
        </div>
      )}

      {showCreate && (
        <div
          className="card"
          style={{
            marginBottom: '2rem',
            borderLeft:
              '4px solid var(--primary)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h3
                style={{
                  marginBottom: '0.25rem',
                  fontSize: '1.125rem',
                }}
              >
                {editingProduct
                  ? 'Edit Product'
                  : 'Create New Product'}
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    'var(--text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                {editingProduct
                  ? 'Update product details and reorder rules.'
                  : 'Create a product and optionally add opening stock.'}
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Product Name *
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Copper Wire"
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  SKU / Code *
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="sku"
                  value={form.sku}
                  onChange={handleFormChange}
                  placeholder="e.g., C-WIRE-01"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Category
                </label>

                <select
                  className="form-control"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="">
                    No category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Unit of Measure
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="unitOfMeasure"
                  value={
                    form.unitOfMeasure
                  }
                  onChange={handleFormChange}
                  placeholder="unit, kg, liters..."
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Reorder Threshold
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-control"
                  name="reorderThreshold"
                  value={
                    form.reorderThreshold
                  }
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>
                  Reorder Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-control"
                  name="reorderQuantity"
                  value={
                    form.reorderQuantity
                  }
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>
            </div>

            {!editingProduct && (
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Initial Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-control"
                    name="initialStock"
                    value={
                      form.initialStock
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="0"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Initial Location
                  </label>

                  <select
                    className="form-control"
                    name="initialLocationId"
                    value={
                      form.initialLocationId
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={saving}
                  >
                    <option value="">
                      Select location
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.name}
                          {location
                            .warehouses
                            ?.name
                            ? ` — ${location.warehouses.name}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            )}

            {editingProduct && (
              <div
                style={{
                  marginTop: '0.5rem',
                  marginBottom: '1rem',
                  padding:
                    '0.75rem 1rem',
                  border:
                    '1px solid var(--border)',
                  backgroundColor:
                    'var(--surface)',
                  color:
                    'var(--text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Stock quantities are changed
                through Receipts, Deliveries,
                Transfers, and Adjustments.
                Editing a product does not
                directly change stock.
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingProduct
                    ? 'Save Changes'
                    : 'Create Product'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <div
          style={{
            padding: '1.5rem',
            borderBottom:
              '1px solid var(--border)',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
              }}
            >
              Product Directory
            </h3>

            <div
              style={{
                fontSize: '0.75rem',
                color:
                  'var(--text-muted)',
              }}
            >
              {filteredProducts.length}{' '}
              of {products.length} products
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '300px',
              maxWidth: '100%',
            }}
          >
            <Search
              style={{
                position: 'absolute',
                left: '10px',
                top: '9px',
                width: '18px',
                height: '18px',
                color:
                  'var(--text-muted)',
              }}
            />

            <input
              type="text"
              className="form-control"
              placeholder="Search by name, SKU or category..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              style={{
                paddingLeft: '36px',
              }}
            />
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color:
                'var(--text-muted)',
            }}
          >
            Loading products...
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <PackageEmpty />

            <div
              style={{
                marginTop: '0.75rem',
                color:
                  'var(--text-main)',
                fontWeight: '500',
              }}
            >
              {search
                ? 'No products match your search.'
                : 'No products found.'}
            </div>

            <div
              style={{
                marginTop: '0.35rem',
                color:
                  'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              {search
                ? 'Try another name, SKU or category.'
                : 'Create your first product to begin inventory tracking.'}
            </div>
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock on Hand</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => {
                    const stock =
                      Number(
                        product.stock ?? 0
                      )

                    const threshold =
                      Number(
                        product.reorder_threshold ??
                          0
                      )

                    const outOfStock =
                      stock <= 0

                    const lowStock =
                      !outOfStock &&
                      stock <= threshold

                    return (
                      <tr
                        key={product.id}
                      >
                        <td
                          style={{
                            fontWeight: '500',
                            color:
                              'var(--primary)',
                          }}
                        >
                          {product.sku}
                        </td>

                        <td>
                          <div
                            style={{
                              fontWeight:
                                '500',
                              color:
                                'var(--text-main)',
                            }}
                          >
                            {product.name}
                          </div>

                          <div
                            style={{
                              fontSize:
                                '0.7rem',
                              color:
                                'var(--text-muted)',
                              marginTop:
                                '2px',
                            }}
                          >
                            Reorder at{' '}
                            {threshold}{' '}
                            {
                              product.unit_of_measure
                            }
                          </div>
                        </td>

                        <td>
                          {product
                            .categories
                            ?.name ? (
                            <span className="badge badge-gray">
                              {
                                product
                                  .categories
                                  .name
                              }
                            </span>
                          ) : (
                            <span
                              style={{
                                color:
                                  'var(--text-muted)',
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              fontWeight:
                                '600',
                            }}
                          >
                            {formatNumber(
                              stock
                            )}
                          </span>{' '}
                          <span
                            style={{
                              color:
                                'var(--text-muted)',
                            }}
                          >
                            {
                              product.unit_of_measure
                            }
                          </span>
                        </td>

                        <td>
                          {renderLocation(
                            product
                          )}
                        </td>

                        <td>
                          {outOfStock ? (
                            <span className="badge badge-danger">
                              Out of Stock
                            </span>
                          ) : lowStock ? (
                            <span className="badge badge-warning">
                              Low Stock
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              In Stock
                            </span>
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                            }}
                          >
                            <button
                              type="button"
                              title="Edit product"
                              onClick={() =>
                                openEditForm(
                                  product
                                )
                              }
                              style={{
                                background:
                                  'none',
                                border:
                                  'none',
                                color:
                                  'var(--text-muted)',
                                cursor:
                                  'pointer',
                                padding:
                                  '4px',
                              }}
                            >
                              <Edit2
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              title="Delete product"
                              onClick={() =>
                                handleDelete(
                                  product
                                )
                              }
                              disabled={
                                deletingId ===
                                product.id
                              }
                              style={{
                                background:
                                  'none',
                                border:
                                  'none',
                                color:
                                  'var(--danger)',
                                cursor:
                                  deletingId ===
                                  product.id
                                    ? 'wait'
                                    : 'pointer',
                                padding:
                                  '4px',
                                opacity:
                                  deletingId ===
                                  product.id
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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

function PackageEmpty() {
  return (
    <div
      style={{
        width: '42px',
        height: '42px',
        margin: '0 auto',
        border:
          '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color:
          'var(--text-muted)',
      }}
    >
      <Plus size={20} />
    </div>
  )
}
