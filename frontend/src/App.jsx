import { useEffect, useMemo, useState } from 'react'

const categories = ['Everything', 'Clothing', 'Accessories']
const cartStorageKey = 'dressyboutique-bag'
const authTokenKey = 'dressyboutique-token'
const identityApiUrl = import.meta.env.VITE_IDENTITY_API_URL || ''
const catalogApiUrl = import.meta.env.VITE_CATALOG_API_URL || ''

function apiUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

function getAuthToken() {
  const token = localStorage.getItem(authTokenKey)
  if (token) return token
  const previousToken = localStorage.getItem('forme-token')
  if (previousToken) {
    localStorage.setItem(authTokenKey, previousToken)
    localStorage.removeItem('forme-token')
  }
  return previousToken
}

function clearAuthToken() {
  localStorage.removeItem(authTokenKey)
  localStorage.removeItem('forme-token')
}

function readSavedCart() {
  const saved = localStorage.getItem(cartStorageKey)
  if (!saved) return []
  try {
    const items = JSON.parse(saved)
    return Array.isArray(items) ? items : []
  } catch (error) {
    if (error instanceof SyntaxError) return []
    throw error
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    leaf: <><path d="M20 4c-9 0-15 4-15 11a5 5 0 0 0 5 5c7 0 11-6 10-16Z" /><path d="M4 21c3-5 7-8 12-11" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function App() {
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('Everything')
  const [cart, setCart] = useState(readSavedCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('register')
  const [user, setUser] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadProducts() {
    setLoadError('')
    try {
      const response = await fetch(apiUrl(catalogApiUrl, '/api/products'))
      if (!response.ok) throw new Error('The collection could not be loaded.')
      setProducts(await response.json())
    } catch (error) {
      setLoadError(error.message || 'The collection could not be loaded.')
    }
  }

  useEffect(() => {
    loadProducts()
    const token = getAuthToken()
    if (!token) return
    fetch(apiUrl(identityApiUrl, '/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (!response.ok) throw new Error('Your session has expired.')
        return response.json()
      })
      .then(setUser)
      .catch(clearAuthToken)
  }, [])

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart))
  }, [cart])

  const visibleProducts = useMemo(
    () => activeCategory === 'Everything' ? products : products.filter((product) => product.category === activeCategory),
    [activeCategory, products],
  )
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0)

  function addToBag(product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id)
      return existing
        ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  function changeQuantity(productId, amount) {
    setCart((items) => items
      .map((item) => item.id === productId ? { ...item, quantity: item.quantity + amount } : item)
      .filter((item) => item.quantity > 0))
  }

  function openAccount() {
    setAuthMode(user ? 'account' : 'register')
    setAuthOpen(true)
  }

  function signOut() {
    clearAuthToken()
    setUser(null)
    setAuthOpen(false)
  }

  async function placeOrder() {
    const token = getAuthToken()
    if (!user || !token) {
      setCartOpen(false)
      setAuthMode('register')
      setAuthOpen(true)
      return
    }

    setCheckoutBusy(true)
    setCheckoutError('')
    try {
      const response = await fetch(apiUrl(catalogApiUrl, '/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || result.message || 'We couldn’t place your order. Please try again.')
      setCart([])
      setCartOpen(false)
      setNotice(`Test purchase #${result.id} completed. No payment was charged.`)
      window.setTimeout(() => setNotice(''), 5000)
    } catch (error) {
      setCheckoutError(error.message)
    } finally {
      setCheckoutBusy(false)
    }
  }

  return (
    <div className="storefront">
      <div className="announcement">A thoughtful wardrobe starts here <span>✦</span> Discover the new collection</div>
      <div className={`order-toast${notice ? ' visible' : ''}`} role="status" aria-live="polite">{notice}</div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="DressyBoutique home">DRESSY<span>BOUTIQUE</span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#collection">Shop all</a>
          <a href="#story">Our approach</a>
          <a href="#newsletter">Journal</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button account-button" onClick={openAccount} aria-label={user ? `Account for ${user.name}` : 'Sign in'}>
            <Icon name="user" /><span className="account-label">{user ? user.name.split(' ')[0] : 'Account'}</span>
          </button>
          <button className="icon-button bag-button" onClick={() => setCartOpen(true)} aria-label={`Shopping bag, ${cartCount} items`}>
            <Icon name="bag" /><span className="bag-label">Bag</span><span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <img className="hero-image" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=90" alt="Friends in easy everyday outfits, walking together in the city" />
          <div className="hero-tint" />
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">THE EVERYDAY, RECONSIDERED</span>
            <h1>Wear what<br />feels like <em>you.</em></h1>
            <p>Thoughtful pieces for the days that make up a life.</p>
            <a className="button button-dark" href="#collection">Discover the collection <Icon name="arrow" size={17} /></a>
          </div>
          <div className="hero-note">01 — 03 <span /> MADE FOR REAL LIFE</div>
        </section>

        <section className="values-strip" id="story">
          <span><Icon name="leaf" size={19} /> Considered materials</span>
          <span className="value-divider">✳</span>
          <span>Designed to live in</span>
          <span className="value-divider">✳</span>
          <span>Less, but better</span>
        </section>

        <section className="collection section-wrap" id="collection">
          <div className="section-heading">
            <div><span className="eyebrow">THE FORM EDIT — 01</span><h2>Pieces to keep close.</h2></div>
            <a className="text-link" href="#collection">View the edit <Icon name="arrow" size={16} /></a>
          </div>
          <div className="collection-tools">
            <div className="category-tabs" role="group" aria-label="Filter products by category">
              {categories.map((category) => (
                <button key={category} className={activeCategory === category ? 'category-tab active' : 'category-tab'} onClick={() => setActiveCategory(category)}>{category}</button>
              ))}
            </div>
            <span className="product-total">{visibleProducts.length} considered essentials</span>
          </div>

          {loadError ? (
            <div className="load-error"><p>{loadError} Make sure both backend services are running.</p><button className="text-link" onClick={loadProducts}>Try again <Icon name="arrow" size={16} /></button></div>
          ) : visibleProducts.length === 0 ? (
            <div className="loading-grid"><span className="loading-dot" /> Curating the collection...</div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.imageUrl} alt={product.name} loading={index > 3 ? 'lazy' : 'eager'} />
                    {product.badge && <span className="product-badge">{product.badge}</span>}
                    <button className="quick-add" onClick={() => addToBag(product)}>Add to bag <Icon name="plus" size={15} /></button>
                  </div>
                  <div className="product-info">
                    <div><h3>{product.name}</h3><span>{product.color}</span></div>
                    <span className="product-price">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <p className="product-description">{product.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="story-banner">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85" alt="A considered wardrobe in warm natural tones" loading="lazy" /></div>
          <div className="story-copy">
            <span className="eyebrow">A LITTLE MORE INTENTION</span>
            <h2>Good clothes.<br />No overthinking.</h2>
            <p>We make the pieces you reach for on repeat — with thoughtful materials, considered details, and room to be yourself.</p>
            <a href="#collection" className="text-link">A closer look <Icon name="arrow" size={16} /></a>
          </div>
        </section>

        <section className="newsletter" id="newsletter">
          <span className="eyebrow">A NOTE FROM DRESSYBOUTIQUE</span>
          <h2>Good things, occasionally.</h2>
          <p>New pieces, small stories, and a little inspiration for your everyday.</p>
          <form onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); window.alert('Thanks for being here. You’re on the list!') }}>
            <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
            <input id="newsletter-email" type="email" placeholder="Your email address" required />
            <button type="submit" aria-label="Subscribe"><Icon name="arrow" /></button>
          </form>
          <span className="newsletter-fine-print">By subscribing, you agree to receive the occasional email from us. Unsubscribe anytime.</span>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#">DRESSY<span>BOUTIQUE</span></a>
        <span>Made for all the in-between.</span>
        <span>© 2026 DRESSYBOUTIQUE</span>
      </footer>

      {cartOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
        <aside className="side-panel cart-panel" aria-label="Shopping bag">
          <div className="panel-heading"><div><span className="eyebrow">YOUR EDIT</span><h2>Your bag <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><Icon name="close" /></button></div>
          {cart.length === 0 ? <div className="empty-bag"><Icon name="bag" size={32} /><h3>Your bag is taking a breather.</h3><p>Find something that feels like you.</p><button className="button button-dark" onClick={() => { setCartOpen(false); document.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore the collection</button></div> : <>
            <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}>
              <img src={item.imageUrl} alt="" />
              <div className="cart-item-details"><h3>{item.name}</h3><span>{item.color}</span><strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong>
                <div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item.id, -1)}><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.id, 1)}><Icon name="plus" size={14} /></button></div>
              </div>
            </div>)}</div>
            <div className="cart-summary"><div className="subtotal"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><p className="test-checkout-note">Test checkout only. No real payment will be charged.</p>{checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}<button className="button button-dark checkout-button" onClick={placeOrder} disabled={checkoutBusy}>{checkoutBusy ? 'Recording test order...' : 'Complete test purchase'} <Icon name="arrow" size={17} /></button></div>
          </>}
        </aside>
      </div>}

      {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} user={user} onClose={() => setAuthOpen(false)} onUser={setUser} onSignOut={signOut} />}
    </div>
  )
}

