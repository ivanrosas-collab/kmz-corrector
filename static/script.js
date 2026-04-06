let sessionId = null;

// =====================
// 🗺️ MAPA
// =====================
var map = L.map('map').setView([19.0414, -98.2063], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let capaBuenos = L.layerGroup().addTo(map);
let capaMalos = L.layerGroup().addTo(map);


// =====================
// 📤 SUBIR
// =====================
function subir() {

    let inputBueno = document.getElementById("bueno");
    let inputMalo = document.getElementById("malo");

    if (inputBueno.files.length === 0 || inputMalo.files.length === 0) {
        alert("❌ Debes seleccionar ambos archivos KMZ");
        return;
    }

    let formData = new FormData();
    formData.append("bueno", inputBueno.files[0]);
    formData.append("malo", inputMalo.files[0]);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error("Error en upload");
        return res.json();
    })
    .then(data => {

        sessionId = data.id;

        capaBuenos.clearLayers();
        capaMalos.clearLayers();

        let bounds = [];

        // 🟢 BUENOS
        data.buenos.forEach(p => {
            let marker = L.circleMarker([p[1], p[0]], {
                radius: 5,
                color: "black"
            }).addTo(capaBuenos);

            bounds.push([p[1], p[0]]);
        });

        // 🔴 MALOS
        data.malos.forEach(p => {
            let marker = L.circleMarker([p[1], p[0]], {
                radius: 5,
                color: "red"
            }).addTo(capaMalos);

            bounds.push([p[1], p[0]]);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds);
        }

        document.getElementById("resumen").innerHTML = "Archivos cargados. Listo para corregir.";

    })
    .catch(err => {
        console.error(err);
        alert("❌ Error al subir archivos");
    });
}


// =====================
// ⚙️ CORREGIR
// =====================
function corregir() {

    if (!sessionId) {
        alert("❌ Primero carga archivos");
        return;
    }

    fetch(`/corregir/${sessionId}`)
    .then(res => res.json())
    .then(data => {

        capaMalos.clearLayers();

        let corregidos = 0;
        let ignorados = 0;

        data.resultado.forEach(p => {

            let color;

            if (p.status === "corregido") {
                color = "green";
                corregidos++;
            } else {
                color = "red";
                ignorados++;
            }

            L.circleMarker([p.coord[1], p.coord[0]], {
                radius: 6,
                color: color
            }).addTo(capaMalos);
        });

        let total = corregidos + ignorados;
        let porcentaje = ((corregidos / total) * 100).toFixed(1);

        document.getElementById("resumen").innerHTML = `
            <b>Total puntos:</b> ${total} <br>
            <b>Corregidos:</b> ${corregidos} 🟢 <br>
            <b>No corregidos:</b> ${ignorados} 🔴 <br>
            <b>% Corrección:</b> ${porcentaje}%
        `;

        alert("✅ Corrección aplicada");

    })
    .catch(err => {
        console.error(err);
        alert("❌ Error al corregir");
    });
}


// =====================
// 💾 DESCARGAR
// =====================
function descargar() {

    if (!sessionId) {
        alert("❌ Primero carga y corrige");
        return;
    }

    let nombre = document.getElementById("nombre").value || "corregido";

    window.location = `/descargar/${sessionId}?nombre=${nombre}`;
}