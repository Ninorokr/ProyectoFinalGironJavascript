const obtenerCarritoLS = () => JSON.parse(localStorage.getItem("carrito")) || []

principal()

async function principal() {

    const response = await fetch("./catalogo.json")
    const catalogo = await response.json()
   
    renderizarProductos(catalogo)
    renderizarCarrito()

    let botonBuscar = document.getElementById("btnBuscar")
    botonBuscar.addEventListener("click", () => filtrarYRenderizar(catalogo))

    let botonVerCatalogoCarrito = document.getElementById("btnToggleCatalogoCarrito")
    botonVerCatalogoCarrito.addEventListener("click", toggleCatalogoCarrito)

    let inputBusqueda = document.getElementById("inputBusqueda")
    inputBusqueda.addEventListener("input", () => filtrarYRenderizar(catalogo))

    let botonComprar = document.getElementById("btnComprar")
    botonComprar.addEventListener("click", (e) => finalizarCompra(catalogo, e))
}

function contarMenosProducto(e) {
    let id = e.target.id.replace(/^\D+/g, '')
    let contador = document.getElementById("cantidad" + id)
    contador.value > 0 && contador.value--
    let event = new CustomEvent('actualizacion', { detail: contador.value })
    contador.dispatchEvent(event)
}

function contarMasProducto(e) {
    let id = e.target.id.replace(/^\D+/g, '')
    let contador = document.getElementById("cantidad" + id)
    contador.value >= 0 && contador.value++
    let event = new CustomEvent('actualizacion', { detail: contador.value })
    contador.dispatchEvent(event)
}

function filtrarYRenderizar(catalogo) {
    renderizarProductos(filtrarCatalogo(catalogo))
}

function filtrarCatalogo(catalogo) {
    let inputBusqueda = document.getElementById("inputBusqueda")
    return catalogo.filter((producto) => {
        return producto.nombre.toLowerCase().includes(inputBusqueda.value) || producto.categoria.includes(inputBusqueda.value)
    })
}

function renderizarProductos(catalogo) {
    let carrito = obtenerCarritoLS()

    let productos = document.getElementById("contenedorProductos")
    productos.innerHTML = ""
    for (let i = 0; i < catalogo.length; i++) {
        let {id, nombre, peso, precio, ruta} = catalogo[i]

        let cantidadInicial = 0;
        let posProductoEnCarrito = carrito.findIndex(producto => producto.id === id)
        if (posProductoEnCarrito != -1) {
            cantidadInicial = carrito[posProductoEnCarrito].cantidad
        }

        productos.innerHTML += `
            <div class=tarjeta>
                <img src=${ruta}>
                <div class=propiedades>
                    <p>${nombre}</p>
                    <p>Peso: ${peso.toFixed(3)} Kgs.</p>
                    <p>Precio: S/. ${precio.toFixed(2)}</p>
                </div>
                <div class=contador id=contador${id}>
                    <button class="boton menos" id=botonMenos${id}>
                        -
                    </button>
                    <input value=${cantidadInicial} size=1 id=cantidad${id}>
                    <button class="boton mas" id=botonMas${id}>
                        +
                    </button>
                </div>
            </div>
        `
    }

    let cantidad
    let botonMenos
    let botonMas

    for(let i = 0; i < catalogo.length; i++) {
        cantidad = document.getElementById("cantidad" + catalogo[i].id)
        cantidad.addEventListener("actualizacion", (e) => agregarProductoAlCarrito(e, catalogo))

        botonMenos = document.getElementById("botonMenos" + catalogo[i].id)
        botonMenos.addEventListener("click", (e) => contarMenosProducto(e))
        botonMas = document.getElementById("botonMas" + catalogo[i].id)
        botonMas.addEventListener("click", (e) => contarMasProducto(e))
    }
}

