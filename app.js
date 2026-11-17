const API = "https://rickandmortyapi.com/api/character";

let paginaActual = 1;
let totalPaginas = 42;
let cargando = false; 

const grid = document.getElementById("grid-personajes");
const cajaError = document.getElementById("mensaje-error");
const btnAnterior = document.getElementById("btn-anterior");
const btnSiguiente = document.getElementById("btn-siguiente");
const textoPagina = document.getElementById("texto-pagina");
const modal = new bootstrap.Modal(document.getElementById("modalDetalle"));

// 1. Traducir el estado al español y devolver su color de Bootstrap
const obtenerEstadoEsp = (status) => {
    if (status === "Alive") return { texto: "Vivo", color: "bg-success" };
    if (status === "Dead") return { texto: "Muerto", color: "bg-danger" };
    return { texto: "Desconocido", color: "bg-secondary" };
};


const obtenerGeneroEsp = (gender) => {
    if (gender === "Male") return "Masculino";
    if (gender === "Female") return "Femenino";
    if (gender === "Genderless") return "Sin género";
    return "Desconocido";
};

async function cargarPersonajes(pagina = 1) {
    if (cargando) return;
    cargando = true;

    // Desactivar botones mientras carga para no saturar la API
    btnAnterior.disabled = true;
    btnSiguiente.disabled = true;
    cajaError.classList.add("d-none");
    grid.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    try {
        const respuesta = await fetch(`${API}?page=${pagina}`);
        
        if (respuesta.status === 429) {
            throw new Error("Demasiadas peticiones seguidas. Espera 5 segundos y vuelve a intentar.");
        }
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los personajes de la API.");
        }

        const datos = await respuesta.json();
        paginaActual = pagina;
        totalPaginas = datos.info.pages;

        let html = "";
        datos.results.forEach(p => {
            const estado = obtenerEstadoEsp(p.status);

            html += `
                <div class="col">
                    <div class="card h-100 border-secondary">
                        <img src="${p.image}" loading="lazy" class="card-img-top" alt="${p.name}"
                             onerror="this.src='https://rickandmortyapi.com/api/character/avatar/19.jpeg'">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title fw-bold mb-1">${p.name}</h5>
                            <p class="card-text small mb-3">
                                <span class="d-inline-block rounded-circle ${estado.color} p-1 me-2"></span>${estado.texto} - ${p.species}
                            </p>
                            <div class="mt-auto">
                                <small class="text-body-secondary d-block">Última ubicación:</small>
                                <span class="d-block mb-3">${p.location.name}</span>
                                <button class="btn btn-primary w-100" onclick="verDetalle(${p.id})">
                                    Detalle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;

        textoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
        btnAnterior.disabled = !datos.info.prev;
        btnSiguiente.disabled = !datos.info.next;

    } catch (error) {
        grid.innerHTML = "";
        cajaError.textContent = error.message;
        cajaError.classList.remove("d-none");
       
        btnAnterior.disabled = paginaActual <= 1;
        btnSiguiente.disabled = paginaActual >= totalPaginas;
    } finally {
        cargando = false;
    }
}


async function verDetalle(id) {
    const titulo = document.getElementById("modal-titulo");
    const cuerpo = document.getElementById("modal-cuerpo");

    titulo.textContent = "Cargando...";
    cuerpo.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`;
    modal.show();

    try {
        const respuesta = await fetch(`${API}/${id}`);
        if (!respuesta.ok) {
            throw new Error("Error al obtener los detalles del personaje.");
        }

        const p = await respuesta.json();
        const estado = obtenerEstadoEsp(p.status);
        const genero = obtenerGeneroEsp(p.gender);
        const tipo = p.type ? p.type : "Sin tipo";

        const fecha = new Date(p.created);
        const dia = String(fecha.getUTCDate()).padStart(2, "0");
        const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
        const anio = fecha.getUTCFullYear();
        const fechaFormateada = `${dia}/${mes}/${anio}`;

        titulo.textContent = p.name;
        cuerpo.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-5 text-center mb-3 mb-md-0">
                    <img src="${p.image}" alt="${p.name}" class="img-fluid rounded">
                </div>
                <div class="col-md-7">
                    <table class="table table-dark table-sm mb-0">
                        <tbody>
                            <tr><td class="text-secondary">ID</td><td>${p.id}</td></tr>
                            <tr>
                                <td class="text-secondary">Estado</td>
                                <td><span class="d-inline-block rounded-circle ${estado.color} p-1 me-2"></span>${estado.texto}</td>
                            </tr>
                            <tr><td class="text-secondary">Especie</td><td>${p.species}</td></tr>
                            <tr><td class="text-secondary">Género</td><td>${genero}</td></tr>
                            <tr><td class="text-secondary">Tipo</td><td>${tipo}</td></tr>
                            <tr><td class="text-secondary">Origen</td><td>${p.origin.name}</td></tr>
                            <tr><td class="text-secondary">Última ubicación</td><td>${p.location.name}</td></tr>
                            <tr><td class="text-secondary">Episodios</td><td>${p.episode.length}</td></tr>
                            <tr><td class="text-secondary">Creado</td><td>${fechaFormateada}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        cuerpo.innerHTML = `<div class="alert alert-danger mb-0">${error.message}</div>`;
    }
}

btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
        cargarPersonajes(paginaActual - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

btnSiguiente.addEventListener("click", () => {
    if (paginaActual < totalPaginas) {
        cargarPersonajes(paginaActual + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

cargarPersonajes(1);
