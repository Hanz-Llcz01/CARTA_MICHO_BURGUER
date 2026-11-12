// js/admin.js - Panel de Administración Universal (funciona en file://, XAMPP localhost y Vercel)
const DEFAULT_ADMIN_MENU = [
    {
        id: 'hamburguesas', name: 'Hamburguesas', icon: '🍔', active: true,
        items: [
            { id: 'h1', item_id: '8d26ea32-8dae-4605-8c94-39e65fac883d', variant_id: '6d767227-33a4-4738-9bad-426be19362fe', sku: '1', name: 'Hamburguesa clásica', desc: 'Carne artesanal a la plancha + papas fritas y/o hilo + todas las cremas', price: 11.00, badge: 'Popular', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'h2', item_id: '7aca8589-3c9d-4a1d-a667-211f173c0086', variant_id: '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', sku: '10000', name: 'Hamburguesa especial', desc: 'Carne artesanal + jamón inglés + queso derretido + papas fritas', price: 12.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'h3', item_id: 'f7619d47-bef3-46df-b3d1-630e1ca1217f', variant_id: '6443424f-c859-44b2-81df-14b2259a1f5e', sku: '10001', name: 'Hamburguesa royal', desc: 'Carne jugosa + huevo montado + queso derretido + papas fritas', price: 13.00, badge: '🔥 Clásica Royal', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'h4', item_id: '15905a00-9021-4f45-8c26-bc072c265101', variant_id: '4e4fef97-e474-4399-bd9c-a3018cc5f08e', sku: '10002', name: 'Hamburguesa super', desc: 'Carne + huevo + queso + jamón + porción de papas crocantes', price: 14.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'h5', item_id: 'd930d9ca-4572-4fb9-9873-dcbfd4652eed', variant_id: 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', sku: '10003', name: 'Hamburguesa club royal', desc: 'Carne + queso + jamón + huevo + tocino ahumado crocante + papas', price: 15.00, badge: '⭐ La Especialidad', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false }
        ]
    },
    {
        id: 'pollo_deshilachado', name: 'Pollo Deshilachado', icon: '🥪', active: true,
        items: [
            { id: 'pd1', item_id: '6b212672-b3d6-4974-afb7-05f973bcd2df', variant_id: 'c577b91a-a10f-4e1e-9911-a1f73b9f6c97', sku: '10004', name: 'Pollo deshilachado clásico', desc: 'Generoso y jugoso pollo deshilachado + papas al hilo/fritas + todas las cremas', price: 11.00, badge: 'Clásico', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'pd2', item_id: 'bd6047e5-af1a-41d0-bd8a-4f512e05003d', variant_id: 'e4d1fbbf-1503-4317-94cb-acc75b1c913a', sku: '10005', name: 'Pollo deshilachado especial', desc: 'Pollo deshilachado + jamón inglés + queso derretido + papas', price: 12.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'pd3', item_id: 'd20f6f49-8ded-4f42-b824-0b56b00f3310', variant_id: '060095b1-6642-4cb1-ae5a-2d2cd7c96334', sku: '10006', name: 'Pollo deshilachado royal', desc: 'Pollo deshilachado + huevo montado a la plancha + queso derretido + papas', price: 13.00, badge: '🔥 Recomendado', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'pd4', item_id: 'd4d67d62-2420-42e2-b59e-07aed2dbc9a5', variant_id: '6906ccd6-cc74-4042-8601-e646c1129131', sku: '10007', name: 'Pollo deshilachado super', desc: 'Pollo deshilachado + huevo + queso + jamón inglés + papas', price: 14.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'pd5', item_id: '099f26d4-fd17-4a4d-a609-311f2861df59', variant_id: 'f1f36672-bc7c-41de-9961-ddd068380e4d', sku: '10008', name: 'Pollo deshilachado club royal', desc: 'Pollo deshilachado + queso + jamón + huevo + tocino crocante + papas', price: 15.00, badge: '⭐ Supremo', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false }
        ]
    },
    {
        id: 'filetes', name: 'Filetes', icon: '🥩', active: true,
        items: [
            { id: 'f1', item_id: 'b94a3fef-856b-47ab-a980-5fc63df047a3', variant_id: '08d0e755-36f3-4253-b262-56430ea37cad', sku: '10009', name: 'Filete clásico', desc: 'Filete jugoso a la plancha + papas fritas y/o hilo + todas las cremas', price: 11.00, badge: 'A la Plancha', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'f2', item_id: '21bbd13d-052d-4872-ba5e-8804f96e563c', variant_id: '8e2a954c-1719-4be3-99b2-f220b80f40a8', sku: '10010', name: 'Filete especial', desc: 'Filete jugoso + jamón inglés + queso derretido + papas fritas', price: 12.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'f3', item_id: 'e64a2703-dec2-4c19-b57a-48416104748e', variant_id: '2bfa628d-bdfb-468b-aafa-ac351846b7de', sku: '10011', name: 'Filete royal', desc: 'Filete a la plancha + huevo montado + queso derretido + papas', price: 13.00, badge: '🔥 Muy Pedido', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'f4', item_id: '09ae3fad-dc66-421d-8601-edfe2f48dd62', variant_id: 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', sku: '10012', name: 'Filete super', desc: 'Filete a la plancha + huevo + queso + jamón + papas crocantes', price: 14.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'f5', item_id: '872de49a-fc34-45a7-963f-379b001c106d', variant_id: '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea', sku: '10013', name: 'Filete club royal', desc: 'Filete + queso + jamón + huevo + tocino ahumado crocante + papas', price: 15.00, badge: '⭐ Especialidad', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false }
        ]
    },
    {
        id: 'crispy', name: 'Crispy', icon: '🍗', active: true,
        items: [
            { id: 'cr1', item_id: 'ccccc63e-663c-47c9-a114-55d8d032a90a', variant_id: '5262de55-d870-46c2-aad9-25a7a096d8a0', sku: '10039', name: 'Crispy clásico', desc: 'Filete de pollo empanizado extracrocante + papas fritas y/o hilo + cremas', price: 12.00, badge: '🔥 Clásico Crispy', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'cr2', item_id: 'e137bae2-ec08-4609-86e4-7fce38a49645', variant_id: '57bf1904-69f2-427a-8731-afe078274a6d', sku: '10047', name: 'Crispy especial', desc: 'Filete de pollo crispy + jamón inglés + queso derretido + papas fritas', price: 13.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'cr3', item_id: 'be41a621-224b-4b13-a11a-a7ecd47015c7', variant_id: 'd94b34ba-f604-44b9-b76c-08286adaff5e', sku: '10048', name: 'Crispy royal', desc: 'Filete de pollo crispy + huevo montado + queso derretido + papas', price: 14.00, badge: 'Popular', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'cr4', item_id: 'e96c7fa1-ba54-4279-8de1-d418308c4563', variant_id: '54ca71a0-bb6d-44de-b3a3-af21b46924c3', sku: '10049', name: 'Crispy super', desc: 'Filete crispy + huevo + queso + jamón inglés + papas crocantes', price: 15.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'cr5', item_id: 'f29834f6-bc3e-49a6-a2a0-65fca8a19ea5', variant_id: '60bc53aa-36cd-4650-9707-c082244fbf7c', sku: '10050', name: 'Crispy club royal', desc: 'Filete crispy + queso + jamón + huevo + tocino ahumado crocante + papas', price: 16.00, badge: '⭐ Supremo', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false }
        ]
    },
    {
        id: 'chorizos', name: 'Chorizos', icon: '🌭', active: true,
        items: [
            { id: 'c1', item_id: '560346b1-a761-4c3a-a547-1d982cf8b5ad', variant_id: '8fdde459-5909-49a4-a2c9-eacbec3efa18', sku: '10020', name: 'Chorizo clásico', desc: 'Chorizo precocido ahumado doradito + papas fritas y/o hilo + cremas', price: 11.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'c2', item_id: '3f13e867-c3e4-49fb-88c4-f1cfa34bc07c', variant_id: '9be1375d-d1ca-4ada-ab6d-55218b8a792d', sku: '10021', name: 'Chorizo especial', desc: 'Chorizo precocido + jamón inglés + queso derretido + papas fritas', price: 12.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'c3', item_id: 'd133d9be-1a85-4a29-ae41-037a18385aac', variant_id: '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', sku: '10022', name: 'Chorizo royal', desc: 'Chorizo precocido + huevo montado + queso derretido + papas', price: 13.00, badge: '🔥 Clásico', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'c4', item_id: 'b4db10d1-298e-45e3-a0b1-dbdb719f73d8', variant_id: 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', sku: '10023', name: 'Chorizo super', desc: 'Chorizo precocido + huevo + queso + jamón inglés + papas', price: 14.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false },
            { id: 'c5', item_id: '56b27324-d61c-4e81-acb5-8eacbbbe2f8d', variant_id: '6059ac60-e268-4809-9060-4253c62c24db', sku: '10024', name: 'Chorizo club royal', desc: 'Chorizo precocido + queso + jamón + huevo + tocino ahumado + papas', price: 15.00, badge: '⭐ El Más Completo', active: true, manualOutOfStock: false, allowsPotatoChoice: true, isBeverage: false }
        ]
    },
    {
        id: 'salchipapa', name: 'Salchipapas', icon: '🍟', active: true,
        items: [
            { id: 's1', item_id: '9e4f8fa0-2e06-4af5-9af3-d24edbffef0f', variant_id: '113c5cdc-9523-4131-9107-9387f748b203', sku: '10025', name: 'Salchipapa clásica', desc: 'Papas fritas crocantes + rodajas de hotdog de ternera doradito', price: 13.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 's2', item_id: '58b72a9a-7d1f-476e-b955-f1fa67e33730', variant_id: '8f657ba7-4ba7-4b6b-808a-55d07b931269', sku: '10026', name: 'Salchipapa especial', desc: 'Papas fritas + hotdog de ternera + huevo montado a la plancha', price: 14.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 's3', item_id: 'ab071975-01de-410b-89ea-1ecfaf67874b', variant_id: '7dd71cc6-5106-4f5c-be97-0e669ec48d5e', sku: '10027', name: 'Salchipapa royal', desc: 'Papas + hotdog + huevo a la plancha + queso derretido', price: 14.50, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 's4', item_id: 'de54b6b6-2570-4efc-9e97-fe68194ce74b', variant_id: '9f238682-be0f-4853-91be-2824471e0ab0', sku: '10028', name: 'Salchipollo', desc: 'Generosa porción de papas + hotdog + jugoso pollo deshilachado', price: 16.00, badge: '🔥 Favorito', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 's5', item_id: 'f2b2c0a3-cb4e-49c3-8ee1-c4b06ca09d8f', variant_id: '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', sku: '10029', name: 'Salchipapa super', desc: 'Papas + hotdog + huevo + queso + jamón + pollo deshilachado', price: 18.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 's6', item_id: '9621b0c0-76c0-4d12-8bba-ae7bff659b71', variant_id: '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', sku: '10030', name: 'Salchi club royal', desc: 'Papas + hotdog + pollo + queso + jamón + huevo + tocino ahumado crocante', price: 20.00, badge: '⭐ La Más Contundente', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false }
        ]
    },
    {
        id: 'pollo_broaster', name: 'Broasters', icon: '🍗', active: true,
        items: [
            { id: 'p1', item_id: 'bf50c0e1-2c6f-4442-958a-f63c43cd9248', variant_id: 'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', sku: '10014', name: 'Pecho broaster', desc: 'Generosa presa de pecho broaster dorada y crujiente + papas fritas + ensalada', price: 15.00, badge: '🍗 El Más Pedido', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'p2', item_id: 'd11c3f46-f00e-45d2-8b27-54d7df9a3afe', variant_id: '7433770a-524e-46b1-b07d-1c6f4c2a7eb1', sku: '10015', name: 'Encuentro broaster', desc: 'Encuentro jugoso y extracrocante + papas fritas + ensalada fresca', price: 15.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'p3', item_id: '2525382c-e803-4c18-ba9e-a5a38741a8b2', variant_id: '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', sku: '10016', name: 'Muzlo broaster', desc: 'Jugoso muzlo broaster dorado con receta de la casa + papas fritas + ensalada', price: 13.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'p4', item_id: '2ea7ad03-d4a4-4e32-b523-0a53dafdbb76', variant_id: '8056dee7-40f6-4e43-bce8-a3344060997c', sku: '10017', name: 'Ala broaster', desc: 'Alita broaster crocante + papas fritas + ensalada fresca y cremas', price: 12.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'p5', item_id: '6cead790-8ed3-4bf8-927d-f34ff503e3e4', variant_id: '10a16c08-3a93-44af-aeb6-a993c4400d50', sku: '10019', name: 'Deditos broaster', desc: 'Crujientes y suaves tiras de pechuga broaster empanizadas + papas fritas + ensalada y cremas', price: 20.00, badge: '🔥 Para Compartir', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false }
        ]
    },
    {
        id: 'promociones', name: 'Promociones', icon: '🔥', active: true,
        items: [
            { id: 'prom1', item_id: 'c9956e41-b9c2-493a-88e6-85ac2df6290c', variant_id: 'df1e6c91-9f19-4dbd-a065-b4b021fc4843', sku: '10018', name: '2 Alas Broaster', desc: '2 alas broaster en plato crocante con papas y ensalada', price: 15.00, badge: 'Promo', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false }
        ]
    },
    {
        id: 'extras_porciones', name: 'Gaseosas y Extras', icon: '🥤', active: true,
        items: [
            { id: 'ex9', item_id: '648dc082-bc8e-4e8e-9465-7a79ab7011f2', variant_id: '79e76f6e-a502-43c0-85a0-a2de773691f3', sku: '10046', name: 'Inca Kola 500ml', desc: 'Gaseosa Inca Kola de medio litro bien helada', price: 4.00, badge: '🥤 Helada', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: true },
            { id: 'ex10', item_id: 'f96fb6bd-7e5b-430c-969b-01e0c6cbe4db', variant_id: 'cf052d29-a589-4a5f-8118-c0816e01477e', sku: '10051', name: 'Coca Cola 500ml', desc: 'Gaseosa Coca Cola de medio litro bien helada', price: 4.00, badge: '🥤 Helada', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: true },
            { id: 'ex1', item_id: '929590c3-68f7-4bf5-b277-b0d001699d44', variant_id: 'dda9fa95-7d68-4951-babe-914be4f9ef3a', sku: '10031', name: 'Porción de papas', desc: 'Porción extra de papas fritas doradas y crocantes al punto', price: 8.00, badge: 'Porción', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex2', item_id: '04de048f-dd6b-4007-98c8-c8b6f00c3779', variant_id: '110e8dc7-88b9-4ed2-a79e-9964e8b5087d', sku: '10037', name: 'Adicional de hotdog', desc: 'Porción adicional de hotdog doradito a la plancha', price: 6.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex3', item_id: 'df2ddfdd-dae0-480c-bcab-cdeeb8000cdf', variant_id: '2177ce33-0135-45b7-9a43-60167b803e1f', sku: '10045', name: 'Adicional de ala broaster', desc: 'Alita broaster dorada y crocante adicional', price: 7.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex4', item_id: '998675f3-2dfd-433d-931c-e2f41cea658f', variant_id: '47fd3400-d49d-49fa-9f9b-b749a89414bd', sku: '10032', name: 'Adicional de pecho broaster', desc: 'Presa extra de pecho broaster jugosa y crujiente', price: 10.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex5', item_id: 'ea88986e-ef6b-45d6-8eb5-287cd78602d3', variant_id: '8d4008bc-a051-420f-bf69-d46e33878809', sku: '10052', name: 'Adicional de encuentro broaster', desc: 'Presa extra de encuentro broaster bien dorada', price: 10.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex6', item_id: '50655989-bc69-49d0-a557-f4dab49a7c00', variant_id: '139e2101-3055-4fb7-9413-b33432f8e55f', sku: '10053', name: 'Adicional de muzlo broaster', desc: 'Presa extra de muzlo broaster bien dorada', price: 8.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex7', item_id: '923e2fd3-48fd-4202-9e65-524c495200e7', variant_id: 'b34af2ce-02d8-426a-ab23-44a9c4b1f845', sku: '10040', name: 'Adicional de carne', desc: 'Carne artesanal para hamburguesa a la plancha adicional', price: 6.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex8', item_id: '92f7084d-71bc-4ea1-a4bc-301701c2989c', variant_id: 'bc323c7e-358a-4853-855b-9e2f2beb1618', sku: '10054', name: 'Adicional de chorizo', desc: 'Chorizo precocido a la plancha adicional', price: 6.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false },
            { id: 'ex11', item_id: '7740bccd-13af-4474-bc45-e20de18c0e27', variant_id: 'c526cfb0-c85d-466a-aa62-8b9ee2629d69', sku: '10055', name: 'Adicional de pollo', desc: 'Generosa porción de pollo deshilachado jugoso adicional', price: 6.00, badge: '', active: true, manualOutOfStock: false, allowsPotatoChoice: false, isBeverage: false }
        ]
    }
];

function getDefaultConfigObject() {
    return {
        version: 1,
        updatedAt: new Date().toISOString(),
        adminUser: 'admin',
        schedule: {
            mode: 'auto',
            openTime: '18:30',
            closeTime: '22:30',
            openDays: [1, 2, 3, 4, 5, 6],
            hoursLabel: '🕒 Lun - Sáb: 6:30 PM a 10:30 PM',
            customClosedTitle: 'Cocina Cerrada',
            customClosedMessage: '',
            estimatedTimeMins: 20
        },
        sideOptions: {
            ensaladaAvailable: true,
            papaHiloAvailable: true
        },
        cremasRule: {
            maxFree: 9,
            extraPrice: 0.50
        },
        cremas: [
            { id: 'may', name: 'MAYONESA', label: 'Mayonesa', available: true },
            { id: 'ket', name: 'KETCHUT', label: 'Kétchut', available: true },
            { id: 'mostaza', name: 'MOSTAZA', label: 'Mostaza', available: true },
            { id: 'golf', name: 'GOLF', label: 'Salsa Golf', available: true },
            { id: 'tartara', name: 'TÁRTARA', label: 'Tártara', available: true },
            { id: 'aji', name: 'AJÍ', label: 'Ají', available: true },
            { id: 'aceituna', name: 'ACEITUNA', label: 'Aceituna', available: true }
        ],
        extras: [
            { id: 'queso', item_id: 'b0b82d56-cabd-490b-91b5-033e289769bb', variant_id: '9a66356e-1dda-43bf-b4ac-dd3fd4e04064', sku: '10033', name: 'Queso', price: 1.00, available: true },
            { id: 'jamon', item_id: '8c9fdebb-0c83-42ae-a539-501c05abcfa8', variant_id: '3336e1cc-3dd8-4c73-862d-833194e7a006', sku: '10034', name: 'Jamón', price: 1.00, available: true },
            { id: 'huevo', item_id: '97d1af00-3c2c-440f-8db8-d2bc92751f1c', variant_id: 'd2eba247-bc3d-4dde-bd82-5b0939caab7b', sku: '10036', name: 'Huevo', price: 1.50, available: true },
            { id: 'tocino', item_id: 'ac3628aa-5732-4803-8e67-88927526a568', variant_id: '2bedb4bb-8709-4b3d-9eca-3ef50bb5cccb', sku: '10035', name: 'Tocino', price: 2.00, available: true }
        ],
        masterStockGroups: [
            { id: 'grp_promociones', name: 'Promociones (Alas)', masterVariantId: 'df1e6c91-9f19-4dbd-a065-b4b021fc4843', manualOutOfStock: false, variants: ['df1e6c91-9f19-4dbd-a065-b4b021fc4843'] },
            { id: 'grp_hamburguesas', name: 'Hamburguesas (Carne)', masterVariantId: '6d767227-33a4-4738-9bad-426be19362fe', manualOutOfStock: false, variants: ['6d767227-33a4-4738-9bad-426be19362fe', '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', '6443424f-c859-44b2-81df-14b2259a1f5e', '4e4fef97-e474-4399-bd9c-a3018cc5f08e', 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', 'b34af2ce-02d8-426a-ab23-44a9c4b1f845'] },
            { id: 'grp_pollo', name: 'Pollo Deshilachado', masterVariantId: 'c577b91a-a10f-4e1e-9911-a1f73b9f6c97', manualOutOfStock: false, variants: ['c577b91a-a10f-4e1e-9911-a1f73b9f6c97', 'e4d1fbbf-1503-4317-94cb-acc75b1c913a', '060095b1-6642-4cb1-ae5a-2d2cd7c96334', '6906ccd6-cc74-4042-8601-e646c1129131', 'f1f36672-bc7c-41de-9961-ddd068380e4d', '9f238682-be0f-4853-91be-2824471e0ab0', '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', 'c526cfb0-c85d-466a-aa62-8b9ee2629d69'] },
            { id: 'grp_filetes', name: 'Filetes de Pollo', masterVariantId: '08d0e755-36f3-4253-b262-56430ea37cad', manualOutOfStock: false, variants: ['08d0e755-36f3-4253-b262-56430ea37cad', '8e2a954c-1719-4be3-99b2-f220b80f40a8', '2bfa628d-bdfb-468b-aafa-ac351846b7de', 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea'] },
            { id: 'grp_crispy', name: 'Pollo Crispy', masterVariantId: '5262de55-d870-46c2-aad9-25a7a096d8a0', manualOutOfStock: false, variants: ['5262de55-d870-46c2-aad9-25a7a096d8a0', '57bf1904-69f2-427a-8731-afe078274a6d', 'd94b34ba-f604-44b9-b76c-08286adaff5e', '54ca71a0-bb6d-44de-b3a3-af21b46924c3', '60bc53aa-36cd-4650-9707-c082244fbf7c'] },
            { id: 'grp_chorizos', name: 'Chorizos', masterVariantId: '8fdde459-5909-49a4-a2c9-eacbec3efa18', manualOutOfStock: false, variants: ['8fdde459-5909-49a4-a2c9-eacbec3efa18', '9be1375d-d1ca-4ada-ab6d-55218b8a792d', '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', '6059ac60-e268-4809-9060-4253c62c24db', 'bc323c7e-358a-4853-855b-9e2f2beb1618'] },
            { id: 'grp_pecho_broaster', name: 'Pecho Broaster', masterVariantId: 'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', manualOutOfStock: false, variants: ['ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', '47fd3400-d49d-49fa-9f9b-b749a89414bd'] },
            { id: 'grp_encuentro_broaster', name: 'Encuentro Broaster', masterVariantId: '7433770a-524e-46b1-b07d-1c6f4c2a7eb1', manualOutOfStock: false, variants: ['7433770a-524e-46b1-b07d-1c6f4c2a7eb1', '8d4008bc-a051-420f-bf69-d46e33878809'] },
            { id: 'grp_ala_broaster', name: 'Ala Broaster', masterVariantId: '8056dee7-40f6-4e43-bce8-a3344060997c', manualOutOfStock: false, variants: ['8056dee7-40f6-4e43-bce8-a3344060997c', '2177ce33-0135-45b7-9a43-60167b803e1f'] },
            { id: 'grp_muzlo_broaster', name: 'Muzlo Broaster', masterVariantId: '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', manualOutOfStock: false, variants: ['7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', '139e2101-3055-4fb7-9413-b33432f8e55f'] }
        ],
        categories: JSON.parse(JSON.stringify(DEFAULT_ADMIN_MENU))
    };
}

async function callApi(endpoint, options = {}) {
    const isLocalHost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.protocol === 'file:';

    const urls = isLocalHost
        ? [
            `http://localhost/MICHO/VERSION_2/loyverse.php?endpoint=${endpoint}`,
            `loyverse.php?endpoint=${endpoint}`,
            `/api/${endpoint}`
          ]
        : [
            `/api/${endpoint}`,
            `loyverse.php?endpoint=${endpoint}`
          ];

    for (const url of urls) {
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            if (!text || text.trim().startsWith('<?php') || text.trim().startsWith('<')) {
                continue;
            }
            const json = JSON.parse(text);
            return { ok: res.ok, status: res.status, data: json };
        } catch (err) {
            // Intentar siguiente URL
        }
    }

    // Fallback local si se abre desde file:// y Apache estuviera apagado
    const STORAGE_CFG = 'micho_burguer_live_config_v1';
    const STORAGE_AUTH = 'micho_burguer_admin_auth_v1';
    let savedCfg = null;
    try {
        savedCfg = JSON.parse(localStorage.getItem(STORAGE_CFG) || 'null');
    } catch (e) {}
    const activeCfg = savedCfg || getDefaultConfigObject();

    const body = options.body ? JSON.parse(options.body) : {};
    let auth = { username: 'admin', passwordHash: 'micho2026' };
    try {
        const savedAuth = JSON.parse(localStorage.getItem(STORAGE_AUTH) || 'null');
        if (savedAuth && savedAuth.username) auth = savedAuth;
    } catch (e) {}

    const inUser = String(body.username || '').trim().toLowerCase();
    const inPass = String(body.password || '');
    const validPass = (inPass === auth.passwordHash) || (auth.passwordHash === 'micho2026' && (inPass === 'admin' || inPass === '123456'));

    if (inUser !== auth.username.toLowerCase() || !validPass) {
        return {
            ok: false,
            status: 401,
            data: { success: false, error: 'Usuario o contraseña incorrectos.' }
        };
    }

    if (body.action === 'login') {
        return {
            ok: true,
            status: 200,
            data: {
                success: true,
                config: activeCfg,
                loyverseCatalog: []
            }
        };
    }

    if (body.action === 'save' || body.action === 'quick_schedule') {
        const updated = body.config ? { ...activeCfg, ...body.config } : { ...activeCfg, schedule: { ...activeCfg.schedule, ...(body.schedule || {}) } };
        updated.updatedAt = new Date().toISOString();
        if (body.newPassword && String(body.newPassword).trim().length >= 4) {
            auth.passwordHash = String(body.newPassword).trim();
        }
        if (body.newUsername && String(body.newUsername).trim().length >= 3) {
            auth.username = String(body.newUsername).trim();
            updated.adminUser = auth.username;
        }
        try {
            localStorage.setItem(STORAGE_CFG, JSON.stringify(updated));
            localStorage.setItem(STORAGE_AUTH, JSON.stringify(auth));
        } catch (e) {}

        return {
            ok: true,
            status: 200,
            data: {
                success: true,
                config: updated
            }
        };
    }

    return { ok: false, status: 500, data: { success: false, error: 'No se pudo conectar.' } };
}

const SESSION_KEY = 'micho_admin_session_v1';
const LIVE_CONFIG_CACHE_KEY = 'micho_burguer_live_config_v1';

let adminCredentials = { username: '', password: '' };
let appConfig = null;
let loyverseCatalog = [];
let loyverseStockMap = {};
let hasUnsavedChanges = false;

// Referencias DOM
const loginScreen = document.getElementById('login-screen');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');
const loginError = document.getElementById('login-error');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const logoutBtn = document.getElementById('logout-btn');
const btnSyncLoyverse = document.getElementById('btn-sync-loyverse');

const categoriesAdminList = document.getElementById('categories-admin-list');
const adminSearchInput = document.getElementById('admin-search-input');
const masterGroupsGrid = document.getElementById('master-groups-grid');
const cremasAdminGrid = document.getElementById('cremas-admin-grid');
const extrasAdminGrid = document.getElementById('extras-admin-grid');

const unsavedDot = document.getElementById('unsaved-dot');
const saveStatusLabel = document.getElementById('save-status-label');
const btnSaveAll = document.getElementById('btn-save-all');
const toastMsg = document.getElementById('toast-msg');

// Modal de Producto
const productModalBackdrop = document.getElementById('product-modal-backdrop');
const productModalForm = document.getElementById('product-modal-form');
const productModalTitle = document.getElementById('product-modal-title');
const prodEditCatIdx = document.getElementById('prod-edit-cat-idx');
const prodEditItemIdx = document.getElementById('prod-edit-item-idx');
const prodCatSelectWrapper = document.getElementById('prod-cat-select-wrapper');
const prodCatSelect = document.getElementById('prod-cat-select');
const prodName = document.getElementById('prod-name');
const prodPrice = document.getElementById('prod-price');
const prodDesc = document.getElementById('prod-desc');
const prodBadge = document.getElementById('prod-badge');
const prodSku = document.getElementById('prod-sku');
const prodLoyverseSelect = document.getElementById('prod-loyverse-select');
const prodAllowsPotato = document.getElementById('prod-allows-potato');
const prodIsBeverage = document.getElementById('prod-is-beverage');

function showToast(text, isError = false) {
    if (!toastMsg) return;
    toastMsg.textContent = text;
    toastMsg.style.borderLeftColor = isError ? '#ef4444' : '#22c55e';
    toastMsg.style.display = 'block';
    setTimeout(() => {
        toastMsg.style.display = 'none';
    }, 3200);
}

let autoSaveTimer = null;
const configBroadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('micho_config_sync') : null;

function broadcastLiveConfig(cfg) {
    if (!cfg) return;
    try {
        localStorage.setItem(LIVE_CONFIG_CACHE_KEY, JSON.stringify(cfg));
    } catch (e) {}
    if (configBroadcast) {
        try {
            configBroadcast.postMessage({ config: cfg, timestamp: Date.now() });
        } catch (e) {}
    }
}

function markDirty(dirty = true) {
    hasUnsavedChanges = dirty;
    if (dirty) {
        unsavedDot.classList.add('dirty');
        saveStatusLabel.textContent = '⏳ Guardando automáticamente en Carta y Loyverse POS...';
        if (appConfig) {
            appConfig.updatedAt = new Date().toISOString();
            broadcastLiveConfig(appConfig);
        }
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveAllChanges(true);
        }, 450);
    } else {
        unsavedDot.classList.remove('dirty');
        saveStatusLabel.textContent = '✅ Todo sincronizado con la carta y Loyverse POS';
    }
}

async function updateLoyverseStockDirect(variantId, newStock) {
    if (!variantId) return;
    try {
        const { ok, data } = await callApi('config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_loyverse_stock',
                username: adminCredentials.username,
                password: adminCredentials.password,
                variant_id: variantId,
                stock: Number(newStock)
            })
        });
        if (ok && data && data.success) {
            loyverseStockMap[variantId] = Number(newStock);
            const catItem = loyverseCatalog.find(c => c.variant_id === variantId);
            if (catItem) catItem.in_stock = Number(newStock);
            showToast(`📦 Stock en Loyverse POS actualizado a ${Number(newStock)} unid.`);
        } else {
            showToast('❌ No se pudo actualizar el stock en Loyverse POS', true);
        }
    } catch (e) {
        showToast('❌ Error de conexión al actualizar stock en Loyverse', true);
    }
}

async function attemptLogin(username, password, silent = false) {
    if (!silent) {
        loginError.style.display = 'none';
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = '⏳ Verificando...';
    }

    try {
        const { ok, data } = await callApi('config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                username,
                password
            })
        });

        if (ok && data && data.success && data.config) {
            adminCredentials = { username, password };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminCredentials));
            appConfig = data.config;
            loyverseCatalog = Array.isArray(data.loyverseCatalog) ? data.loyverseCatalog : [];
            loyverseStockMap = data.loyverseStockMap || {};

            loginUser.value = '';
            loginPass.value = '';
            loginScreen.style.display = 'none';
            adminApp.style.display = 'block';
            renderAllAdminSections();
            markDirty(false);
            return true;
        } else {
            if (!silent) {
                loginError.textContent = (data && data.error) || 'Usuario o contraseña incorrectos.';
                loginError.style.display = 'block';
            }
            sessionStorage.removeItem(SESSION_KEY);
            return false;
        }
    } catch (e) {
        if (!silent) {
            loginError.textContent = 'Error de conexión con el servidor.';
            loginError.style.display = 'block';
        }
        return false;
    } finally {
        if (!silent) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = '🔐 Ingresar al Panel';
        }
    }
}

