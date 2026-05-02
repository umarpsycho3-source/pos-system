import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Search, CreditCard, Banknote, Trash2, Plus, Minus, Printer, X, Barcode } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './POS.css';

export default function POS() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [amountTendered, setAmountTendered] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [scanError, setScanError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCombo, setShowCombo] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });

  const {
    products,
    customers,
    heldOrders,
    holdOrder,
    removeHeldOrder,
    currency,
    shopName,
    recordSale,
    createCustomer,
    error,
    setError,
  } = useSettings();

  const receiptRef = useRef();
  const barcodeInputRef = useRef();

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeChange = (e) => {
    const val = e.target.value;
    setBarcodeInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowCombo(false);
      return;
    }
    const matches = products.filter((p) =>
      p.name.toLowerCase().includes(val.toLowerCase()) || (p.barcode || '').includes(val)
    );
    setSearchResults(matches);
    setShowCombo(true);
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart((prev) => prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart((prev) => [{ ...product, qty: 1, discount: 0 }, ...prev]);
    }
  };

  const selectProduct = (product) => {
    addToCart(product);
    setBarcodeInput('');
    setShowCombo(false);
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const input = barcodeInput.trim();
    if (!input) return;

    const customMatch = input.match(/^\*(.+)\*(.+)\*$/);
    if (customMatch) {
      const customPrice = Number(customMatch[1]);
      const customName = customMatch[2].trim();
      if (!Number.isNaN(customPrice) && customName) {
        selectProduct({
          id: `custom-${Date.now()}`,
          name: customName,
          category: 'Custom',
          price: customPrice,
          cost: 0,
          stock: 0,
          barcode: input,
        });
        return;
      }
    }

    if (searchResults.length === 1) {
      selectProduct(searchResults[0]);
      return;
    }

    const exact = products.find((p) => p.barcode === input);
    if (exact) selectProduct(exact);
    else {
      setScanError('Product not found or multiple matches.');
      setTimeout(() => setScanError(''), 3000);
    }
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item)).filter((i) => i.qty > 0));
  };

  const updateItemDiscount = (id, newDiscount) => {
    const val = Math.max(0, Math.min(100, Number(newDiscount || 0)));
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, discount: val } : item)));
  };

  const holdCurrentOrder = () => {
    if (cart.length === 0) return;
    holdOrder({ items: cart, discount: globalDiscount });
    setCart([]);
    setGlobalDiscount(0);
  };

  const resumeOrder = (orderId) => {
    const order = heldOrders.find((o) => o.id === orderId);
    if (!order) return;
    setCart(order.items || []);
    setGlobalDiscount(order.discount || 0);
    removeHeldOrder(orderId);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalItemDiscounts = 0;

    cart.forEach((item) => {
      const itemTotal = Number(item.price || 0) * Number(item.qty || 0);
      const discountAmount = itemTotal * (Number(item.discount || 0) / 100);
      subtotal += itemTotal;
      totalItemDiscounts += discountAmount;
    });

    const subtotalAfterItemDiscounts = subtotal - totalItemDiscounts;
    const globalDiscountAmount = subtotalAfterItemDiscounts * (globalDiscount / 100);
    const totalDiscountAmount = totalItemDiscounts + globalDiscountAmount;
    const grandTotal = subtotalAfterItemDiscounts - globalDiscountAmount;

    return { subtotal, totalDiscountAmount, grandTotal };
  };

  const totals = calculateTotals();

  const calculateProfitAfterDiscounts = () => {
    if (cart.length === 0) return 0;

    const itemNetRows = cart.map((item) => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      const cost = Number(item.cost || 0);
      const itemGross = price * qty;
      const itemLevelDiscount = itemGross * (Number(item.discount || 0) / 100);
      const itemNetBeforeGlobal = itemGross - itemLevelDiscount;
      const itemCostTotal = cost * qty;

      return { itemNetBeforeGlobal, itemCostTotal };
    });

    const netBeforeGlobalTotal = itemNetRows.reduce((sum, row) => sum + row.itemNetBeforeGlobal, 0);
    if (netBeforeGlobalTotal <= 0) return 0;

    return itemNetRows.reduce((sum, row) => {
      const rowShare = row.itemNetBeforeGlobal / netBeforeGlobalTotal;
      const rowGlobalDiscount = rowShare * (netBeforeGlobalTotal * (globalDiscount / 100));
      const rowFinalSelling = row.itemNetBeforeGlobal - rowGlobalDiscount;
      return sum + (rowFinalSelling - row.itemCostTotal);
    }, 0);
  };

  const handlePrint = () => {
    window.print();
    setShowReceipt(false);
    setCart([]);
    setGlobalDiscount(0);
    barcodeInputRef.current?.focus();
  };

  const CheckoutFormModal = () => {
    const tendered = Number(amountTendered || 0);
    const change = tendered - totals.grandTotal;

    const isValid =
      paymentMethod === 'Card' ||
      (paymentMethod === 'Cash' && tendered >= totals.grandTotal) ||
      (paymentMethod === 'Credit' && selectedCustomer);

    const handleAddCustomer = async () => {
      if (!customerForm.name.trim()) {
        setError('Customer name is required.');
        return;
      }
      const created = await createCustomer({
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim(),
        points: 0,
      });
      setSelectedCustomer(created.name);
      setCustomerForm({ name: '', phone: '', email: '' });
      setShowAddCustomer(false);
    };

    const handleComplete = async () => {
      if (!isValid) return;

      const customerId = paymentMethod === 'Credit'
        ? customers.find((c) => c.name === selectedCustomer)?.id || null
        : null;

      const profit = calculateProfitAfterDiscounts();
      await recordSale({
        total: totals.grandTotal,
        profit,
        method: paymentMethod,
        items: cart,
        customerId,
      });
      setShowCheckout(false);
      setShowReceipt(true);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content glass-panel" style={{ width: '450px' }}>
          <div className="modal-header">
            <h2>Checkout</h2>
            <button className="btn-icon" onClick={() => setShowCheckout(false)}><X size={20} /></button>
          </div>

          <div className="checkout-form">
            <div className="summary-row total mb-4" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span>Total Due:</span>
              <span className="text-primary" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{currency}{totals.grandTotal.toFixed(2)}</span>
            </div>

            <div className="input-group">
              <label className="input-label">Payment Method</label>
              <div className="payment-methods">
                <button className={`btn ${paymentMethod === 'Cash' ? 'btn-primary' : 'btn-glass'} flex-1`} onClick={() => setPaymentMethod('Cash')}><Banknote size={18} /> Cash</button>
                <button className={`btn ${paymentMethod === 'Card' ? 'btn-primary' : 'btn-glass'} flex-1`} onClick={() => setPaymentMethod('Card')}><CreditCard size={18} /> Card</button>
                <button className={`btn ${paymentMethod === 'Credit' ? 'btn-primary' : 'btn-glass'} flex-1`} onClick={() => setPaymentMethod('Credit')}><Search size={18} /> Credit</button>
              </div>
            </div>

            {paymentMethod === 'Credit' && (
              <div className="input-group mt-4">
                <label className="input-label">Select Customer</label>
                <select className="input-field" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => <option key={c.id} value={c.name}>{c.name} ({c.phone || 'No phone'})</option>)}
                </select>
                <button type="button" className="btn btn-glass" onClick={() => setShowAddCustomer((v) => !v)}>
                  {showAddCustomer ? 'Close New Customer' : 'Add New Customer'}
                </button>
                {showAddCustomer && (
                  <div className="glass-card" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="input-group">
                      <input className="input-field" placeholder="Customer Name" value={customerForm.name} onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))} />
                      <input className="input-field" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))} />
                      <input className="input-field" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))} />
                      <button type="button" className="btn btn-primary" onClick={handleAddCustomer}>Save Customer</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'Cash' && (
              <>
                <div className="input-group mt-4">
                  <label className="input-label">Amount Tendered</label>
                  <input type="number" className="input-field" placeholder="0.00" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} autoFocus />
                </div>
                <div className="summary-row mt-4">
                  <span style={{ fontSize: '1.1rem' }}>Change Due:</span>
                  <span className={`value ${change > 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currency}{change > 0 ? change.toFixed(2) : '0.00'}</span>
                </div>
              </>
            )}
          </div>

          <div className="modal-actions mt-4" style={{ marginTop: '2rem' }}>
            <button className="btn btn-success w-full" onClick={handleComplete} disabled={!isValid}>Complete Order & Print Receipt</button>
          </div>
        </div>
      </div>
    );
  };

  const ReceiptModal = () => (
    <div className="modal-overlay print-hide">
      <div className="modal-content glass-panel" style={{ width: '400px' }}>
        <div className="modal-header">
          <h2>Order Receipt</h2>
          <button className="btn-icon" onClick={() => setShowReceipt(false)}><X size={20} /></button>
        </div>
        <div className="receipt-preview print-area" ref={receiptRef}>
          <div className="receipt-header">
            <h3>{shopName}</h3>
            <p>{new Date().toLocaleString()}</p>
            <p>Receipt #{Math.floor(Math.random() * 100000)}</p>
          </div>
          <div className="receipt-divider"></div>
          <table className="receipt-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}{item.discount > 0 && <span className="receipt-discount-label"><br />(-{item.discount}%)</span>}</td>
                  <td>{item.qty}</td>
                  <td>{currency}{Number(item.price || 0).toFixed(2)}</td>
                  <td>{currency}{(Number(item.price || 0) * item.qty * (1 - (item.discount || 0) / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-divider"></div>
          <div className="receipt-totals">
            <div className="receipt-row"><span>Subtotal:</span><span>{currency}{totals.subtotal.toFixed(2)}</span></div>
            <div className="receipt-row"><span>Discounts:</span><span>-{currency}{totals.totalDiscountAmount.toFixed(2)}</span></div>
            <div className="receipt-row receipt-grand-total"><span>Total:</span><span>{currency}{totals.grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="modal-actions mt-4">
          <button className="btn btn-primary w-full" onClick={handlePrint}><Printer size={20} /> Print Receipt</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pos-container">
      <div className="pos-cart-area glass-panel">
        <div className="scanner-section">
          <form onSubmit={handleBarcodeSubmit} className="search-bar scanner-input-wrapper w-full" style={{ position: 'relative' }}>
            <Barcode size={24} className="text-secondary" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode or search product..."
              value={barcodeInput}
              onChange={handleBarcodeChange}
              onFocus={() => { if (searchResults.length > 0) setShowCombo(true); }}
              onBlur={() => setTimeout(() => setShowCombo(false), 200)}
              className="search-input scanner-input w-full"
            />
            {scanError && <span className="scan-error text-danger">{scanError}</span>}
            {showCombo && (
              <div className="combo-dropdown glass-panel">
                {searchResults.length === 0 ? <div className="combo-item text-secondary">No products found</div> : searchResults.map((p) => (
                  <div key={p.id} className="combo-item" onClick={() => selectProduct(p)}>
                    <div className="combo-item-info">
                      <strong>{p.name}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{p.barcode}</span>
                    </div>
                    <span className="text-success">{currency}{Number(p.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
          {error && <div style={{ color: 'var(--danger-color)', marginTop: '0.5rem' }}>{error}</div>}
        </div>

        <div className="cart-list-header">
          <div className="col-name">Product</div><div className="col-price">Unit Price</div><div className="col-qty">Quantity</div><div className="col-disc">Discount (%)</div><div className="col-total">Total</div><div className="col-actions"></div>
        </div>

        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div className="empty-cart"><ShoppingCart size={64} className="text-secondary opacity-50 mb-4" /><h3>No items scanned</h3><p>Scan a barcode or search to add products to the current order.</p></div>
          ) : cart.map((item) => (
            <div key={item.id} className="cart-list-row animate-fade-in">
              <div className="col-name"><h4>{item.name}</h4><span className="text-secondary text-sm">Barcode: {item.barcode}</span></div>
              <div className="col-price">{currency}{Number(item.price || 0).toFixed(2)}</div>
              <div className="col-qty"><div className="qty-controls"><button onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button><span>{item.qty}</span><button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button></div></div>
              <div className="col-disc"><div className="discount-input-wrapper"><input type="number" placeholder="0" value={item.discount === 0 ? '' : item.discount} onChange={(e) => updateItemDiscount(item.id, e.target.value)} className="item-discount-input" /></div></div>
              <div className="col-total font-bold">{currency}{(Number(item.price || 0) * item.qty * (1 - (item.discount || 0) / 100)).toFixed(2)}</div>
              <div className="col-actions"><button className="btn-icon text-danger" onClick={() => setCart((prev) => prev.filter((c) => c.id !== item.id))}><Trash2 size={18} /></button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-summary glass-panel">
        <div className="summary-header">
          <h2>Order Summary</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {heldOrders.length > 0 && (
              <div className="held-orders-dropdown">
                <button className="btn btn-warning" style={{ padding: '0.5rem 1rem' }}>{heldOrders.length} Held</button>
                <div className="held-orders-menu glass-panel">
                  {heldOrders.map((order) => (
                    <div key={order.id} className="held-order-item" onClick={() => resumeOrder(order.id)}>
                      <span>Hold: {order.time}</span>
                      <span className="text-primary">{(order.items || []).length} items</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="btn btn-glass text-warning" onClick={holdCurrentOrder} disabled={cart.length === 0}>Hold</button>
            <button className="btn-icon text-danger" onClick={() => { setCart([]); setGlobalDiscount(0); }}><Trash2 size={20} /></button>
          </div>
        </div>

        <div className="summary-details">
          <div className="discount-block glass-card">
            <span className="text-secondary">Global Discount</span>
            <div className="discount-input-wrapper">
              <input type="number" className="global-discount-input" value={globalDiscount === 0 ? '' : globalDiscount} onChange={(e) => setGlobalDiscount(Number(e.target.value || 0))} placeholder="0" />
              <span className="percent-sign">%</span>
            </div>
          </div>

          <div className="calculation-rows">
            <div className="summary-row"><span>Subtotal</span><span>{currency}{totals.subtotal.toFixed(2)}</span></div>
            {totals.totalDiscountAmount > 0 && <div className="summary-row text-success"><span>Discounts</span><span>-{currency}{totals.totalDiscountAmount.toFixed(2)}</span></div>}
          </div>
        </div>

        <div className="checkout-actions-bottom">
          <button className="creative-checkout-btn" disabled={cart.length === 0} onClick={() => { setAmountTendered(''); setPaymentMethod('Cash'); setSelectedCustomer(''); setShowCheckout(true); }}>
            <div className="btn-content"><span className="btn-text">Checkout</span><span className="btn-total">{currency}{totals.grandTotal.toFixed(2)}</span></div>
            <div className="btn-icon-wrapper"><CreditCard size={24} /></div>
          </button>
        </div>
      </div>

      {showCheckout && <CheckoutFormModal />}
      {showReceipt && <ReceiptModal />}
    </div>
  );
}
