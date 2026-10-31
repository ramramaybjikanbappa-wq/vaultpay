document.addEventListener('DOMContentLoaded', async () => {
  const screens = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
  
  async function seedIfNeeded() {
    try {
      const txs = await rr.db('transactions').list();
      if (!txs || txs.length === 0) {
        await rr.db('transactions').create({
          recipient: 'Sarah Connor',
          handle: 'sarah@example.com',
          category: 'Transfer',
          date: 'Oct 24, 2023',
          amount: 450.00,
          type: 'credit',
          status: 'Completed',
          note: 'Split dinner & cab'
        });
        await rr.db('transactions').create({
          recipient: 'Amazon Prime',
          handle: 'prime@amazon.com',
          category: 'Shopping',
          date: 'Oct 22, 2023',
          amount: 14.99,
          type: 'debit',
          status: 'Completed',
          note: 'Monthly subscription'
        });
        await rr.db('transactions').create({
          recipient: 'Netflix',
          handle: 'billing@netflix.com',
          category: 'Entertainment',
          date: 'Oct 20, 2023',
          amount: 19.99,
          type: 'debit',
          status: 'Completed',
          note: 'UHD Plan'
        });
        await rr.db('transactions').create({
          recipient: 'Apple Store',
          handle: 'retail@apple.com',
          category: 'Shopping',
          date: 'Oct 15, 2023',
          amount: 129.00,
          type: 'debit',
          status: 'Completed',
          note: 'MagSafe Charger'
        });
      }
      const cards = await rr.db('cards').list();
      if (!cards || cards.length === 0) {
        await rr.db('cards').create({
          name: 'VaultPay Infinite',
          number: '4892 3829 1029 4892',
          exp: '12/26',
          cvv: '482',
          type: 'visa',
          balance: 12450.00,
          status: 'Active'
        });
        await rr.db('cards').create({
          name: 'VaultPay Debit',
          number: '5412 7500 3920 9104',
          exp: '08/25',
          cvv: '910',
          type: 'master',
          balance: 12139.50,
          status: 'Active'
        });
      }
    } catch (e) {
      console.error('Seeding error:', e);
    }
  }

  await seedIfNeeded();

  function showToast(message, isError = false) {
    let toast = document.getElementById('rr-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rr-toast';
      toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;border-radius:8px;color:#fff;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.style.background = isError ? '#ef4444' : '#10b981';
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  }

  function switchScreen(targetId) {
    screens.forEach(s => {
      if (s.id === targetId) {
        s.removeAttribute('hidden');
      } else {
        s.setAttribute('hidden', 'true');
      }
    });
    navItems.forEach(n => {
      if (n.getAttribute('data-target') === targetId) {
        n.classList.add('active');
      } else {
        n.classList.remove('active');
      }
    });
    window.location.hash = targetId;
    window.scrollTo(0, 0);
    loadAppData();
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      if (target) switchScreen(target);
    });
  });

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const act = btn.getAttribute('data-action');
      if (act === 'go-send') switchScreen('screen-send');
      if (act === 'go-cards') switchScreen('screen-cards');
      if (act === 'go-history') switchScreen('screen-history');
      if (act === 'open-new-card-modal') openAddCardModal();
    });
  });

  if (window.location.hash) {
    const hashId = window.location.hash.substring(1);
    if (document.getElementById(hashId)) {
      switchScreen(hashId);
    }
  }

  window.addEventListener('hashchange', () => {
    const hashId = window.location.hash.substring(1);
    if (document.getElementById(hashId)) {
      switchScreen(hashId);
    }
  });

  async function loadAppData() {
    try {
      const txs = await rr.db('transactions').list();
      const cards = await rr.db('cards').list();
      
      let totalBal = cards.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
      if (totalBal === 0) totalBal = 24589.50;
      
      const balEl = document.querySelector('.balance-amount');
      if (balEl) balEl.textContent = '$' + totalBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const dashTableBody = document.querySelector('#screen-dashboard .data-table tbody');
      if (dashTableBody && txs.length > 0) {
        dashTableBody.innerHTML = '';
        txs.slice(0, 4).forEach(tx => {
          const initials = tx.recipient ? tx.recipient.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'TX';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><div class="td-user"><div class="avatar-sm">${initials}</div><span>${tx.recipient}</span></div></td>
            <td>${tx.category}</td>
            <td>${tx.date}</td>
            <td class="${tx.type === 'credit' ? 'text-success' : 'text-danger'}">${tx.type === 'credit' ? '+' : '-'}$${Number(tx.amount).toFixed(2)}</td>
            <td><span class="badge badge-${tx.status === 'Completed' ? 'success' : 'warning'}">${tx.status}</span></td>
          `;
          dashTableBody.appendChild(tr);
        });
      }

      const historyTableBody = document.querySelector('#screen-history .data-table tbody');
      if (historyTableBody && txs.length > 0) {
        historyTableBody.innerHTML = '';
        txs.forEach(tx => {
          const initials = tx.recipient ? tx.recipient.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'TX';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><div class="td-user"><div class="avatar-sm">${initials}</div><div><strong>${tx.recipient}</strong><span>${tx.note || tx.category}</span></div></div></td>
            <td>${tx.category}</td>
            <td>${tx.date}</td>
            <td class="${tx.type === 'credit' ? 'text-success' : 'text-danger'}">${tx.type === 'credit' ? '+' : '-'}$${Number(tx.amount).toFixed(2)}</td>
            <td><span class="badge badge-${tx.status === 'Completed' ? 'success' : 'warning'}">${tx.status}</span></td>
            <td><button class="btn btn-sm btn-outline" data-receipt="${tx.id}">Receipt</button></td>
          `;
          historyTableBody.appendChild(tr);
        });

        historyTableBody.querySelectorAll('[data-receipt]').forEach(b => {
          b.addEventListener('click', () => {
            const id = b.getAttribute('data-receipt');
            const found = txs.find(t => t.id === id);
            if (found) {
              alert(`Receipt for ${found.recipient}\nAmount: $${Number(found.amount).toFixed(2)}\nDate: ${found.date}\nStatus: ${found.status}\nNote: ${found.note || 'None'}`);
            }
          });
        });
      }

      const cardsGrid = document.querySelector('#screen-cards .cards-grid');
      if (cardsGrid && cards.length > 0) {
        cardsGrid.innerHTML = '';
        cards.forEach(card => {
          const theme = card.type === 'visa' ? 'visa-theme' : 'master-theme';
          const div = document.createElement('div');
          div.className = `credit-card-item ${theme}`;
          div.innerHTML = `
            <div class="card-inner">
              <div class="card-header-row"><span>${card.name}</span><span class="chip"></span></div>
              <div class="card-number-display">${card.number}</div>
              <div class="card-details-row">
                <div class="c-holder"><span>CARDHOLDER</span><strong>JANE DOE</strong></div>
                <div class="c-exp"><span>EXPIRES</span><strong>${card.exp}</strong></div>
                <div class="c-cvv"><span>CVV</span><strong>${card.status === 'Frozen' ? 'FRZN' : '***'}</strong></div>
              </div>
            </div>
            <div class="card-actions-bar">
              <button class="btn btn-sm btn-outline" data-freeze="${card.id}">${card.status === 'Frozen' ? 'Unfreeze' : 'Freeze Card'}</button>
              <button class="btn btn-sm btn-outline" data-details="${card.id}">Show Details</button>
              <button class="btn btn-sm btn-outline text-danger" data-remove="${card.id}">Remove</button>
            </div>
          `;
          cardsGrid.appendChild(div);
        });

        cardsGrid.querySelectorAll('[data-freeze]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-freeze');
            const c = cards.find(x => x.id === id);
            if (c) {
              c.status = c.status === 'Frozen' ? 'Active' : 'Frozen';
              await rr.db('cards').update(id, c);
              showToast(`Card successfully ${c.status === 'Frozen' ? 'frozen' : 'unfrozen'}`);
              loadAppData();
            }
          });
        });

        cardsGrid.querySelectorAll('[data-details]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-details');
            const c = cards.find(x => x.id === id);
            if (c) {
              alert(`Card Name: ${c.name}\nNumber: ${c.number}\nExpires: ${c.exp}\nCVV: ${c.cvv}\nBalance: $${Number(c.balance).toFixed(2)}`);
            }
          });
        });

        cardsGrid.querySelectorAll('[data-remove]').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to remove this card?')) {
              const id = btn.getAttribute('data-remove');
              await rr.db('cards').remove(id);
              showToast('Card removed successfully');
              loadAppData();
            }
          });
        });
      }
    } catch (err) {
      console.error('Error loading app data:', err);
    }
  }

  const sendForm = document.getElementById('form-send-money');
  if (sendForm) {
    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const recipient = document.getElementById('recipient-input').value;
      const amount = document.getElementById('send-amount').value;
      const currency = document.getElementById('send-currency').value;
      const note = document.getElementById('send-note').value;

      if (!recipient || !amount || Number(amount) <= 0) {
        showToast('Please enter valid recipient and amount', true);
        return;
      }

      const confirmed = confirm(`Review Transfer:\nTo: ${recipient}\nAmount: $${amount} ${currency}\nNote: ${note || 'None'}\n\nConfirm and send?`);
      if (confirmed) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const d = new Date();
        const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        
        await rr.db('transactions').create({
          recipient: recipient.split('@')[0] || recipient,
          handle: recipient,
          category: 'Transfer',
          date: dateStr,
          amount: Number(amount),
          type: 'debit',
          status: 'Completed',
          note: note || 'Money transfer'
        });

        showToast('Transfer completed successfully!');
        sendForm.reset();
        switchScreen('screen-dashboard');
      }
    });
  }

  function openAddCardModal() {
    const name = prompt('Enter card name (e.g. VaultPay Travel):', 'VaultPay Travel');
    if (!name) return;
    const typeChoice = prompt('Select card type (visa or master):', 'visa');
    const type = typeChoice && typeChoice.toLowerCase().includes('master') ? 'master' : 'visa';
    const num1 = Math.floor(1000 + Math.random() * 9000);
    const num2 = Math.floor(1000 + Math.random() * 9000);
    const num3 = Math.floor(1000 + Math.random() * 9000);
    const num4 = Math.floor(1000 + Math.random() * 9000);
    const number = `${num1} ${num2} ${num3} ${num4}`;
    
    rr.db('cards').create({
      name: name,
      number: number,
      exp: '10/28',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      type: type,
      balance: 1000.00,
      status: 'Active'
    }).then(() => {
      showToast('New card added successfully!');
      loadAppData();
    });
  }

  document.querySelectorAll('.contact-pill, .recipient-list li').forEach(el => {
    el.addEventListener('click', () => {
      const nameSpan = el.querySelector('strong') || el.querySelector('span');
      if (nameSpan) {
        const name = nameSpan.textContent;
        switchScreen('screen-send');
        const recInput = document.getElementById('recipient-input');
        if (recInput) recInput.value = name;
      }
    });
  });

  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const q = searchInput.value.toLowerCase();
      const txs = await rr.db('transactions').list();
      const historyTableBody = document.querySelector('#screen-history .data-table tbody');
      if (historyTableBody) {
        historyTableBody.innerHTML = '';
        const filtered = txs.filter(t => t.recipient.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q)));
        filtered.forEach(tx => {
          const initials = tx.recipient ? tx.recipient.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'TX';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><div class="td-user"><div class="avatar-sm">${initials}</div><div><strong>${tx.recipient}</strong><span>${tx.note || tx.category}</span></div></div></td>
            <td>${tx.category}</td>
            <td>${tx.date}</td>
            <td class="${tx.type === 'credit' ? 'text-success' : 'text-danger'}">${tx.type === 'credit' ? '+' : '-'}$${Number(tx.amount).toFixed(2)}</td>
            <td><span class="badge badge-${tx.status === 'Completed' ? 'success' : 'warning'}">${tx.status}</span></td>
            <td><button class="btn btn-sm btn-outline">Receipt</button></td>
          `;
          historyTableBody.appendChild(tr);
        });
      }
    });
  }

  await loadAppData();
});