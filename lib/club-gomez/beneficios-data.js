/** Datos de beneficios del mes — imágenes placeholder hasta que subas las finales */
export const DESTACADO_MES = {
  id: "motos",
  titulo: "2 MOTOS AKT",
  subtitulo: "Special 110 X + NKD 125",
  fechas: ["26 de septiembre", "31 de octubre"],
  imagenPc: "/club-gomez/beneficio-motos.png",
  imagenMovil: "/club-gomez/beneficio-motos-movil.png",
  labelPlaceholder: "Foto 2 motos (hero del mes)",
};

export const BENEFICIOS_CLOVER = [
  { id: "nevera", nombre: "Nevera MABE", imagenKey: "beneficio-nevera", labelPlaceholder: "Nevera MABE" },
  { id: "tv", nombre: 'TV 50" KALLEY', imagenKey: "beneficio-tv", labelPlaceholder: "TV KALLEY 50\"" },
  { id: "bici", nombre: "Bicicleta Profit", imagenKey: "beneficio-bici", labelPlaceholder: "Bicicleta rin 29" },
  { id: "laptop", nombre: "Lenovo IdeaPad", imagenKey: "beneficio-laptop", labelPlaceholder: "Laptop Lenovo" },
];

export const BENEFICIOS_MES = [
  {
    id: "nevera",
    nombre: "Nevera MABE No Frost Congelador Superior 297 Litros",
    fechas: ["6 de octubre", "22 de octubre"],
    imagenKey: "beneficio-nevera",
    labelPlaceholder: "Nevera MABE 297L",
  },
  {
    id: "estufa",
    nombre: "Estufa de Piso MABE 4 Puestos Gas Natural",
    fechas: ["7 de octubre", "15 de octubre", "28 de octubre"],
    imagenKey: "beneficio-estufa",
    labelPlaceholder: "Estufa MABE 4 puestos",
  },
  {
    id: "lavadora",
    nombre: "Lavadora KALLEY Carga Superior 12 Kilos",
    fechas: ["8 de octubre", "20 de octubre", "30 de octubre"],
    imagenKey: "beneficio-lavadora",
    labelPlaceholder: "Lavadora KALLEY 12kg",
  },
  {
    id: "bici",
    nombre: "Bicicleta Profit Jasper Rin 29",
    fechas: ["9 de octubre", "16 de octubre", "24 de octubre"],
    imagenKey: "beneficio-bici",
    labelPlaceholder: "Bicicleta Profit Jasper",
  },
  {
    id: "parlante",
    nombre: "Parlante KALLEY K-SPK300D Negro",
    fechas: ["10 de octubre", "22 de octubre", "29 de octubre"],
    imagenKey: "beneficio-parlante",
    labelPlaceholder: "Parlante KALLEY",
  },
  {
    id: "tv",
    nombre: 'TV KALLEY 50" 4K-UHD Smart TV',
    fechas: ["14 de octubre", "21 de octubre"],
    imagenKey: "beneficio-tv",
    labelPlaceholder: "TV KALLEY 50\"",
  },
  {
    id: "laptop",
    nombre: "Portátil LENOVO IdeaPad Slim 3 15.3\" i5 / 8GB / 512GB",
    fechas: ["13 de octubre", "24 de octubre"],
    imagenKey: "beneficio-laptop",
    labelPlaceholder: "Lenovo IdeaPad Slim 3",
  },
  {
    id: "moto-110",
    nombre: "Motocicleta AKT Special 110 X",
    fechas: ["26 de septiembre"],
    imagenKey: "beneficio-moto-110",
    labelPlaceholder: "AKT Special 110 X",
  },
  {
    id: "moto-125",
    nombre: "Motocicleta AKT NKD 125",
    fechas: ["31 de octubre"],
    imagenKey: "beneficio-moto-125",
    labelPlaceholder: "AKT NKD 125",
  },
];

/** Ruta lista para cuando subas: /club-gomez/{imagenKey}.png */
export function beneficioSrc(imagenKey) {
  return `/club-gomez/${imagenKey}.png`;
}
