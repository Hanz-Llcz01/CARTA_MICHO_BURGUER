export const menuData = [
    {
        id: 'hamburguesas',
        name: 'Hamburguesas',
        icon: '🍔',
        items: [
            { id: 'h1', variant_id: '6d767227-33a4-4738-9bad-426be19362fe', name: 'Hamburguesa clásica', desc: 'Carne artesanal a la plancha + papas fritas y/o hilo + todas las cremas', price: 11.00, badge: 'Popular' },
            { id: 'h2', variant_id: '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', name: 'Hamburguesa especial', desc: 'Carne artesanal + jamón inglés + queso derretido + papas fritas', price: 12.00 },
            { id: 'h3', variant_id: '6443424f-c859-44b2-81df-14b2259a1f5e', name: 'Hamburguesa royal', desc: 'Carne jugosa + huevo montado + queso derretido + papas fritas', price: 13.00, badge: '🔥 Clásica Royal' },
            { id: 'h4', variant_id: '4e4fef97-e474-4399-bd9c-a3018cc5f08e', name: 'Hamburguesa super', desc: 'Carne + huevo + queso + jamón + porción de papas crocantes', price: 14.00 },
            { id: 'h5', variant_id: 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', name: 'Hamburguesa club royal', desc: 'Carne + queso + jamón + huevo + tocino ahumado crocante + papas', price: 15.00, badge: '⭐ La Especialidad' }
        ]
    },
    {
        id: 'pollo_deshilachado',
        name: 'Pollo Deshilachado',
        icon: '🥪',
        items: [
            { id: 'pd1', variant_id: 'c577b91a-a10f-4e1e-9911-a1f73b9f6c97', name: 'Pollo deshilachado clásico', desc: 'Generoso y jugoso pollo deshilachado + papas al hilo/fritas + todas las cremas', price: 11.00, badge: 'Clásico' },
            { id: 'pd2', variant_id: 'e4d1fbbf-1503-4317-94cb-acc75b1c913a', name: 'Pollo deshilachado especial', desc: 'Pollo deshilachado + jamón inglés + queso derretido + papas', price: 12.00 },
            { id: 'pd3', variant_id: '060095b1-6642-4cb1-ae5a-2d2cd7c96334', name: 'Pollo deshilachado royal', desc: 'Pollo deshilachado + huevo montado a la plancha + queso derretido + papas', price: 13.00, badge: '🔥 Recomendado' },
            { id: 'pd4', variant_id: '6906ccd6-cc74-4042-8601-e646c1129131', name: 'Pollo deshilachado super', desc: 'Pollo deshilachado + huevo + queso + jamón inglés + papas', price: 14.00 },
            { id: 'pd5', variant_id: 'f1f36672-bc7c-41de-9961-ddd068380e4d', name: 'Pollo deshilachado club royal', desc: 'Pollo deshilachado + queso + jamón + huevo + tocino crocante + papas', price: 15.00, badge: '⭐ Supremo' }
        ]
    },
    {
        id: 'filetes',
        name: 'Filetes',
        icon: '🥩',
        items: [
            { id: 'f1', variant_id: '08d0e755-36f3-4253-b262-56430ea37cad', name: 'Filete clásico', desc: 'Filete jugoso a la plancha + papas fritas y/o hilo + todas las cremas', price: 11.00, badge: 'A la Plancha' },
            { id: 'f2', variant_id: '8e2a954c-1719-4be3-99b2-f220b80f40a8', name: 'Filete especial', desc: 'Filete jugoso + jamón inglés + queso derretido + papas fritas', price: 12.00 },
            { id: 'f3', variant_id: '2bfa628d-bdfb-468b-aafa-ac351846b7de', name: 'Filete royal', desc: 'Filete a la plancha + huevo montado + queso derretido + papas', price: 13.00, badge: '🔥 Muy Pedido' },
            { id: 'f4', variant_id: 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', name: 'Filete super', desc: 'Filete a la plancha + huevo + queso + jamón + papas crocantes', price: 14.00 },
            { id: 'f5', variant_id: '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea', name: 'Filete club royal', desc: 'Filete + queso + jamón + huevo + tocino ahumado crocante + papas', price: 15.00, badge: '⭐ Especialidad' }
        ]
    },
    {
        id: 'chorizos',
        name: 'Chorizos',
        icon: '🌭',
        items: [
            { id: 'c1', variant_id: '8fdde459-5909-49a4-a2c9-eacbec3efa18', name: 'Chorizo clásico', desc: 'Chorizo parrillero ahumado doradito + papas fritas y/o hilo + cremas', price: 11.00 },
            { id: 'c2', variant_id: '9be1375d-d1ca-4ada-ab6d-55218b8a792d', name: 'Chorizo especial', desc: 'Chorizo parrillero + jamón inglés + queso derretido + papas fritas', price: 12.00 },
            { id: 'c3', variant_id: '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', name: 'Chorizo royal', desc: 'Chorizo parrillero + huevo montado + queso derretido + papas', price: 13.00, badge: '🔥 Parrillero' },
            { id: 'c4', variant_id: 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', name: 'Chorizo super', desc: 'Chorizo parrillero + huevo + queso + jamón inglés + papas', price: 14.00 },
            { id: 'c5', variant_id: '6059ac60-e268-4809-9060-4253c62c24db', name: 'Chorizo club royal', desc: 'Chorizo parrillero + queso + jamón + huevo + tocino ahumado + papas', price: 15.00, badge: '⭐ Súper Parrillero' }
        ]
    },
    {
        id: 'salchipapa',
        name: 'Salchipapas',
        icon: '🍟',
        items: [
            { id: 's1', variant_id: '113c5cdc-9523-4131-9107-9387f748b203', name: 'Salchipapa clásica', desc: 'Papas fritas crocantes + rodajas de hotdog de ternera doradito', price: 13.00 },
            { id: 's2', variant_id: '8f657ba7-4ba7-4b6b-808a-55d07b931269', name: 'Salchipapa especial', desc: 'Papas fritas + hotdog de ternera + huevo montado a la plancha', price: 14.00 },
            { id: 's3', variant_id: '7dd71cc6-5106-4f5c-be97-0e669ec48d5e', name: 'Salchipapa royal', desc: 'Papas + hotdog + huevo a la plancha + queso derretido', price: 14.50 },
            { id: 's4', variant_id: '9f238682-be0f-4853-91be-2824471e0ab0', name: 'Salchipollo', desc: 'Generosa porción de papas + hotdog + jugoso pollo deshilachado', price: 16.00, badge: '🔥 Favorito' },
            { id: 's5', variant_id: '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', name: 'Salchipapa super', desc: 'Papas + hotdog + huevo + queso + jamón + pollo deshilachado', price: 18.00 },
            { id: 's6', variant_id: '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', name: 'Salchi club royal', desc: 'Papas + hotdog + pollo + queso + jamón + huevo + tocino ahumado crocante', price: 20.00, badge: '⭐ La Más Contundente' }
        ]
    },
    {
        id: 'pollo_broaster',
        name: 'Broasters',
        icon: '🍗',
        items: [
            { id: 'p1', variant_id: 'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', name: 'Pecho broaster', desc: 'Generosa presa de pecho broaster dorada y crujiente + papas fritas + ensalada', price: 15.00, badge: '🍗 El Más Pedido' },
            { id: 'p2', variant_id: '7433770a-524e-46b1-b07d-1c6f4c2a7eb1', name: 'Encuentro broaster', desc: 'Encuentro jugoso y extracrocante + papas fritas + ensalada fresca', price: 15.00 },
            { id: 'p3', variant_id: '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', name: 'Pierna broaster', desc: 'Pierna broaster dorada con receta de la casa + papas fritas + ensalada', price: 13.00 },
            { id: 'p4', variant_id: '8056dee7-40f6-4e43-bce8-a3344060997c', name: 'Ala broaster', desc: 'Alita broaster crocante + papas fritas + ensalada fresca y cremas', price: 10.00 },
            { id: 'p5', variant_id: '10a16c08-3a93-44af-aeb6-a993c4400d50', name: 'Deditos broaster', desc: 'Crujientes y suaves tiras de pechuga broaster empanizadas + papas fritas + ensalada y cremas', price: 18.00, badge: '🔥 Para Compartir' }
        ]
    },
    {
        id: 'extras_porciones',
        name: 'Extras y Porciones',
        icon: '➕',
        items: [
            { id: 'ex1', variant_id: 'dda9fa95-7d68-4951-babe-914be4f9ef3a', name: 'Porción de papas', desc: 'Porción extra de papas fritas doradas y crocantes al punto', price: 8.00, badge: 'Porción' },
            { id: 'ex2', variant_id: '110e8dc7-88b9-4ed2-a79e-9964e8b5087d', name: 'Adicional de hotdog', desc: 'Porción adicional de hotdog doradito a la plancha', price: 6.00 },
            { id: 'ex3', variant_id: '2177ce33-0135-45b7-9a43-60167b803e1f', name: 'Adicional de ala broaster', desc: 'Alita broaster dorada y crocante adicional', price: 7.00 },
            { id: 'ex4', variant_id: 'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', name: 'Adicional de pecho broaster', desc: 'Presa extra de pecho broaster jugosa y crujiente', price: 10.00 },
            { id: 'ex5', variant_id: '7433770a-524e-46b1-b07d-1c6f4c2a7eb1', name: 'Adicional de encuentro broaster', desc: 'Presa extra de encuentro broaster bien dorada', price: 10.00 },
            { id: 'ex6', variant_id: '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', name: 'Adicional de muslo / pierna broaster', desc: 'Presa extra de muslo o pierna broaster', price: 10.00 },
            { id: 'ex7', variant_id: 'b34af2ce-02d8-426a-ab23-44a9c4b1f845', name: 'Adicional de hamburguesa', desc: 'Carne artesanal para hamburguesa a la plancha adicional', price: 8.00 },
            { id: 'ex8', variant_id: '8fdde459-5909-49a4-a2c9-eacbec3efa18', name: 'Adicional de chorizo', desc: 'Chorizo parrillero a la plancha adicional', price: 8.00 },
            { id: 'ex9', variant_id: '79e76f6e-a502-43c0-85a0-a2de773691f3', name: 'Inca Kola 500ml', desc: 'Gaseosa Inca Kola de medio litro bien helada', price: 3.80 },
            { id: 'ex10', variant_id: '79e76f6e-a502-43c0-85a0-a2de773691f3', name: 'Coca Cola 500ml', desc: 'Gaseosa Coca Cola de medio litro bien helada', price: 3.80 }
        ]
    }
];