function AuthModal({ mode, setMode, user, onClose, onUser, onSignOut }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const isRegister = mode === 'register'

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch(apiUrl(identityApiUrl, `/api/auth/${isRegister ? 'register' : 'login'}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? form : { email: form.email, password: form.password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || result.message || 'We couldn’t sign you in. Please check your details.')
      localStorage.setItem(authTokenKey, result.token)
      const profileResponse = await fetch(apiUrl(identityApiUrl, '/api/auth/me'), { headers: { Authorization: `Bearer ${result.token}` } })
      if (!profileResponse.ok) throw new Error('Your account was created, but we couldn’t verify your session. Please sign in again.')
      onUser(await profileResponse.json())
      onClose()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="overlay auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="auth-card" aria-label={user && mode === 'account' ? 'Your account' : isRegister ? 'Create your account' : 'Sign in'}>
      <button className="icon-button auth-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      {user && mode === 'account' ? <div className="account-view"><span className="eyebrow">WELCOME BACK</span><h2>Good to see you, {user.name.split(' ')[0]}.</h2><p>{user.email}</p><button className="button button-outline" onClick={onSignOut}>Sign out</button></div> : <>
        <span className="eyebrow">{isRegister ? 'A GOOD PLACE TO START' : 'WELCOME BACK'}</span>
        <h2>{isRegister ? 'Make yourself at home.' : 'Good to have you back.'}</h2>
        <p className="auth-intro">{isRegister ? 'Create an account for a quicker checkout.' : 'Sign in to pick up right where you left off.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <label>Your name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength="1" maxLength="80" /></label>}
          <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength="254" /></label>
          <label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="8" maxLength="72" /></label>
          {isRegister && <span className="password-hint">At least 8 characters</span>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'One moment...' : isRegister ? 'Create account' : 'Sign in'} <Icon name="arrow" size={17} /></button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New around here?'} <button onClick={() => { setError(''); setMode(isRegister ? 'login' : 'register') }}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
      </>}
    </section>
  </div>
}

export default App
