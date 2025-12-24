export function userOrderHtml(order: any) {
    const itemsHtml = (order.items || []).map((it: any) => `
    <tr>
      <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(it.name)}</td>
      <td style="padding:8px;border:1px solid #e6e6e6;text-align:center">${it.qty}</td>
      <td style="padding:8px;border:1px solid #e6e6e6;text-align:right">RS ${Number(it.price).toFixed(0)}</td>
    </tr>`).join('');

    return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f7f7f7;padding:20px">
    <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #eee;padding:24px">
      <h2 style="margin:0 0 8px">Thank you for your order</h2>
      <p style="margin:0 0 16px">Order ID: <strong style="font-family:monospace">${order._id}</strong></p>

      <h3 style="margin-top:16px;margin-bottom:8px">Order summary</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <thead>
          <tr>
            <th style="text-align:left;border:1px solid #e6e6e6;padding:8px;background:#fafafa">Item</th>
            <th style="text-align:center;border:1px solid #e6e6e6;padding:8px;background:#fafafa">Qty</th>
            <th style="text-align:right;border:1px solid #e6e6e6;padding:8px;background:#fafafa">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <div style="color:#666">Shipping to:</div>
        <div style="text-align:right">
          <div>${escapeHtml(order.shipping.firstName + ' ' + order.shipping.lastName)}</div>
          <div>${escapeHtml(order.shipping.address)}</div>
          <div>${escapeHtml(order.shipping.city)} ${escapeHtml(order.shipping.postal)}</div>
          <div>${escapeHtml(order.shipping.country)}</div>
        </div>
      </div>

      <div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;">
        <div style="color:#666">Subtotal</div>
        <div>RS ${Number(order.subtotal).toFixed(0)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <div style="color:#666">Shipping</div>
        <div>RS ${Number(order.shippingCost).toFixed(0)}</div>
      </div>
      <div style="font-weight:bold;display:flex;justify-content:space-between;margin-top:8px">
        <div>Total</div>
        <div>RS ${Number(order.total).toFixed(0)}</div>
      </div>

      <p style="margin-top:18px;color:#666;font-size:13px">If you have questions, reply to this email or contact our support.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
      <p style="font-size:12px;color:#999;margin:0">HALIR Perfumery</p>
    </div>
  </div>
  `;
}

export function adminOrderHtml(order: any) {
    const itemsHtml = (order.items || []).map((it: any) => `
    <tr>
      <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(it.name)}</td>
      <td style="padding:8px;border:1px solid #e6e6e6;text-align:center">${it.qty}</td>
      <td style="padding:8px;border:1px solid #e6e6e6;text-align:right">RS ${Number(it.price).toFixed(0)}</td>
    </tr>`).join('');

    return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f7f7f7;padding:20px">
    <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #eee;padding:24px">
      <h2 style="margin:0 0 8px">New Order Received</h2>
      <p style="margin:0 0 8px">Order ID: <strong style="font-family:monospace">${order._id}</strong></p>
      <p style="margin:0 0 16px">Placed by: ${escapeHtml(order.shipping.email)} — ${escapeHtml(order.shipping.firstName + ' ' + order.shipping.lastName)}</p>

      <h3 style="margin-top:16px;margin-bottom:8px">Order summary</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <thead>
          <tr>
            <th style="text-align:left;border:1px solid #e6e6e6;padding:8px;background:#fafafa">Item</th>
            <th style="text-align:center;border:1px solid #e6e6e6;padding:8px;background:#fafafa">Qty</th>
            <th style="text-align:right;border:1px solid #e6e6e6;padding:8px;background:#fafafa">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;">
        <div style="color:#666">Subtotal</div>
        <div>RS ${Number(order.subtotal).toFixed(0)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <div style="color:#666">Shipping</div>
        <div>RS ${Number(order.shippingCost).toFixed(0)}</div>
      </div>
      <div style="font-weight:bold;display:flex;justify-content:space-between;margin-top:8px">
        <div>Total</div>
        <div>RS ${Number(order.total).toFixed(0)}</div>
      </div>

      <p style="margin-top:18px;color:#666;font-size:13px">Manage this order in the admin dashboard.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
      <p style="font-size:12px;color:#999;margin:0">HALIR Perfumery</p>
    </div>
  </div>
  `;
}

function escapeHtml(str: any) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[&<>"']/g, function (tag) {
        const chars: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return chars[tag] || tag;
    });
}