function renderAllAdminSections() {
    if (!appConfig) return;
    renderCategoriesAndProducts();
    renderMasterGroups();
    renderCremas();
    renderExtras();
    renderScheduleSection();
    renderSecuritySection();
}

// ============================================================================
// 1. RENDERIZAR CATEGORÍAS Y PLATOS
// ============================================================================
function renderCategoriesAndProducts() {
    if (!categoriesAdminList) return;
    const query = (adminSearchInput?.value || '').trim().toLowerCase();
    categoriesAdminList.innerHTML = '';

    const categories = appConfig.categories || [];

    categories.forEach((cat, catIdx) => {
        const items = cat.items || [];
        const matchingItems = items
            .map((it, itemIdx) => ({ it, itemIdx }))
            .filter(({ it }) => {
                if (!query) return true;
                return (it.name || '').toLowerCase().includes(query) ||
                       (it.desc || '').toLowerCase().includes(query) ||
                       (cat.name || '').toLowerCase().includes(query);
            });

        if (query && matchingItems.length === 0) return;

        const block = document.createElement('div');
        block.className = `category-block ${cat.active === false ? 'cat-hidden' : ''}`;

        const header = document.createElement('div');
        header.className = 'category-block-header';
        header.innerHTML = `
            <div class="category-block-title">
                <span>${cat.icon || '🍽️'}</span>
                <span>${cat.name}</span>
                <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;">(${items.length} platos)</span>
                ${cat.active === false ? '<span class="badge-pill" style="background:#fee2e2;color:#b91c1c;">Categoría Oculta</span>' : ''}
            </div>
            <div class="category-block-actions">
                <button type="button" class="icon-btn btn-add-item-cat" style="background:#dcfce7;color:#15803d;border-color:#86efac;">+ Agregar Plato aquí</button>
                <button type="button" class="icon-btn btn-edit-cat">✏️ Editar</button>
                <button type="button" class="icon-btn btn-toggle-cat">${cat.active === false ? '👁️ Mostrar' : '🙈 Ocultar'}</button>
                <button type="button" class="icon-btn btn-up-cat" ${catIdx === 0 ? 'disabled' : ''}>⬆️</button>
                <button type="button" class="icon-btn btn-down-cat" ${catIdx === categories.length - 1 ? 'disabled' : ''}>⬇️</button>
                <button type="button" class="icon-btn btn-del-cat" style="color:#b91c1c;">🗑️</button>
            </div>
        `;

        // Eventos de Categoría
        header.querySelector('.btn-add-item-cat').onclick = () => openProductModal(catIdx, -1);
        header.querySelector('.btn-edit-cat').onclick = () => editCategoryPrompt(catIdx);
        header.querySelector('.btn-toggle-cat').onclick = () => {
            cat.active = cat.active === false ? true : false;
            markDirty();
            renderCategoriesAndProducts();
        };
        header.querySelector('.btn-up-cat').onclick = () => {
            if (catIdx > 0) {
                const tmp = categories[catIdx - 1];
                categories[catIdx - 1] = categories[catIdx];
                categories[catIdx] = tmp;
                markDirty();
                renderCategoriesAndProducts();
            }
        };
        header.querySelector('.btn-down-cat').onclick = () => {
            if (catIdx < categories.length - 1) {
                const tmp = categories[catIdx + 1];
                categories[catIdx + 1] = categories[catIdx];
                categories[catIdx] = tmp;
                markDirty();
                renderCategoriesAndProducts();
            }
        };
        header.querySelector('.btn-del-cat').onclick = () => {
            if (confirm(`¿Seguro que deseas eliminar la categoría "${cat.name}" y todos sus platos?`)) {
                categories.splice(catIdx, 1);
                markDirty();
                renderCategoriesAndProducts();
            }
        };

        block.appendChild(header);

        const table = document.createElement('table');
        table.className = 'items-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Plato / Código Loyverse</th>
                    <th style="width: 120px;">Precio (S/)</th>
                    <th style="width: 185px;">Stock Web y Loyverse POS</th>
                    <th style="width: 110px;">Visibilidad</th>
                    <th style="width: 170px;">Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        matchingItems.forEach(({ it, itemIdx }) => {
            const tr = document.createElement('tr');
            if (it.active === false) tr.className = 'item-row-hidden';

            const isOut = it.manualOutOfStock === true;
            const badgeHtml = it.badge ? `<span class="badge-pill">${it.badge}</span>` : '';
            const skuText = it.sku ? `#${it.sku}` : 'Auto';
            const skuBadgeHtml = `<span class="badge-pill" style="background:#e2e8f0;color:#1e293b;border:1px solid #cbd5e1;" title="Código propio (SKU) vinculado 1 a 1 en Loyverse POS">🏷️ Cód. ${skuText}</span>`;

            const loyEntry = loyverseCatalog.find(c => c.variant_id === it.variant_id);
            const hasStockRecord = it.variant_id && (Object.prototype.hasOwnProperty.call(loyverseStockMap, it.variant_id) || (loyEntry && loyEntry.track_stock));
            const currentPosStock = hasStockRecord
                ? Number(loyverseStockMap[it.variant_id] ?? loyEntry?.in_stock ?? 0)
                : null;

            const posStockControlHtml = it.variant_id
                ? `<div style="display:flex;align-items:center;gap:0.3rem;margin-top:0.35rem;font-size:0.75rem;color:#475569;">
                       <span title="Inventario actual en Loyverse POS">📦 POS:</span>
                       <input type="number" step="1" class="inline-pos-stock-input" style="width:62px;padding:0.15rem 0.35rem;border:1px solid #cbd5e1;border-radius:6px;font-weight:700;font-size:0.76rem;" value="${currentPosStock !== null ? currentPosStock : ''}" placeholder="∞" title="Cantidad en inventario de Loyverse POS (escribe un número para actualizar en Loyverse)">
                   </div>`
                : '';

            tr.innerHTML = `
                <td>
                    <div class="item-name-cell" style="display:flex;align-items:center;flex-wrap:wrap;gap:0.25rem;">
                        <span>${it.name}</span>
                        ${skuBadgeHtml}
                        ${badgeHtml}
                    </div>
                    <div class="item-desc-cell">${it.desc || 'Sin descripción'}</div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:0.25rem;">
                        <span style="font-weight:700;color:#64748b;">S/</span>
                        <input type="number" step="0.10" min="0" class="inline-price-input" value="${Number(it.price || 0).toFixed(2)}">
                    </div>
                </td>
                <td>
                    <button type="button" class="stock-pill-btn ${isOut ? 'out-stock' : 'in-stock'}">
                        ${isOut ? '🔴 Agotado' : '🟢 Disponible'}
                    </button>
                    ${posStockControlHtml}
                </td>
                <td>
                    <button type="button" class="stock-pill-btn btn-vis-item" style="${it.active === false ? 'background:#fef3c7;color:#b45309;border:1px solid #f59e0b;' : 'background:#e0f2fe;color:#0369a1;'}">
                        ${it.active === false ? '🙈 Oculto en Carta' : '👁️ Visible en Carta'}
                    </button>
                </td>
                <td>
                    <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
                        <button type="button" class="icon-btn btn-edit-item" title="Editar plato y código Loyverse">✏️</button>
                        <button type="button" class="icon-btn btn-up-item" ${itemIdx === 0 ? 'disabled' : ''} title="Subir">⬆️</button>
                        <button type="button" class="icon-btn btn-down-item" ${itemIdx === items.length - 1 ? 'disabled' : ''} title="Bajar">⬇️</button>
                        <button type="button" class="icon-btn btn-del-item" style="color:#b91c1c;" title="Eliminar">🗑️</button>
                    </div>
                </td>
            `;

            // Cambio rápido de precio en línea (actualiza Carta y Loyverse POS)
            const priceInput = tr.querySelector('.inline-price-input');
            priceInput.onchange = (e) => {
                const val = parseFloat(e.target.value);
                if (!Number.isNaN(val) && val >= 0) {
                    it.price = val;
                    e.target.value = val.toFixed(2);
                    markDirty();
                }
            };

            // Cambio directo de stock numérico en Loyverse POS
            const posStockInput = tr.querySelector('.inline-pos-stock-input');
            if (posStockInput) {
                posStockInput.onchange = async (e) => {
                    const raw = e.target.value.trim();
                    if (raw === '') return;
                    const newStock = parseFloat(raw);
                    if (!Number.isNaN(newStock)) {
                        it.manualOutOfStock = newStock <= 0;
                        markDirty();
                        renderCategoriesAndProducts();
                        await updateLoyverseStockDirect(it.variant_id, newStock);
                    }
                };
            }

            // Toggle Disponible / Agotado
            tr.querySelector('.stock-pill-btn').onclick = async () => {
                it.manualOutOfStock = !it.manualOutOfStock;
                markDirty();
                renderCategoriesAndProducts();
                // Si se habilita como Disponible y en Loyverse tenía stock <= 0, reponer a 20 en Loyverse
                if (!it.manualOutOfStock && it.variant_id && currentPosStock !== null && currentPosStock <= 0) {
                    await updateLoyverseStockDirect(it.variant_id, 20);
                    renderCategoriesAndProducts();
                }
            };

            // Toggle Visible / Oculto
            tr.querySelector('.btn-vis-item').onclick = () => {
                it.active = it.active === false ? true : false;
                markDirty();
                renderCategoriesAndProducts();
            };

            // Editar completo
            tr.querySelector('.btn-edit-item').onclick = () => openProductModal(catIdx, itemIdx);

            // Reordenar plato
            tr.querySelector('.btn-up-item').onclick = () => {
                if (itemIdx > 0) {
                    const tmp = items[itemIdx - 1];
                    items[itemIdx - 1] = items[itemIdx];
                    items[itemIdx] = tmp;
                    markDirty();
                    renderCategoriesAndProducts();
                }
            };
            tr.querySelector('.btn-down-item').onclick = () => {
                if (itemIdx < items.length - 1) {
                    const tmp = items[itemIdx + 1];
                    items[itemIdx + 1] = items[itemIdx];
                    items[itemIdx] = tmp;
                    markDirty();
                    renderCategoriesAndProducts();
                }
            };

            // Eliminar plato
            tr.querySelector('.btn-del-item').onclick = () => {
                if (confirm(`¿Seguro que deseas eliminar "${it.name}" de la carta y Loyverse POS?`)) {
                    items.splice(itemIdx, 1);
                    markDirty();
                    renderCategoriesAndProducts();
                }
            };

            tbody.appendChild(tr);
        });

        block.appendChild(table);
        categoriesAdminList.appendChild(block);
    });
}

