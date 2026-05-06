fetch('products.json').then(r=>r.json()).then(products=>{
  const grid = document.querySelector('#products-grid');
  if(!grid) return;
  grid.innerHTML = products.map(p=>`<article class="product"><div class="fav">♡</div><img src="${p.image}" alt="${p.name}"><div class="content"><p class="title">${p.name}</p><p class="price">${p.price}</p><a class="cart" href="#">Do košíku</a></div></article>`).join('');
});
