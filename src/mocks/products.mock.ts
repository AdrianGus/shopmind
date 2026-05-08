export type ProductSpecificationValue = string | number | boolean;

export type ProductSpecifications = Record<string, ProductSpecificationValue>;

export type ProductReviewSummary = {
  average: number;
  total: number;
};

export type ProductSkuStock = {
  sku: string;
  size?: string;
  color?: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  shortDescription: string;
  description: string;
  specifications: ProductSpecifications;
  reviews: ProductReviewSummary;
  stockBySku: ProductSkuStock[];
  estimatedDelivery: string;
};

export const productsMock: Product[] = [
  {
    id: "tenis-runner-pro",
    name: "Tênis Runner Pro",
    category: "shoes",
    price: 349.9,
    stock: 8,
    shortDescription: "Tênis leve para corrida diária.",
    description:
      "Tênis de corrida com cabedal respirável, amortecimento macio e boa estabilidade para treinos leves e caminhadas.",
    specifications: {
      material: "Breathable mesh",
      weight: "280g",
      use: "Daily running",
      cushioning: "Soft EVA foam",
      outsole: "Non-slip rubber",
    },
    reviews: {
      average: 4.7,
      total: 128,
    },
    stockBySku: [
      {
        sku: "tenis-runner-pro-39",
        size: "39",
        stock: 2,
      },
      {
        sku: "tenis-runner-pro-40",
        size: "40",
        stock: 3,
      },
      {
        sku: "tenis-runner-pro-41",
        size: "41",
        stock: 3,
      },
    ],
    estimatedDelivery: "3 a 5 dias úteis",
  },
  {
    id: "tenis-speed-max",
    name: "Tênis Speed Max",
    category: "shoes",
    price: 529.9,
    stock: 5,
    shortDescription: "Tênis premium para treinos de velocidade.",
    description:
      "Tênis de alta performance com placa responsiva, espuma leve e ajuste firme para corridas rápidas.",
    specifications: {
      material: "Engineered knit",
      weight: "245g",
      use: "Speed training",
      cushioning: "Responsive foam",
      plate: "Nylon propulsion plate",
    },
    reviews: {
      average: 4.8,
      total: 86,
    },
    stockBySku: [
      {
        sku: "tenis-speed-max-40",
        size: "40",
        stock: 1,
      },
      {
        sku: "tenis-speed-max-41",
        size: "41",
        stock: 2,
      },
      {
        sku: "tenis-speed-max-42",
        size: "42",
        stock: 2,
      },
    ],
    estimatedDelivery: "2 a 4 dias úteis",
  },
  {
    id: "tenis-urban-flex",
    name: "Tênis Urban Flex",
    category: "shoes",
    price: 299.9,
    stock: 0,
    shortDescription: "Tênis casual flexível para uso urbano.",
    description:
      "Tênis confortável para o dia a dia, com solado flexível e visual minimalista para combinações casuais.",
    specifications: {
      material: "Canvas and synthetic leather",
      weight: "310g",
      use: "Casual",
      insole: "Comfort foam",
      outsole: "Flexible rubber",
    },
    reviews: {
      average: 4.4,
      total: 64,
    },
    stockBySku: [
      {
        sku: "tenis-urban-flex-38",
        size: "38",
        stock: 0,
      },
      {
        sku: "tenis-urban-flex-39",
        size: "39",
        stock: 0,
      },
      {
        sku: "tenis-urban-flex-40",
        size: "40",
        stock: 0,
      },
    ],
    estimatedDelivery: "Indisponível no momento",
  },
  {
    id: "fone-bluetooth-airbeat",
    name: "Fone Bluetooth AirBeat",
    category: "electronics",
    price: 199.9,
    stock: 12,
    shortDescription: "Fone Bluetooth com estojo de recarga.",
    description:
      "Fone sem fio com conexão estável, microfone integrado e estojo compacto para recargas ao longo do dia.",
    specifications: {
      connection: "Bluetooth 5.3",
      batteryLife: "24h with charging case",
      microphone: true,
      waterResistance: "IPX4",
      chargingPort: "USB-C",
    },
    reviews: {
      average: 4.5,
      total: 203,
    },
    stockBySku: [
      {
        sku: "fone-bluetooth-airbeat-black",
        color: "Black",
        stock: 7,
      },
      {
        sku: "fone-bluetooth-airbeat-white",
        color: "White",
        stock: 5,
      },
    ],
    estimatedDelivery: "1 a 3 dias úteis",
  },
  {
    id: "mochila-executiva-pro",
    name: "Mochila Executiva Pro",
    category: "accessories",
    price: 259.9,
    stock: 9,
    shortDescription: "Mochila executiva com compartimento para notebook.",
    description:
      "Mochila resistente com divisórias organizadoras, bolso acolchoado para notebook e acabamento discreto para rotina profissional.",
    specifications: {
      capacity: "24L",
      notebookCompartment: "Up to 15.6 inches",
      material: "Water-resistant polyester",
      pockets: 8,
      weight: "720g",
    },
    reviews: {
      average: 4.6,
      total: 91,
    },
    stockBySku: [
      {
        sku: "mochila-executiva-pro-black",
        color: "Black",
        stock: 6,
      },
      {
        sku: "mochila-executiva-pro-navy",
        color: "Navy",
        stock: 3,
      },
    ],
    estimatedDelivery: "3 a 6 dias úteis",
  },
  {
    id: "camiseta-dry-fit-core",
    name: "Camiseta Dry Fit Core",
    category: "apparel",
    price: 89.9,
    stock: 18,
    shortDescription: "Camiseta esportiva leve com secagem rápida.",
    description:
      "Camiseta dry fit para treinos, com tecido leve, toque macio e tecnologia de rápida evaporação do suor.",
    specifications: {
      material: "Polyester dry fit",
      fit: "Regular",
      use: "Training",
      quickDry: true,
      uvProtection: "UPF 30",
    },
    reviews: {
      average: 4.3,
      total: 156,
    },
    stockBySku: [
      {
        sku: "camiseta-dry-fit-core-m-black",
        size: "M",
        color: "Black",
        stock: 6,
      },
      {
        sku: "camiseta-dry-fit-core-g-black",
        size: "G",
        color: "Black",
        stock: 7,
      },
      {
        sku: "camiseta-dry-fit-core-m-blue",
        size: "M",
        color: "Blue",
        stock: 5,
      },
    ],
    estimatedDelivery: "2 a 5 dias úteis",
  },
];