function editCategoryPrompt(catIdx) {
    const categories = appConfig.categories || [];
    if (catIdx < 0) {
        const name = prompt('Nombre de la nueva categoría (ej: Combos Familiares, Bebidas Calientes):');
        if (!name || !name.trim()) return;
        const icon = prompt('Emoji o ícono para la categoría:', '🍔') || '🍽️';
        const id = 'cat_' + Date.now();
        categories.push({
            id,
            name: name.trim(),
            icon: icon.trim(),
            active: true,
            items: []
        });
        markDirty();
        renderCategoriesAndProducts();
    } else {
        const cat = categories[catIdx];
        if (!cat) return;
        const newName = prompt('Editar nombre de la categoría:', cat.name);
        if (newName === null) return;
        const newIcon = prompt('Editar emoji/ícono de la categoría:', cat.icon || '🍽️');
        if (newName.trim()) cat.name = newName.trim();
        if (newIcon !== null && newIcon.trim()) cat.icon = newIcon.trim();
        markDirty();
        renderCategoriesAndProducts();
    }
}

function openProductModal(catIdx = 0, itemIdx = -1) {
    const categories = appConfig.categories || [];
    if (categories.length === 0) {
        alert('Primero crea al menos una categoría.');
        return;
    }

    // Poblar selector de categorías
    prodCatSelect.innerHTML = '';
    categories.forEach((c, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${c.icon || '🍽️'} ${c.name}`;
        prodCatSelect.appendChild(opt);
    });

    // Poblar selector de Loyverse POS mostrando el SKU propio de cada ítem
    prodLoyverseSelect.innerHTML = `<option value="NEW_LOYVERSE_ITEM">✨ Crear nuevo producto propio en Loyverse POS</option>`;
    loyverseCatalog.forEach(loy => {
        const opt = document.createElement('option');
        opt.value = loy.variant_id;
        const skuTag = loy.sku ? `[#${loy.sku}] ` : '';
        opt.textContent = `🔗 ${skuTag}${loy.name} (S/ ${Number(loy.price || 0).toFixed(2)})`;
        prodLoyverseSelect.appendChild(opt);
    });

    prodEditCatIdx.value = catIdx;
    prodEditItemIdx.value = itemIdx;
    prodCatSelect.value = catIdx;

    if (itemIdx >= 0 && categories[catIdx] && categories[catIdx].items[itemIdx]) {
        const item = categories[catIdx].items[itemIdx];
        productModalTitle.textContent = `✏️ Editar: ${item.name}`;
        prodCatSelectWrapper.style.display = 'block';
        prodName.value = item.name || '';
        prodPrice.value = Number(item.price || 0).toFixed(2);
        prodDesc.value = item.desc || '';
        prodBadge.value = item.badge || '';
        if (prodSku) prodSku.value = item.sku || '';
        prodAllowsPotato.checked = item.allowsPotatoChoice === true;
        prodIsBeverage.checked = item.isBeverage === true;

        if (item.variant_id) {
            const exists = Array.from(prodLoyverseSelect.options).some(o => o.value === item.variant_id);
            if (!exists) {
                const customOpt = document.createElement('option');
                customOpt.value = item.variant_id;
                customOpt.textContent = `🔗 Vinculado actual (${item.sku ? '#' + item.sku : item.variant_id.slice(0, 8) + '...'})`;
                prodLoyverseSelect.appendChild(customOpt);
            }
            prodLoyverseSelect.value = item.variant_id;
        } else {
            prodLoyverseSelect.value = 'NEW_LOYVERSE_ITEM';
        }
    } else {
        productModalTitle.textContent = '🍔 Agregar Nuevo Plato';
        prodCatSelectWrapper.style.display = 'block';
        prodName.value = '';
        prodPrice.value = '';
        prodDesc.value = '';
        prodBadge.value = '';
        if (prodSku) prodSku.value = '';
        prodAllowsPotato.checked = true;
        prodIsBeverage.checked = false;
        prodLoyverseSelect.value = 'NEW_LOYVERSE_ITEM';
    }

    productModalBackdrop.classList.add('active');
    prodName.focus();
}

function closeProductModal() {
    productModalBackdrop.classList.remove('active');
}

// ============================================================================
// 2. RENDERIZAR GRUPOS MAESTROS, CREMAS Y ADICIONALES
// ============================================================================
function renderMasterGroups() {
    const sideOptionsGrid = document.getElementById('side-options-grid');
    if (sideOptionsGrid) {
        sideOptionsGrid.innerHTML = '';
        appConfig.sideOptions = appConfig.sideOptions || { ensaladaAvailable: true, papaHiloAvailable: true };
        const sideItems = [
            {
                key: 'ensaladaAvailable',
                title: '🥗 Ensalada Fresca',
                desc: 'Si se apaga, los platos se pedirán automáticamente "Sin ensalada".'
            },
            {
                key: 'papaHiloAvailable',
                title: '🥔 Papas al Hilo (y Mixtas)',
                desc: 'Si se apaga, solo quedará habilitada la opción "Papas Fritas".'
            }
        ];

        sideItems.forEach(item => {
            const isAvail = appConfig.sideOptions[item.key] !== false;
            const card = document.createElement('div');
            card.className = `admin-mini-card ${!isAvail ? 'depleted' : ''}`;
            card.innerHTML = `
                <div>
                    <div style="font-weight:800;font-size:0.94rem;">${item.title}</div>
                    <div style="font-size:0.75rem;color:#64748b;">${item.desc}</div>
                </div>
                <button type="button" class="stock-pill-btn ${!isAvail ? 'out-stock' : 'in-stock'}">
                    ${!isAvail ? '🔴 Agotado' : '🟢 Disponible'}
                </button>
            `;
            card.querySelector('button').onclick = () => {
                appConfig.sideOptions[item.key] = !isAvail;
                markDirty();
                renderMasterGroups();
            };
            sideOptionsGrid.appendChild(card);
        });
    }

    if (!masterGroupsGrid) return;
    masterGroupsGrid.innerHTML = '';
    const groups = appConfig.masterStockGroups || [];

    groups.forEach((grp) => {
        const isOut = grp.manualOutOfStock === true;
        const card = document.createElement('div');
        card.className = `admin-mini-card ${isOut ? 'depleted' : ''}`;
        card.innerHTML = `
            <div>
                <div style="font-weight:800;font-size:0.92rem;">${grp.name}</div>
                <div style="font-size:0.75rem;color:#64748b;">Afecta a ${(grp.variants || []).length} variante(s)</div>
            </div>
            <button type="button" class="stock-pill-btn ${isOut ? 'out-stock' : 'in-stock'}">
                ${isOut ? '🔴 Agotado' : '🟢 Activo'}
            </button>
        `;
        card.querySelector('button').onclick = () => {
            grp.manualOutOfStock = !grp.manualOutOfStock;
            markDirty();
            renderMasterGroups();
        };
        masterGroupsGrid.appendChild(card);
    });
}

function renderCremas() {
    if (!cremasAdminGrid) return;
    cremasAdminGrid.innerHTML = '';
    const cremas = appConfig.cremas || [];
    const rule = appConfig.cremasRule || { maxFree: 9, extraPrice: 0.50 };
    const maxFreeInput = document.getElementById('cremas-max-free');
    const extraPriceInput = document.getElementById('cremas-extra-price');
    if (maxFreeInput) maxFreeInput.value = rule.maxFree !== undefined ? rule.maxFree : 9;
    if (extraPriceInput) extraPriceInput.value = Number(rule.extraPrice !== undefined ? rule.extraPrice : 0.50).toFixed(2);

    // Garantizar que MAYONESA siempre sea la primera y ACEITUNA la última
    cremas.sort((a, b) => {
        const ua = String(a.name || '').toUpperCase().trim();
        const ub = String(b.name || '').toUpperCase().trim();
        if (ua === 'MAYONESA' && ub !== 'MAYONESA') return -1;
        if (ub === 'MAYONESA' && ua !== 'MAYONESA') return 1;
        if (ua === 'ACEITUNA' && ub !== 'ACEITUNA') return 1;
        if (ub === 'ACEITUNA' && ua !== 'ACEITUNA') return -1;
        return 0;
    });

    cremas.forEach((c, idx) => {
        const isAvail = c.available !== false;
        const card = document.createElement('div');
        card.className = `admin-mini-card ${!isAvail ? 'depleted' : ''}`;
        card.innerHTML = `
            <div style="font-weight:800;font-size:0.92rem;display:flex;align-items:center;gap:0.35rem;">
                <span class="badge-pill" style="background:#e2e8f0;color:#1e293b;margin-left:0;">#${idx + 1}</span>
                <span>🥫 ${c.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.3rem;">
                <button type="button" class="stock-pill-btn ${isAvail ? 'in-stock' : 'out-stock'}">
                    ${isAvail ? '🟢 Disponible' : '🔴 Agotada'}
                </button>
                <button type="button" class="icon-btn btn-up-crema" ${idx <= 0 ? 'disabled' : ''} title="Subir orden en comanda">⬆️</button>
                <button type="button" class="icon-btn btn-down-crema" ${idx >= cremas.length - 1 ? 'disabled' : ''} title="Bajar orden en comanda">⬇️</button>
                <button type="button" class="icon-btn btn-del-crema" style="color:#b91c1c;" title="Eliminar crema">🗑️</button>
            </div>
        `;
        card.querySelector('.stock-pill-btn').onclick = () => {
            c.available = !isAvail;
            markDirty();
            renderCremas();
        };
        card.querySelector('.btn-up-crema').onclick = () => {
            if (idx > 0) {
                const tmp = cremas[idx - 1];
                cremas[idx - 1] = cremas[idx];
                cremas[idx] = tmp;
                markDirty();
                renderCremas();
            }
        };
        card.querySelector('.btn-down-crema').onclick = () => {
            if (idx < cremas.length - 1) {
                const tmp = cremas[idx + 1];
                cremas[idx + 1] = cremas[idx];
                cremas[idx] = tmp;
                markDirty();
                renderCremas();
            }
        };
        card.querySelector('.btn-del-crema').onclick = () => {
            if (confirm(`¿Eliminar la crema "${c.name}"?`)) {
                cremas.splice(idx, 1);
                markDirty();
                renderCremas();
            }
        };
        cremasAdminGrid.appendChild(card);
    });
}

function renderExtras() {
    if (!extrasAdminGrid) return;
    extrasAdminGrid.innerHTML = '';
    const extras = appConfig.extras || [];

    extras.forEach((ex, idx) => {
        const isAvail = ex.available !== false;
        const skuBadge = `<span class="badge-pill" style="background:#e2e8f0;color:#1e293b;border:1px solid #cbd5e1;font-size:0.7rem;" title="Código propio (SKU) en Loyverse POS">🏷️ Cód. #${ex.sku || 'Auto'}</span>`;
        const card = document.createElement('div');
        card.className = `admin-mini-card ${!isAvail ? 'depleted' : ''}`;
        card.innerHTML = `
            <div>
                <div style="font-weight:800;font-size:0.92rem;display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
                    <span>🧀 ${ex.name}</span>
                    ${skuBadge}
                </div>
                <div style="display:flex;align-items:center;gap:0.25rem;margin-top:0.25rem;">
                    <span style="font-size:0.78rem;color:#64748b;font-weight:700;">+S/</span>
                    <input type="number" step="0.10" min="0" class="inline-price-input" style="width:74px;padding:0.25rem 0.4rem;font-size:0.84rem;" value="${Number(ex.price || 0).toFixed(2)}">
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:0.4rem;">
                <button type="button" class="stock-pill-btn ${isAvail ? 'in-stock' : 'out-stock'}">
                    ${isAvail ? '🟢 Disponible' : '🔴 Agotado'}
                </button>
                <button type="button" class="icon-btn btn-del-extra" style="color:#b91c1c;" title="Eliminar adicional">🗑️</button>
            </div>
        `;
        card.querySelector('.inline-price-input').onchange = (e) => {
            const val = parseFloat(e.target.value);
            if (!Number.isNaN(val) && val >= 0) {
                ex.price = val;
                e.target.value = val.toFixed(2);
                markDirty();
            }
        };
        card.querySelector('.stock-pill-btn').onclick = () => {
            ex.available = !isAvail;
            markDirty();
            renderExtras();
        };
        card.querySelector('.btn-del-extra').onclick = () => {
            if (confirm(`¿Eliminar el adicional "${ex.name}" de la carta y Loyverse POS?`)) {
                extras.splice(idx, 1);
                markDirty();
                renderExtras();
            }
        };
        extrasAdminGrid.appendChild(card);
    });
}

// ============================================================================
// 3. RENDERIZAR HORARIO Y CONTROL DE APERTURA/CIERRE
// ============================================================================
function renderScheduleSection() {
    const sched = appConfig.schedule || {};
    const mode = sched.mode || 'auto';

    const btnAuto = document.getElementById('mode-btn-auto');
    const btnOpen = document.getElementById('mode-btn-open');
    const btnClosed = document.getElementById('mode-btn-closed');

    if (btnAuto) btnAuto.className = `mode-card-btn ${mode === 'auto' ? 'active-auto' : ''}`;
    if (btnOpen) btnOpen.className = `mode-card-btn ${mode === 'open' ? 'active-open' : ''}`;
    if (btnClosed) btnClosed.className = `mode-card-btn ${mode === 'closed' ? 'active-closed' : ''}`;

    // Actualizar también la Barra Maestra Superior (visible en todas las pestañas)
    const topBtnOpen = document.getElementById('top-btn-open');
    const topBtnClosed = document.getElementById('top-btn-closed');
    const topBtnAuto = document.getElementById('top-btn-auto');
    const liveBadge = document.getElementById('live-kitchen-badge');
    const liveDetail = document.getElementById('live-kitchen-detail');

    if (topBtnOpen && topBtnClosed && topBtnAuto) {
        topBtnOpen.style.background = mode === 'open' ? '#16a34a' : '#fff';
        topBtnOpen.style.color = mode === 'open' ? '#fff' : '#0f172a';
        topBtnOpen.style.borderColor = mode === 'open' ? '#16a34a' : '#cbd5e1';

        topBtnClosed.style.background = mode === 'closed' ? '#dc2626' : '#fff';
        topBtnClosed.style.color = mode === 'closed' ? '#fff' : '#0f172a';
        topBtnClosed.style.borderColor = mode === 'closed' ? '#dc2626' : '#cbd5e1';

        topBtnAuto.style.background = mode === 'auto' ? '#2563eb' : '#fff';
        topBtnAuto.style.color = mode === 'auto' ? '#fff' : '#0f172a';
        topBtnAuto.style.borderColor = mode === 'auto' ? '#2563eb' : '#cbd5e1';
    }

    const openTime = sched.openTime || '18:30';
    const closeTime = sched.closeTime || '22:30';
    const openDays = Array.isArray(sched.openDays) ? sched.openDays.map(Number) : [1, 2, 3, 4, 5, 6];

    if (liveBadge && liveDetail) {
        if (mode === 'open') {
            liveBadge.style.background = '#dcfce7';
            liveBadge.style.color = '#15803d';
            liveBadge.textContent = '🟢 CARTA ABIERTA AHORA (Modo Abierto Manual)';
            liveDetail.textContent = 'Tu carta digital está recibiendo pedidos en este momento sin importar la hora.';
        } else if (mode === 'closed') {
            liveBadge.style.background = '#fee2e2';
            liveBadge.style.color = '#b91c1c';
            liveBadge.textContent = '🔴 CARTA CERRADA AHORA (Modo Cerrado Manual)';
            liveDetail.textContent = 'Los pedidos están bloqueados hasta que cambies a Abrir o Automático.';
        } else {
            // Calcular si está dentro del horario en Lima
            const now = new Date();
            const limaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
            const day = limaDate.getDay();
            const curMins = limaDate.getHours() * 60 + limaDate.getMinutes();
            const [oh, om] = openTime.split(':').map(Number);
            const [ch, cm] = closeTime.split(':').map(Number);
            const openMins = (oh || 0) * 60 + (om || 0);
            const closeMins = (ch || 0) * 60 + (cm || 0);
            const inHours = openMins <= closeMins
                ? (curMins >= openMins && curMins <= closeMins)
                : (curMins >= openMins || curMins <= closeMins);
            const isOpenNow = openDays.includes(day) && inHours;

            if (isOpenNow) {
                liveBadge.style.background = '#dcfce7';
                liveBadge.style.color = '#15803d';
                liveBadge.textContent = '🟢 CARTA ABIERTA POR HORARIO';
                liveDetail.textContent = `Dentro del horario automático (${openTime} a ${closeTime}).`;
            } else {
                liveBadge.style.background = '#fee2e2';
                liveBadge.style.color = '#b91c1c';
                liveBadge.textContent = `🔴 CARTA CERRADA POR HORARIO (${openTime} - ${closeTime})`;
                liveDetail.textContent = 'Estás fuera del horario programado. Para recibir pedidos ahorita, haz clic en "🟢 Abrir Carta Ahora" →';
            }
        }
    }

    document.getElementById('sched-open-time').value = openTime;
    document.getElementById('sched-close-time').value = closeTime;
    document.getElementById('sched-hours-label').value = sched.hoursLabel || '🕒 Lun - Sáb: 6:30 PM a 10:30 PM';
    document.getElementById('sched-est-mins').value = sched.estimatedTimeMins || 20;
    document.getElementById('sched-closed-msg').value = sched.customClosedMessage || '';

    document.querySelectorAll('#sched-days-chips .day-chip').forEach(chip => {
        const d = Number(chip.dataset.day);
        if (openDays.includes(d)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

function renderSecuritySection() {
    const secUser = document.getElementById('sec-username');
    if (secUser && appConfig.adminUser) {
        secUser.value = appConfig.adminUser;
    }
}

// ============================================================================
// 4. GUARDAR TODOS LOS CAMBIOS EN LA NUBE Y LOCAL (SIN CONDICIONES DE CARRERA)
// ============================================================================
let isSavingNow = false;
let pendingSaveRequest = false;

async function saveAllChanges(isAuto = false) {
    if (!appConfig) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }

    // Publicar inmediatamente en localStorage y BroadcastChannel para que otras pestañas lo vean en 0ms
    appConfig.updatedAt = new Date().toISOString();
    broadcastLiveConfig(appConfig);

    if (isSavingNow) {
        pendingSaveRequest = true;
        return;
    }

    isSavingNow = true;
    btnSaveAll.disabled = true;
    const origText = '💾 Guardar y Publicar Cambios';
    btnSaveAll.innerHTML = '⏳ Guardando y publicando...';

    const newUsername = document.getElementById('sec-username')?.value.trim() || adminCredentials.username;
    const newPassword = document.getElementById('sec-new-password')?.value.trim() || '';
    const snapshotToSend = JSON.parse(JSON.stringify(appConfig));

    try {
        const { ok, data } = await callApi('config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save',
                username: adminCredentials.username,
                password: adminCredentials.password,
                config: snapshotToSend,
                newUsername,
                newPassword
            })
        });

        if (ok && data && data.success) {
            if (newUsername) adminCredentials.username = newUsername;
            if (newPassword && newPassword.length >= 4) {
                adminCredentials.password = newPassword;
                document.getElementById('sec-new-password').value = '';
            }
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminCredentials));

            // Copiar de vuelta códigos SKU, item_id y variant_id asignados por Loyverse POS
            if (data.config && !pendingSaveRequest) {
                let idsUpdated = false;
                const respCats = data.config.categories || [];
                (appConfig.categories || []).forEach((cat, cIdx) => {
                    const rCat = respCats[cIdx];
                    if (!rCat) return;
                    (cat.items || []).forEach((it, iIdx) => {
                        const rIt = (rCat.items || [])[iIdx];
                        if (rIt && rIt.id === it.id) {
                            if (rIt.sku && rIt.sku !== it.sku) { it.sku = rIt.sku; idsUpdated = true; }
                            if (rIt.item_id && rIt.item_id !== it.item_id) { it.item_id = rIt.item_id; idsUpdated = true; }
                            if (rIt.variant_id && rIt.variant_id !== it.variant_id) { it.variant_id = rIt.variant_id; idsUpdated = true; }
                        }
                    });
                });
                const respExtras = data.config.extras || [];
                (appConfig.extras || []).forEach((ex, eIdx) => {
                    const rEx = respExtras[eIdx];
                    if (rEx && rEx.id === ex.id) {
                        if (rEx.sku && rEx.sku !== ex.sku) { ex.sku = rEx.sku; idsUpdated = true; }
                        if (rEx.item_id && rEx.item_id !== ex.item_id) { ex.item_id = rEx.item_id; idsUpdated = true; }
                        if (rEx.variant_id && rEx.variant_id !== ex.variant_id) { ex.variant_id = rEx.variant_id; idsUpdated = true; }
                    }
                });
                if (idsUpdated) {
                    renderCategoriesAndProducts();
                    renderExtras();
                }
            }

            broadcastLiveConfig(appConfig);
            if (!pendingSaveRequest) {
                markDirty(false);
                showToast('✅ ¡Cambios publicados en la Carta Digital y Loyverse POS!');
            }
        } else {
            showToast('❌ ' + ((data && data.error) || 'No se pudo guardar'), true);
        }
    } catch (e) {
        showToast('❌ Error de red al guardar cambios', true);
    } finally {
        isSavingNow = false;
        btnSaveAll.disabled = false;
        btnSaveAll.innerHTML = origText;
        if (pendingSaveRequest) {
            pendingSaveRequest = false;
            saveAllChanges(true);
        }
    }
}