function agregarProductoAlCarrito(e, catalogo) { //modificarCantidadCarrito (agregar o quitar)
    let cantidad = Number(e.target.value)
    let carrito = obtenerCarritoLS()
    let idDelProducto = Number(e.target.id.replace(/^\D+/g, ''))
    
    let posProductoEnCarrito = carrito.findIndex(producto => producto.id === idDelProducto)
    let productoBuscado = catalogo.find(producto => producto.id === idDelProducto)

    if (posProductoEnCarrito == -1) {
        carrito.push({
            id: productoBuscado.id,
            nombre: productoBuscado.nombre,
            categoria: productoBuscado.categoria,
            peso: productoBuscado.peso,
            precio: productoBuscado.precio,
            cantidad: cantidad,
            pesoTotal: Math.round(productoBuscado.peso * cantidad * 100) / 100,
            costoTotal: Math.round(productoBuscado.precio * cantidad * 100) / 100,
            ruta: productoBuscado.ruta
        })
        Toastify({
            text: "Se agregó " + productoBuscado.nombre + " al carrito 🛒✅",
            duration: 3000
            }).showToast();
    } else {
        carrito[posProductoEnCarrito].cantidad = cantidad
        carrito[posProductoEnCarrito].pesoTotal = Math.round(carrito[posProductoEnCarrito].peso * cantidad * 100) / 100
        carrito[posProductoEnCarrito].costoTotal = Math.round(carrito[posProductoEnCarrito].precio * cantidad * 100) / 100
    }

    if (cantidad == 0) {
        carrito = quitarProductoDelCarrito(carrito, idDelProducto)
    }

    localStorage.setItem("carrito", JSON.stringify(carrito))
    renderizarCarrito()
}

function quitarProductoDelCarrito(carrito, idDelProducto) {
    let posProductoEnCarrito = carrito.findIndex(producto => producto.id === idDelProducto)

    Toastify({
        text: "Se quitó " + carrito[posProductoEnCarrito].nombre + " del carrito 🛒❌",
        duration: 3000
        }).showToast();

    carrito.splice(posProductoEnCarrito, 1)

    return carrito
}

function renderizarCarrito() {
    let carrito = obtenerCarritoLS()
    let divCarrito = document.getElementById("divCarrito")
    divCarrito.innerHTML = "<h1>Carrito 🛒</h1>"
    carrito.forEach(producto => {
        let {id, nombre, cantidad, pesoTotal, costoTotal, ruta} = producto
        let tarjetaProdCarrito = document.createElement("div")
        tarjetaProdCarrito.className = "tarjetaProdCarrito"

        tarjetaProdCarrito.innerHTML = `
            <img src=${ruta}>
            <div class=propiedadesProdCarrito>
                <p id="nomProductoCarrito">${nombre}</p>
                    <div class=contadorProdCarrito>
                            <button class="boton menos" id=botonMenosCarrito${id}>
                                -
                            </button>
                            <input value=${cantidad} size=1 id=cantidadCarrito${id}>
                            <button class="boton mas" id=botonMasCarrito${id}>
                                +
                            </button>
                    </div>
                <p>${pesoTotal} Kgs.</p>
                <p>S/. ${costoTotal}</p>
            </div>
        `

        divCarrito.appendChild(tarjetaProdCarrito)
    })

    let botonMenos
    let botonMas

    for(let i = 0; i < carrito.length; i++) {
        botonMenos = document.getElementById("botonMenosCarrito" + carrito[i].id)
        botonMenos.addEventListener("click", (e) => contarMenosProducto(e))
        botonMas = document.getElementById("botonMasCarrito" + carrito[i].id)
        botonMas.addEventListener("click", (e) => contarMasProducto(e))
    }
}

function finalizarCompra(catalogo, e) {
    let carrito = JSON.parse(localStorage.getItem("carrito"))

    if (carrito) {
        if(carrito.length == 0) {
            Swal.fire({
                title: "El carrito está vacío",
                text: "No has agregado productos al carrito 🤷‍♂️",
                icon: "error"
              });
        } else {
            Swal.fire({
                title: "Compra realizada con éxito",
                text: "¡Gracias por comprar con nosotros!",
                icon: "success"
              });
            localStorage.removeItem("carrito")
            renderizarProductos(catalogo)
            renderizarCarrito()
        }
    } else {
        Swal.fire({
            title: "El carrito está vacío",
            text: "No has agregado productos al carrito 🤷‍♂️",
            icon: "error"
          });
    }
}

function toggleCatalogoCarrito() {
    
    let botonVerCatalogoCarrito = document.getElementById("btnToggleCatalogoCarrito")
    let divCatalogo = document.getElementById("divCatalogo")
    let divCarrito = document.getElementById("divCarrito")
    
    if(divCatalogo.className == "oculto") {
        botonVerCatalogoCarrito.innerText = "Ver Carrito"
        divCatalogo.className = ""
        divCarrito.className = "oculto"
    } else {
        botonVerCatalogoCarrito.innerText = "Ver Catálogo"
        divCatalogo.className = "oculto"
        divCarrito.className = ""
    }
}