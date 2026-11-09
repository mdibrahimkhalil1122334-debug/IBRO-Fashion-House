 "use client";
import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Search, Plus, Package, Boxes, TrendingUp, LogOut, Pencil, Trash2, X, UploadCloud, Image as ImageIcon, RefreshCw, Menu } from "lucide-react";

type Product = { id: string; name: string; sku: string | null; category: string; description: string; price: number; stock: number; image_urls: string[]; created_at: string; };
const empty = { name: "", sku: "", category: "Men", description: "", price: "", stock: "", image_urls: [] as string[] };

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProducts() {
    if (!supabase || !session) return;
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) setNotice(error.message); else setProducts((data || []) as Product[]);
  }
  useEffect(() => { loadProducts(); }, [session]);
  useEffect(() => {
    if (!supabase || !session) return;
    const channel = supabase.channel("products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadProducts())
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, [session]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setNotice(error.message);
    setBusy(false);
  }
  async function saveProduct(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setNotice("");
    try {
      let urls = [...form.image_urls];
      if (files?.length) {
        for (const file of Array.from(files)) {
          if (file.size > 5 * 1024 * 1024) throw new Error("প্রতিটি ছবি ৫ MB-এর কম হতে হবে।");
          const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
          const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("product-images").getPublicUrl(path);
          urls.push(data.publicUrl);
        }
      }
      const payload = {
        name: form.name.trim(), sku: form.sku.trim() || null, category: form.category,
        description: form.description, price: Number(form.price || 0), stock: Number(form.stock || 0),
        image_urls: urls, updated_at: new Date().toISOString()
      };
      const result = editing
        ? await supabase.from("products").update(payload).eq("id", editing)
        : await supabase.from("products").insert(payload);
      if (result.error) throw result.error;
      setModal(false); setEditing(null); setForm(empty); setFiles(null);
      await loadProducts(); setNotice(editing ? "Product updated successfully." : "Product added successfully.");
    } catch (err: any) { setNotice(err.message || "Something went wrong."); }
    finally { setBusy(false); }
  }
  function openEdit(p: Product) {
    setEditing(p.id); setForm({ name:p.name, sku:p.sku || "", category:p.category, description:p.description || "", price:String(p.price), stock:String(p.stock), image_urls:p.image_urls || [] }); setFiles(null); setModal(true);
  }
  async function removeProduct(p: Product) {
    if (!supabase || !confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) setNotice(error.message); else { setProducts(old => old.filter(x => x.id !== p.id)); setNotice("Product deleted."); }
  }
  async function removeImage(url: string) {
    if (!supabase) return;
    setForm(f => ({ ...f, image_urls: f.image_urls.filter(x => x !== url) }));
    const marker = "/product-images/";
    const index = url.indexOf(marker);
    if (index >= 0) await supabase.storage.from("product-images").remove([decodeURIComponent(url.slice(index + marker.length).split("?")[0])]);
  }

  const filtered = useMemo(() => products.filter(p => {
    const term = search.toLowerCase();
    return (p.name.toLowerCase().includes(term) || (p.sku || "").toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
      && (category === "All" || p.category === category);
  }), [products, search, category]);
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const totalValue = products.reduce((s,p) => s + Number(p.price) * Number(p.stock), 0);
  const lowStock = products.filter(p => p.stock <= 5).length;

  if (!supabaseConfigured) return <main className="setup"><div className="setup-card"><div className="brand-mark">I</div><p className="eyebrow">IBRO FASHION HOUSE</p><h1>Connect your workspace</h1><p className="muted">Add your Supabase project credentials to activate secure login, cloud image storage and shared product data across browsers.</p><ol><li>Create a Supabase project.</li><li>Copy <b>Project URL</b> and <b>anon/public key</b> into <code>.env.local</code>.</li><li>Run <code>supabase/schema.sql</code> in Supabase SQL Editor.</li><li>Create your admin user in Supabase Authentication → Users.</li></ol><p className="hint">See README.md for the complete setup guide.</p></div></main>;

  if (!session) return <main className="login-shell"><form className="login-card" onSubmit={login}><div className="brand-mark">I</div><p className="eyebrow">IBRO FASHION HOUSE</p><h1>Welcome back</h1><p className="muted">Sign in to manage your product collection.</p><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>{notice && <p className="notice">{notice}</p>}<button className="primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <span>→</span></button><p className="tiny">Secure admin access · IBRO Fashion House</p></form></main>;

  return <main className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}><div className="brand"><div className="brand-mark small">I</div><div><b>IBRO</b><small>FASHION HOUSE</small></div><button className="icon-btn mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div><div className="side-label">WORKSPACE</div><div className="nav-item active"><Package size={18}/> Products <span className="nav-count">{products.length}</span></div><a className="nav-item" href="/admin/orders">Order management</a><a className="nav-item" href="/shop" target="_blank">View online store ↗</a><div className="side-bottom"><div className="profile"><div className="avatar">{(session.user.email || "A")[0].toUpperCase()}</div><div className="profile-info"><b>Administrator</b><small>{session.user.email}</small></div></div><button className="nav-item logout" onClick={()=>supabase?.auth.signOut()}><LogOut size={17}/> Sign out</button></div></aside>
    {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)}/>}
    <section className="main-area"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div><p className="eyebrow">INVENTORY MANAGEMENT</p><h2>Product overview</h2></div><div className="top-actions"><span className="live-dot">Live sync active</span><button className="icon-btn" title="Refresh products" onClick={loadProducts}><RefreshCw size={18}/></button><button className="primary" onClick={()=>{setEditing(null);setForm(empty);setFiles(null);setModal(true)}}><Plus size={17}/> Add product</button></div></header>
    {notice && <div className="toast" onClick={()=>setNotice("")}>{notice}<button><X size={14}/></button></div>}
    <div className="content"><div className="welcome-row"><div><h1>Your collection, <i>beautifully managed.</i></h1><p className="muted">A clear view of your products, stock and catalogue.</p></div><span className="date-label">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</span></div>
      <div className="stats"><div className="stat-card"><div className="stat-icon"><Package/></div><p>Total products</p><strong>{products.length}</strong><small>Products in your catalogue</small></div><div className="stat-card"><div className="stat-icon"><Boxes/></div><p>Total units in stock</p><strong>{products.reduce((s,p)=>s+Number(p.stock),0)}</strong><small>Across all product variants</small></div><div className="stat-card"><div className="stat-icon"><TrendingUp/></div><p>Inventory value</p><strong>৳{totalValue.toLocaleString("en-BD")}</strong><small>Based on price × stock</small></div><div className="stat-card"><div className="stat-icon warning"><Package/></div><p>Low stock items</p><strong>{lowStock}</strong><small>5 units or fewer remaining</small></div></div>
      <div className="catalog-head"><div><h3>All products <span>{products.length}</span></h3><p className="muted">Manage every item in your collection.</p></div><div className="search-wrap"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, SKU or category…"/></div></div>
      <div className="filters">{categories.map(c=><button key={c} className={category===c?"filter active-filter":"filter"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      {filtered.length ? <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image">{p.image_urls?.[0] ? <img src={p.image_urls[0]} alt={p.name}/> : <div className="image-placeholder"><ImageIcon size={30}/><span>No image</span></div>}<span className="category-tag">{p.category}</span><div className="card-actions"><button className="icon-btn" title="Edit" onClick={()=>openEdit(p)}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete" onClick={()=>removeProduct(p)}><Trash2 size={16}/></button></div></div><div className="product-info"><div className="product-title"><h4>{p.name}</h4><span className={p.stock<=5?"stock low":"stock"}>{p.stock} in stock</span></div><p className="sku">{p.sku ? `SKU: ${p.sku}` : "No SKU assigned"}</p><div className="product-foot"><b>৳{Number(p.price).toLocaleString("en-BD")}</b><span>{p.image_urls?.length || 0} photos</span></div></div></article>)}</div> : <div className="empty"><div className="empty-icon"><Package size={28}/></div><h3>{search ? "No matching products" : "Your catalogue starts here"}</h3><p className="muted">{search ? "Try a different search term." : "Add your first product to start building your collection."}</p>{!search && <button className="primary" onClick={()=>setModal(true)}><Plus size={17}/> Add your first product</button>}</div>}
    </div></section>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal" onSubmit={saveProduct}><div className="modal-head"><div><p className="eyebrow">PRODUCT CATALOGUE</p><h2>{editing ? "Edit product" : "Add new product"}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X/></button></div><div className="form-grid"><label className="span-2">Product name *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Premium Cotton Panjabi"/></label><label>SKU / Product ID<input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="IBR-001"/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Men</option><option>Women</option><option>Unisex</option><option>Accessories</option><option>Uncategorized</option></select></label><label>Price (BDT) *<input type="number" min="0" step="0.01" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="1500"/></label><label>Stock quantity *<input type="number" min="0" step="1" required value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="10"/></label><label className="span-2">Description<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Fabric, size, colour and product details…"/></label><div className="span-2"><label>Product photos</label><label className="upload-box"><UploadCloud size={22}/><b>Choose images to upload</b><span>JPG, PNG or WEBP · up to 5 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setFiles(e.target.files)}/></label>{files?.length ? <p className="tiny">{files.length} new image(s) selected</p> : null}{form.image_urls.length>0 && <div className="image-strip">{form.image_urls.map(url=><div key={url}><img src={url} alt="Product"/><button type="button" onClick={()=>removeImage(url)}><X size={13}/></button></div>)}</div>}</div></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Publish product"}</button></div></form></div>}
  </main>;
}