function setupAdminListeners() {
    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await attemptLogin(loginUser.value.trim(), loginPass.value);
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_KEY);
        adminCredentials = { username: '', password: '' };
        if (loginUser) loginUser.value = '';
        if (loginPass) loginPass.value = '';
        window.location.reload();
    });

    // Botón de Sincronización Bidireccional con Loyverse POS
    if (btnSyncLoyverse) {
        btnSyncLoyverse.addEventListener('click', async () => {
            const origHtml = btnSyncLoyverse.innerHTML;
            btnSyncLoyverse.disabled = true;
            btnSyncLoyverse.innerHTML = '⏳ Sincronizando con Loyverse POS...';
            try {
                const { ok, data } = await callApi('config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'sync_loyverse',
                        username: adminCredentials.username,
                        password: adminCredentials.password
                    })
                });
                if (ok && data && data.success && data.config) {
                    appConfig = data.config;
                    loyverseCatalog = Array.isArray(data.loyverseCatalog) ? data.loyverseCatalog : loyverseCatalog;
                    loyverseStockMap = data.loyverseStockMap || loyverseStockMap;
                    broadcastLiveConfig(appConfig);
                    renderAllAdminSections();
                    markDirty(false);
                    showToast('🔄 ¡Catálogo, códigos propios (SKU) y stock sincronizados con Loyverse POS!');
                } else {
                    showToast('❌ No se pudo sincronizar con Loyverse POS', true);
                }
            } catch (e) {
                showToast('❌ Error de red al sincronizar con Loyverse POS', true);
            } finally {
                btnSyncLoyverse.disabled = false;
                btnSyncLoyverse.innerHTML = origHtml;
            }
        });
    }

    // Pestañas
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const pane = document.getElementById(btn.dataset.tab);
            if (pane) pane.classList.add('active');
        });
    });

    // Buscador de platos en admin
    adminSearchInput.addEventListener('input', () => {
        renderCategoriesAndProducts();
    });

    // Botones superiores de Categoría y Plato
    document.getElementById('btn-new-category').addEventListener('click', () => editCategoryPrompt(-1));
    document.getElementById('btn-new-product-top').addEventListener('click', () => openProductModal(0, -1));

    // Modal de Plato
    document.getElementById('close-product-modal').addEventListener('click', closeProductModal);
    document.getElementById('cancel-product-modal').addEventListener('click', closeProductModal);

    prodIsBeverage.addEventListener('change', () => {
        if (prodIsBeverage.checked) {
            prodAllowsPotato.checked = false;
        }
    });

    prodLoyverseSelect.addEventListener('change', () => {
        const selectedVar = prodLoyverseSelect.value;
        if (selectedVar && selectedVar !== 'NEW_LOYVERSE_ITEM') {
            const found = loyverseCatalog.find(c => c.variant_id === selectedVar);
            if (found && found.sku && prodSku) {
                prodSku.value = found.sku;
            }
        }
    });

    productModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const origCatIdx = parseInt(prodEditCatIdx.value, 10);
        const itemIdx = parseInt(prodEditItemIdx.value, 10);
        const targetCatIdx = parseInt(prodCatSelect.value, 10);

        const categories = appConfig.categories || [];
        if (!categories[targetCatIdx]) return;

        const existingItem = (itemIdx >= 0 && categories[origCatIdx]?.items[itemIdx])
            ? categories[origCatIdx].items[itemIdx]
            : null;
        const selectedVar = prodLoyverseSelect.value || 'NEW_LOYVERSE_ITEM';
        const matchedCatalogItem = loyverseCatalog.find(c => c.variant_id === selectedVar);

        const itemData = {
            id: existingItem?.id || ('plato_' + Date.now()),
            item_id: (selectedVar !== 'NEW_LOYVERSE_ITEM' && matchedCatalogItem?.item_id)
                ? matchedCatalogItem.item_id
                : (selectedVar === existingItem?.variant_id ? (existingItem?.item_id || '') : ''),
            variant_id: selectedVar,
            sku: prodSku ? prodSku.value.trim() : (existingItem?.sku || ''),
            name: prodName.value.trim(),
            price: parseFloat(prodPrice.value) || 0,
            desc: prodDesc.value.trim(),
            badge: prodBadge.value.trim(),
            active: existingItem ? existingItem.active !== false : true,
            manualOutOfStock: existingItem ? existingItem.manualOutOfStock === true : false,
            allowsPotatoChoice: prodAllowsPotato.checked,
            isBeverage: prodIsBeverage.checked
        };

        if (existingItem) {
            if (origCatIdx === targetCatIdx) {
                categories[origCatIdx].items[itemIdx] = itemData;
            } else {
                categories[origCatIdx].items.splice(itemIdx, 1);
                categories[targetCatIdx].items.push(itemData);
            }
        } else {
            categories[targetCatIdx].items.push(itemData);
        }

        closeProductModal();
        markDirty();
        renderCategoriesAndProducts();
    });

    // Regla de límite de cremas gratis y costo adicional
    const cremasMaxFreeInput = document.getElementById('cremas-max-free');
    const cremasExtraPriceInput = document.getElementById('cremas-extra-price');
    if (cremasMaxFreeInput) {
        cremasMaxFreeInput.addEventListener('change', (e) => {
            appConfig.cremasRule = appConfig.cremasRule || { maxFree: 9, extraPrice: 0.50 };
            appConfig.cremasRule.maxFree = Math.max(0, parseInt(e.target.value, 10) || 0);
            markDirty();
        });
    }
    if (cremasExtraPriceInput) {
        cremasExtraPriceInput.addEventListener('change', (e) => {
            appConfig.cremasRule = appConfig.cremasRule || { maxFree: 9, extraPrice: 0.50 };
            appConfig.cremasRule.extraPrice = Math.max(0, parseFloat(e.target.value) || 0);
            markDirty();
        });
    }

    // Agregar Crema (se inserta antes de ACEITUNA para mantener ACEITUNA siempre al final)
    document.getElementById('btn-add-crema').addEventListener('click', () => {
        const name = prompt('Nombre de la nueva crema (ej: ROCOTO, HUANCAÍNA, BBQ):');
        if (!name || !name.trim()) return;
        const clean = name.trim().toUpperCase();
        appConfig.cremas = appConfig.cremas || [];
        const newCrema = {
            id: 'cr_' + Date.now(),
            name: clean,
            label: name.trim(),
            available: true
        };
        const aceitunaIdx = appConfig.cremas.findIndex(c => String(c.name || '').toUpperCase().trim() === 'ACEITUNA');
        if (aceitunaIdx !== -1) {
            appConfig.cremas.splice(aceitunaIdx, 0, newCrema);
        } else {
            appConfig.cremas.push(newCrema);
        }
        markDirty();
        renderCremas();
    });

    // Agregar Adicional (Extra)
    document.getElementById('btn-add-extra').addEventListener('click', () => {
        const name = prompt('Nombre del nuevo adicional (ej: Chorizo extra, Carne extra, Papas):');
        if (!name || !name.trim()) return;
        const priceStr = prompt(`Precio adicional para "${name.trim()}" (en Soles):`, '2.00');
        if (priceStr === null) return;
        const price = parseFloat(priceStr) || 0;
        appConfig.extras = appConfig.extras || [];
        appConfig.extras.push({
            id: 'ex_' + Date.now(),
            name: name.trim(),
            price,
            variant_id: '',
            available: true
        });
        markDirty();
        renderExtras();
    });

    // Controles de Horario y Modo Rápido (Automático / Abierto / Cerrado) en pestaña y barra superior
    ['auto', 'open', 'closed'].forEach(m => {
        const btn = document.getElementById(`mode-btn-${m}`);
        const topBtn = document.getElementById(`top-btn-${m}`);
        const applyMode = async () => {
            appConfig.schedule = appConfig.schedule || {};
            appConfig.schedule.mode = m;
            renderScheduleSection();
            markDirty();
        };
        if (btn) btn.addEventListener('click', applyMode);
        if (topBtn) topBtn.addEventListener('click', applyMode);
    });

    document.getElementById('sched-open-time').addEventListener('change', (e) => {
        appConfig.schedule.openTime = e.target.value;
        markDirty();
    });
    document.getElementById('sched-close-time').addEventListener('change', (e) => {
        appConfig.schedule.closeTime = e.target.value;
        markDirty();
    });
    document.getElementById('sched-hours-label').addEventListener('input', (e) => {
        appConfig.schedule.hoursLabel = e.target.value;
        markDirty();
    });
    document.getElementById('sched-est-mins').addEventListener('change', (e) => {
        appConfig.schedule.estimatedTimeMins = parseInt(e.target.value, 10) || 20;
        markDirty();
    });
    document.getElementById('sched-closed-msg').addEventListener('input', (e) => {
        appConfig.schedule.customClosedMessage = e.target.value;
        markDirty();
    });

    document.querySelectorAll('#sched-days-chips .day-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const d = Number(chip.dataset.day);
            appConfig.schedule.openDays = Array.isArray(appConfig.schedule.openDays)
                ? appConfig.schedule.openDays.map(Number)
                : [1, 2, 3, 4, 5, 6];
            const idx = appConfig.schedule.openDays.indexOf(d);
            if (idx > -1) {
                appConfig.schedule.openDays.splice(idx, 1);
            } else {
                appConfig.schedule.openDays.push(d);
            }
            markDirty();
            renderScheduleSection();
        });
    });

    document.getElementById('sec-username').addEventListener('input', () => markDirty());
    document.getElementById('sec-new-password').addEventListener('input', () => markDirty());

    // Botón principal de Guardar
    btnSaveAll.addEventListener('click', () => saveAllChanges(false));

    // Sincronizar automáticamente el panel si hubo cambios desde Loyverse POS mientras la pestaña estaba abierta
    const refreshFromServerIfClean = async () => {
        if (!appConfig || hasUnsavedChanges || isSavingNow) return;
        try {
            const { ok, data } = await callApi('config');
            if (ok && data && data.success && data.config) {
                if (data.config.updatedAt && data.config.updatedAt !== appConfig.updatedAt) {
                    appConfig = data.config;
                    renderAllAdminSections();
                }
            }
        } catch (e) {}
    };
    window.addEventListener('focus', refreshFromServerIfClean);
    window.addEventListener('storage', (e) => {
        if (e.key === LIVE_CONFIG_CACHE_KEY && e.newValue && !hasUnsavedChanges && !isSavingNow) {
            try {
                const updated = JSON.parse(e.newValue);
                if (updated && updated.updatedAt !== appConfig?.updatedAt) {
                    appConfig = updated;
                    renderAllAdminSections();
                }
            } catch (err) {}
        }
    });
}

async function initAdmin() {
    if (loginUser) loginUser.value = '';
    if (loginPass) loginPass.value = '';
    setupAdminListeners();

    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
        try {
            const creds = JSON.parse(savedSession);
            if (creds && creds.username && creds.password) {
                await attemptLogin(creds.username, creds.password, true);
            }
        } catch (e) {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }
}

document.addEventListener('DOMContentLoaded', initAdmin);

