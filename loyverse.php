<?php
// loyverse.php - Backend unificado para XAMPP / Servidores PHP (Inventario, Config Admin, Pedidos Loyverse + Telegram)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('America/Lima');

$LOYVERSE_TOKEN = getenv('LOYVERSE_TOKEN') ?: 'c26d1ad904604b0fba6b1b3d148b60ed';
$STORE_ID = '6ad54167-dd5c-482b-806c-0b917f8b4545';
$CONFIG_ITEM_ID = '7de66ec4-f69b-4182-9c18-48e6ed4c2ecd';
$DEFAULT_VARIANT_ID = '6d767227-33a4-4738-9bad-426be19362fe';
$TELEGRAM_TOKEN = getenv('TELEGRAM_BOT_TOKEN') ?: '8848958079:AAGfrgGoWjMOAgmaAFLVrbftKSXxwV98vTo';
$TELEGRAM_CHATS = getenv('TELEGRAM_CHAT_ID') ?: '8862958232,8916868444';
$CONFIG_FILE = __DIR__ . '/data/config.json';

function httpRequest($url, $method = 'GET', $headers = [], $body = null) {
    $payload = null;
    if ($body !== null) {
        $payload = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_UNICODE);
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        }
        $response = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['status' => $status, 'data' => $response ? json_decode($response, true) : null];
    }

    // Fallback nativo sin cURL (usando stream_context_create de PHP en XAMPP)
    $headerLines = array_merge($headers, ['Connection: close']);
    $headerStr = implode("\r\n", $headerLines);
    if ($payload !== null && stripos($headerStr, 'Content-Length:') === false) {
        $headerStr .= ($headerStr !== '' ? "\r\n" : '') . 'Content-Length: ' . strlen($payload);
    }

    $opts = [
        'http' => [
            'method' => $method,
            'header' => $headerStr,
            'timeout' => 8,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    if ($payload !== null) {
        $opts['http']['content'] = $payload;
    }

    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $hdr) {
            if (preg_match('#^HTTP/\d+\.\d+\s+(\d+)#i', $hdr, $m)) {
                $status = (int)$m[1];
            }
        }
    }
    return ['status' => $status, 'data' => $response ? json_decode($response, true) : null];
}

function loadLocalConfig($file) {
    if (file_exists($file)) {
        $raw = file_get_contents($file);
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) return $decoded;
    }
    return null;
}

function saveLocalConfig($file, $configObj) {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @file_put_contents($file, json_encode($configObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function decodeCloudConfig($desc) {
    if (!is_string($desc)) return null;
    $trimmed = trim($desc);
    if ($trimmed === '') return null;
    if (strpos($trimmed, 'MICHO_CFG_GZ:') === 0) {
        $b64 = substr($trimmed, strlen('MICHO_CFG_GZ:'));
        $bin = base64_decode($b64);
        if ($bin !== false) {
            $jsonStr = @gzdecode($bin);
            if ($jsonStr !== false) {
                return json_decode($jsonStr, true);
            }
        }
        return null;
    }
    if ($trimmed[0] === '{') {
        return json_decode($trimmed, true);
    }
    return null;
}

function encodeCloudConfig($configObj) {
    $jsonStr = json_encode($configObj, JSON_UNESCAPED_UNICODE);
    return 'MICHO_CFG_GZ:' . base64_encode(gzencode($jsonStr, 9));
}

function fetchCloudState($token, $configItemId, $configFile, $forceCloud = false) {
    $localConfig = loadLocalConfig($configFile);
    if ($localConfig && !$forceCloud) {
        return ['activeConfig' => $localConfig, 'cfgItem' => null];
    }
    $res = httpRequest("https://api.loyverse.com/v1.0/items/$configItemId", 'GET', [
        "Authorization: Bearer $token"
    ]);
    if ($res['status'] >= 200 && $res['status'] < 300 && is_array($res['data'])) {
        $cfgItem = $res['data'];
        $cloudConfig = isset($cfgItem['description']) ? decodeCloudConfig($cfgItem['description']) : null;
        $activeConfig = $localConfig ?: $cloudConfig;
        if ($activeConfig && !$localConfig) {
            saveLocalConfig($configFile, $activeConfig);
        }
        return ['activeConfig' => $activeConfig, 'cfgItem' => $cfgItem];
    }
    return ['activeConfig' => $localConfig, 'cfgItem' => null];
}

function saveCloudState($token, $configItemId, $configFile, $configObj, $existingCfgItem = null, $syncCloud = false) {
    saveLocalConfig($configFile, $configObj);
    if (!$syncCloud) {
        return true;
    }

    $itemCacheFile = __DIR__ . '/data/loyverse_item_template.json';
    $baseItem = $existingCfgItem;
    if (!$baseItem && file_exists($itemCacheFile)) {
        $baseItem = json_decode(file_get_contents($itemCacheFile), true);
    }
    if (!$baseItem) {
        $getRes = httpRequest("https://api.loyverse.com/v1.0/items/$configItemId", 'GET', [
            "Authorization: Bearer $token"
        ]);
        if ($getRes['status'] >= 200 && $getRes['status'] < 300 && is_array($getRes['data'])) {
            $baseItem = $getRes['data'];
            @file_put_contents($itemCacheFile, json_encode($baseItem, JSON_UNESCAPED_UNICODE));
        }
    }
    if ($baseItem && is_array($baseItem)) {
        $baseItem['description'] = encodeCloudConfig($configObj);
        $postRes = httpRequest("https://api.loyverse.com/v1.0/items", 'POST', [
            "Authorization: Bearer $token",
            "Content-Type: application/json"
        ], $baseItem);
        if ($postRes['status'] >= 200 && $postRes['status'] < 300 && is_array($postRes['data'])) {
            @file_put_contents($itemCacheFile, json_encode($postRes['data'], JSON_UNESCAPED_UNICODE));
        }
    }
    return true;
}

function getLoyverseCategoryMap() {
    return [
        'hamburguesas' => 'd7bbda2c-e51e-4587-97d2-18161341fc4d',
        'pollo_deshilachado' => 'a2bdfa28-f86f-4eda-a292-a7574fe76f4c',
        'filetes' => '71b46f1c-0ca2-4222-98dc-3de6256d4502',
        'crispy' => '71b46f1c-0ca2-4222-98dc-3de6256d4502',
        'chorizos' => '9adb1370-239e-4dec-8096-46a590a3d0f5',
        'pollo_broaster' => '4c68ad36-f1b8-410a-9b12-98b485341c1b',
        'promociones' => '4c68ad36-f1b8-410a-9b12-98b485341c1b'
    ];
}

function getNextAvailableSku($configObj) {
    $maxSku = 10055;
    if (!empty($configObj['categories']) && is_array($configObj['categories'])) {
        foreach ($configObj['categories'] as $c) {
            foreach (($c['items'] ?? []) as $it) {
                if (!empty($it['sku']) && is_numeric($it['sku']) && (int)$it['sku'] > $maxSku) {
                    $maxSku = (int)$it['sku'];
                }
            }
        }
    }
    if (!empty($configObj['extras']) && is_array($configObj['extras'])) {
        foreach ($configObj['extras'] as $ex) {
            if (!empty($ex['sku']) && is_numeric($ex['sku']) && (int)$ex['sku'] > $maxSku) {
                $maxSku = (int)$ex['sku'];
            }
        }
    }
    return (string)($maxSku + 1);
}

function syncItemWithLoyverse($token, $storeId, $defaultVariantId, &$item, $webCatId = '', $fallbackSku = '') {
    $catMap = getLoyverseCategoryMap();
    $loyCatId = isset($catMap[$webCatId]) ? $catMap[$webCatId] : null;
    $isAvailable = (!isset($item['active']) || $item['active'] !== false) && empty($item['manualOutOfStock']) && (!isset($item['available']) || $item['available'] !== false);
    $price = isset($item['price']) ? (float)$item['price'] : 0.0;
    $sku = !empty($item['sku']) ? trim((string)$item['sku']) : $fallbackSku;

    $isNew = empty($item['variant_id']) || $item['variant_id'] === 'NEW_LOYVERSE_ITEM';

    if (!$isNew && !empty($item['item_id'])) {
        // Obtener item actual de Loyverse para preservar track_stock y otros metadatos
        $getRes = httpRequest("https://api.loyverse.com/v1.0/items/{$item['item_id']}", 'GET', [
            "Authorization: Bearer $token"
        ]);
        if ($getRes['status'] >= 200 && $getRes['status'] < 300 && !empty($getRes['data']['id'])) {
            $existing = $getRes['data'];
            $existing['item_name'] = $item['name'];
            if ($loyCatId) {
                $existing['category_id'] = $loyCatId;
            }
            if (!empty($existing['variants'][0])) {
                if ($sku !== '') {
                    $existing['variants'][0]['sku'] = $sku;
                }
                $existing['variants'][0]['default_pricing_type'] = 'FIXED';
                $existing['variants'][0]['default_price'] = $price;
                if (!empty($existing['variants'][0]['stores']) && is_array($existing['variants'][0]['stores'])) {
                    foreach ($existing['variants'][0]['stores'] as &$st) {
                        $st['pricing_type'] = 'FIXED';
                        $st['price'] = $price;
                        $st['available_for_sale'] = $isAvailable;
                    }
                    unset($st);
                } else {
                    $existing['variants'][0]['stores'] = [[
                        'store_id' => $storeId,
                        'pricing_type' => 'FIXED',
                        'price' => $price,
                        'available_for_sale' => $isAvailable
                    ]];
                }
            }
            $upRes = httpRequest("https://api.loyverse.com/v1.0/items", 'POST', [
                "Authorization: Bearer $token",
                "Content-Type: application/json"
            ], $existing);
            if ($upRes['status'] >= 200 && $upRes['status'] < 300 && !empty($upRes['data']['id'])) {
                $item['item_id'] = $upRes['data']['id'];
                $item['variant_id'] = $upRes['data']['variants'][0]['variant_id'] ?? $item['variant_id'];
                $item['sku'] = (string)($upRes['data']['variants'][0]['sku'] ?? $sku);
                return true;
            }
        }
    }

    // Crear nuevo item en Loyverse POS con su propio código SKU
    $variantPayload = [
        'default_pricing_type' => 'FIXED',
        'default_price' => $price,
        'stores' => [
            [
                'store_id' => $storeId,
                'pricing_type' => 'FIXED',
                'price' => $price,
                'available_for_sale' => $isAvailable
            ]
        ]
    ];
    if ($sku !== '') {
        $variantPayload['sku'] = $sku;
    }

    $payload = [
        'item_name' => $item['name'],
        'track_stock' => false,
        'variants' => [$variantPayload]
    ];
    if ($loyCatId) {
        $payload['category_id'] = $loyCatId;
    }

    $res = httpRequest("https://api.loyverse.com/v1.0/items", 'POST', [
        "Authorization: Bearer $token",
        "Content-Type: application/json"
    ], $payload);

    if ($res['status'] >= 200 && $res['status'] < 300 && !empty($res['data']['variants'][0]['variant_id'])) {
        $item['item_id'] = $res['data']['id'];
        $item['variant_id'] = $res['data']['variants'][0]['variant_id'];
        $item['sku'] = (string)($res['data']['variants'][0]['sku'] ?? $sku);
        return true;
    }

    if (empty($item['variant_id']) || $item['variant_id'] === 'NEW_LOYVERSE_ITEM') {
        $item['variant_id'] = $defaultVariantId;
    }
    return false;
}

$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : 'loyverse';

// ============================================================================
// ENDPOINT 1: INVENTORY + PUBLIC CONFIG (GET)
// ============================================================================
if ($endpoint === 'inventory') {
    $localConfig = loadLocalConfig($CONFIG_FILE);
    $itemsRes = httpRequest("https://api.loyverse.com/v1.0/items?limit=250", 'GET', [
        "Authorization: Bearer $LOYVERSE_TOKEN"
    ]);
    $invRes = httpRequest("https://api.loyverse.com/v1.0/inventory?store_ids=$STORE_ID&limit=250", 'GET', [
        "Authorization: Bearer $LOYVERSE_TOKEN"
    ]);

    $itemsData = $itemsRes['data'];
    $invData = $invRes['data'];

    $cloudConfig = null;
    if (!empty($itemsData['items']) && is_array($itemsData['items'])) {
        foreach ($itemsData['items'] as $it) {
            if ($it['id'] === $CONFIG_ITEM_ID && !empty($it['description'])) {
                $cloudConfig = decodeCloudConfig($it['description']);
                break;
            }
        }
    }

    $activeConfig = $localConfig ?: $cloudConfig ?: [];
    if (!$localConfig && $cloudConfig) {
        saveLocalConfig($CONFIG_FILE, $cloudConfig);
    }

    $invMap = [];
    if (!empty($invData['inventory_levels']) && is_array($invData['inventory_levels'])) {
        foreach ($invData['inventory_levels'] as $lvl) {
            $invMap[$lvl['variant_id']] = $lvl['in_stock'];
        }
    }

    $stockStatus = [];
    $loyverseByVariant = [];
    $loyverseByItem = [];
    if (!empty($itemsData['items']) && is_array($itemsData['items'])) {
        foreach ($itemsData['items'] as $item) {
            if ($item['id'] === $CONFIG_ITEM_ID) continue;
            $trackStock = !empty($item['track_stock']);
            $variants = isset($item['variants']) && is_array($item['variants']) ? $item['variants'] : [];
            foreach ($variants as $v) {
                $vid = $v['variant_id'];
                $availableForSale = true;
                $storePrice = isset($v['default_price']) ? (float)$v['default_price'] : 0.0;
                if (!empty($v['stores']) && is_array($v['stores'])) {
                    $storeInfo = $v['stores'][0];
                    foreach ($v['stores'] as $s) {
                        if ($s['store_id'] === $STORE_ID) {
                            $storeInfo = $s;
                            break;
                        }
                    }
                    if (isset($storeInfo['available_for_sale']) && $storeInfo['available_for_sale'] === false) {
                        $availableForSale = false;
                    }
                    if (isset($storeInfo['price']) && $storeInfo['price'] !== null) {
                        $storePrice = (float)$storeInfo['price'];
                    }
                }
                $inStock = array_key_exists($vid, $invMap) ? $invMap[$vid] : null;
                $isOutOfStock = false;
                if (!$availableForSale) {
                    $isOutOfStock = true;
                } elseif ($trackStock && $inStock !== null && $inStock <= 0) {
                    $isOutOfStock = true;
                }

                $entryData = [
                    'itemId' => $item['id'],
                    'itemName' => $item['item_name'],
                    'sku' => isset($v['sku']) ? (string)$v['sku'] : '',
                    'price' => $storePrice,
                    'inStock' => $inStock,
                    'trackStock' => $trackStock,
                    'availableForSale' => $availableForSale,
                    'isOutOfStock' => $isOutOfStock
                ];
                $stockStatus[$vid] = $entryData;
                $loyverseByVariant[$vid] = $entryData;
                $loyverseByItem[$item['id']] = $entryData;
            }
        }
    }

    // Sincronizar automáticamente precios y códigos SKU modificados directamente en Loyverse POS hacia la Carta Digital
    $loyverseConfigChanged = false;
    if (!empty($activeConfig['categories']) && is_array($activeConfig['categories'])) {
        foreach ($activeConfig['categories'] as &$cat) {
            if (empty($cat['items']) || !is_array($cat['items'])) continue;
            foreach ($cat['items'] as &$it) {
                $vid = $it['variant_id'] ?? '';
                $iid = $it['item_id'] ?? '';
                $loyMatch = ($vid && isset($loyverseByVariant[$vid]))
                    ? $loyverseByVariant[$vid]
                    : (($iid && isset($loyverseByItem[$iid])) ? $loyverseByItem[$iid] : null);
                if ($loyMatch) {
                    if ($loyMatch['price'] > 0 && abs((float)($it['price'] ?? 0) - $loyMatch['price']) > 0.001) {
                        $it['price'] = $loyMatch['price'];
                        $loyverseConfigChanged = true;
                    }
                    if ($loyMatch['sku'] !== '' && (string)($it['sku'] ?? '') !== $loyMatch['sku']) {
                        $it['sku'] = $loyMatch['sku'];
                        $loyverseConfigChanged = true;
                    }
                }
            }
            unset($it);
        }
        unset($cat);
    }
    if (!empty($activeConfig['extras']) && is_array($activeConfig['extras'])) {
        foreach ($activeConfig['extras'] as &$ex) {
            $vid = $ex['variant_id'] ?? '';
            $iid = $ex['item_id'] ?? '';
            $loyMatch = ($vid && isset($loyverseByVariant[$vid]))
                ? $loyverseByVariant[$vid]
                : (($iid && isset($loyverseByItem[$iid])) ? $loyverseByItem[$iid] : null);
            if ($loyMatch) {
                if ($loyMatch['price'] > 0 && abs((float)($ex['price'] ?? 0) - $loyMatch['price']) > 0.001) {
                    $ex['price'] = $loyMatch['price'];
                    $loyverseConfigChanged = true;
                }
                if ($loyMatch['sku'] !== '' && (string)($ex['sku'] ?? '') !== $loyMatch['sku']) {
                    $ex['sku'] = $loyMatch['sku'];
                    $loyverseConfigChanged = true;
                }
            }
        }
        unset($ex);
    }
    if ($loyverseConfigChanged) {
        $activeConfig['updatedAt'] = gmdate('c');
        saveLocalConfig($CONFIG_FILE, $activeConfig);
    }

    // Asegurar que cada grupo maestro vincule siempre tanto sus platos como sus porciones/adicionales correspondientes
    $canonicalGroupVariants = [
        'grp_hamburguesas' => ['6d767227-33a4-4738-9bad-426be19362fe', '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', '6443424f-c859-44b2-81df-14b2259a1f5e', '4e4fef97-e474-4399-bd9c-a3018cc5f08e', 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', 'b34af2ce-02d8-426a-ab23-44a9c4b1f845'],
        'grp_pollo' => ['c577b91a-a10f-4e1e-9911-a1f73b9f6c97', 'e4d1fbbf-1503-4317-94cb-acc75b1c913a', '060095b1-6642-4cb1-ae5a-2d2cd7c96334', '6906ccd6-cc74-4042-8601-e646c1129131', 'f1f36672-bc7c-41de-9961-ddd068380e4d', '9f238682-be0f-4853-91be-2824471e0ab0', '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', 'c526cfb0-c85d-466a-aa62-8b9ee2629d69'],
        'grp_filetes' => ['08d0e755-36f3-4253-b262-56430ea37cad', '8e2a954c-1719-4be3-99b2-f220b80f40a8', '2bfa628d-bdfb-468b-aafa-ac351846b7de', 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea'],
        'grp_crispy' => ['5262de55-d870-46c2-aad9-25a7a096d8a0', '57bf1904-69f2-427a-8731-afe078274a6d', 'd94b34ba-f604-44b9-b76c-08286adaff5e', '54ca71a0-bb6d-44de-b3a3-af21b46924c3', '60bc53aa-36cd-4650-9707-c082244fbf7c'],
        'grp_chorizos' => ['8fdde459-5909-49a4-a2c9-eacbec3efa18', '9be1375d-d1ca-4ada-ab6d-55218b8a792d', '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', '6059ac60-e268-4809-9060-4253c62c24db', 'bc323c7e-358a-4853-855b-9e2f2beb1618'],
        'grp_pecho_broaster' => ['ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', '47fd3400-d49d-49fa-9f9b-b749a89414bd'],
        'grp_encuentro_broaster' => ['7433770a-524e-46b1-b07d-1c6f4c2a7eb1', '8d4008bc-a051-420f-bf69-d46e33878809'],
        'grp_ala_broaster' => ['8056dee7-40f6-4e43-bce8-a3344060997c', '2177ce33-0135-45b7-9a43-60167b803e1f', 'df1e6c91-9f19-4dbd-a065-b4b021fc4843'],
        'grp_muzlo_broaster' => ['7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', '139e2101-3055-4fb7-9413-b33432f8e55f']
    ];

    $masterGroups = !empty($activeConfig['masterStockGroups']) && is_array($activeConfig['masterStockGroups'])
        ? $activeConfig['masterStockGroups']
        : [];

    foreach ($masterGroups as &$group) {
        $gid = isset($group['id']) ? $group['id'] : '';
        if ($gid && isset($canonicalGroupVariants[$gid])) {
            $existingVars = !empty($group['variants']) && is_array($group['variants']) ? $group['variants'] : [];
            $group['variants'] = array_values(array_unique(array_merge($existingVars, $canonicalGroupVariants[$gid])));
        }
        $masterVid = isset($group['masterVariantId']) ? $group['masterVariantId'] : '';
        $gVariants = !empty($group['variants']) && is_array($group['variants']) ? $group['variants'] : [];

        // Si el insumo maestro o la porción/adicional vinculada se agota en Loyverse POS, se agotan todos los platos y porciones del grupo
        $masterOut = !empty($stockStatus[$masterVid]['isOutOfStock']);
        $linkedPortionOut = false;
        foreach ($gVariants as $checkVid) {
            if ($checkVid === 'df1e6c91-9f19-4dbd-a065-b4b021fc4843' && $gid === 'grp_ala_broaster') {
                // Si se agota la promo de 2 alas sola, no necesariamente agota la unidad de 1 ala
                continue;
            }
            if (!empty($stockStatus[$checkVid]['isOutOfStock'])) {
                $linkedPortionOut = true;
                break;
            }
        }
        $manualOut = !empty($group['manualOutOfStock']);
        if ($masterOut || $linkedPortionOut || $manualOut) {
            foreach ($gVariants as $vid) {
                if (!isset($stockStatus[$vid])) {
                    $stockStatus[$vid] = ['isOutOfStock' => true];
                } else {
                    $stockStatus[$vid]['isOutOfStock'] = true;
                }
                $stockStatus[$vid]['reason'] = $manualOut
                    ? "Grupo agotado manualmente ({$group['name']})"
                    : "Agotado insumo maestro ({$group['name']})";
            }
        }
    }
    unset($group);
    $activeConfig['masterStockGroups'] = $masterGroups;

    // Si solo queda 1 Ala Broaster en stock, "2 Alas Broaster" no puede venderse
    if (isset($stockStatus['8056dee7-40f6-4e43-bce8-a3344060997c'])) {
        $alaInfo = $stockStatus['8056dee7-40f6-4e43-bce8-a3344060997c'];
        if (!empty($alaInfo['trackStock']) && $alaInfo['inStock'] !== null && (float)$alaInfo['inStock'] < 2) {
            $stockStatus['df1e6c91-9f19-4dbd-a065-b4b021fc4843']['isOutOfStock'] = true;
            $stockStatus['df1e6c91-9f19-4dbd-a065-b4b021fc4843']['reason'] = 'Stock insuficiente de Alas Broaster (< 2)';
        }
    }

    $publicConfig = $activeConfig;
    unset($publicConfig['adminAuth']);

    if (!empty($publicConfig['extras']) && is_array($publicConfig['extras'])) {
        foreach ($publicConfig['extras'] as &$ex) {
            $evid = isset($ex['variant_id']) ? $ex['variant_id'] : '';
            $loyOut = $evid && !empty($stockStatus[$evid]['isOutOfStock']);
            $ex['available'] = (!isset($ex['available']) || $ex['available'] !== false) && !$loyOut;
        }
        unset($ex);
    }

    echo json_encode([
        'success' => true,
        'timestamp' => gmdate('c'),
        'stock' => $stockStatus,
        'config' => $publicConfig
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// ENDPOINT 2: CONFIG ADMIN (GET / POST)
// ============================================================================
if ($endpoint === 'config') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $localCfg = loadLocalConfig($CONFIG_FILE);
        if ($localCfg) {
            unset($localCfg['adminAuth']);
            echo json_encode(['success' => true, 'config' => $localCfg], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $state = fetchCloudState($LOYVERSE_TOKEN, $CONFIG_ITEM_ID, $CONFIG_FILE);
        $publicConfig = $state['activeConfig'] ?: [];
        unset($publicConfig['adminAuth']);
        echo json_encode(['success' => true, 'config' => $publicConfig], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?: [];
        $action = isset($body['action']) ? $body['action'] : '';
        $username = isset($body['username']) ? trim($body['username']) : '';
        $password = isset($body['password']) ? (string)$body['password'] : '';

        $state = fetchCloudState($LOYVERSE_TOKEN, $CONFIG_ITEM_ID, $CONFIG_FILE);
        $activeConfig = $state['activeConfig'];
        $cfgItem = $state['cfgItem'];

        if (!$activeConfig) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'No se pudo cargar la configuración base.']);
            exit;
        }

        $expectedUser = !empty($activeConfig['adminAuth']['username']) ? $activeConfig['adminAuth']['username'] : 'admin';
        $expectedPass = !empty($activeConfig['adminAuth']['passwordHash']) ? $activeConfig['adminAuth']['passwordHash'] : 'micho2026';

        $validPass = ($password === $expectedPass) || ($expectedPass === 'micho2026' && ($password === 'admin' || $password === '123456'));
        if (strtolower($username) !== strtolower($expectedUser) || !$validPass) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos.']);
            exit;
        }

        if ($action === 'login' || $action === 'sync_loyverse') {
            $loyverseCatalog = [];
            $loyverseStockMap = [];
            $catCacheFile = __DIR__ . '/data/loyverse_catalog_cache.json';
            $forceRefresh = ($action === 'sync_loyverse') || !file_exists($catCacheFile) || (time() - filemtime($catCacheFile)) >= 300;

            if (!$forceRefresh) {
                $cachedData = json_decode(file_get_contents($catCacheFile), true) ?: [];
                $loyverseCatalog = isset($cachedData['catalog']) ? $cachedData['catalog'] : $cachedData;
                $loyverseStockMap = isset($cachedData['stockMap']) ? $cachedData['stockMap'] : [];
            } else {
                $itemsRes = httpRequest("https://api.loyverse.com/v1.0/items?limit=250", 'GET', [
                    "Authorization: Bearer $LOYVERSE_TOKEN"
                ]);
                $invRes = httpRequest("https://api.loyverse.com/v1.0/inventory?store_ids=$STORE_ID&limit=250", 'GET', [
                    "Authorization: Bearer $LOYVERSE_TOKEN"
                ]);
                $invLevels = [];
                if (!empty($invRes['data']['inventory_levels']) && is_array($invRes['data']['inventory_levels'])) {
                    foreach ($invRes['data']['inventory_levels'] as $lvl) {
                        $invLevels[$lvl['variant_id']] = (float)$lvl['in_stock'];
                    }
                }
                if (!empty($itemsRes['data']['items']) && is_array($itemsRes['data']['items'])) {
                    foreach ($itemsRes['data']['items'] as $it) {
                        if ($it['id'] === $CONFIG_ITEM_ID) continue;
                        $vid = isset($it['variants'][0]['variant_id']) ? $it['variants'][0]['variant_id'] : '';
                        $sku = isset($it['variants'][0]['sku']) ? (string)$it['variants'][0]['sku'] : '';
                        $trackStock = !empty($it['track_stock']);
                        $inStock = array_key_exists($vid, $invLevels) ? $invLevels[$vid] : null;
                        $avail = isset($it['variants'][0]['stores'][0]['available_for_sale'])
                            ? (bool)$it['variants'][0]['stores'][0]['available_for_sale']
                            : true;

                        $entry = [
                            'item_id' => $it['id'],
                            'name' => $it['item_name'],
                            'variant_id' => $vid,
                            'sku' => $sku,
                            'price' => isset($it['variants'][0]['default_price']) ? (float)$it['variants'][0]['default_price'] : 0,
                            'track_stock' => $trackStock,
                            'in_stock' => $inStock,
                            'available_for_sale' => $avail
                        ];
                        $loyverseCatalog[] = $entry;
                        if ($vid) {
                            $loyverseStockMap[$vid] = $entry;
                        }
                    }
                    @file_put_contents($catCacheFile, json_encode([
                        'catalog' => $loyverseCatalog,
                        'stockMap' => $loyverseStockMap
                    ], JSON_UNESCAPED_UNICODE));
                }
            }

            // Si es sync_loyverse, asegurar que cada item en activeConfig tenga su sku e item_id vinculado
            if ($action === 'sync_loyverse' && !empty($loyverseStockMap)) {
                foreach ($activeConfig['categories'] as &$cat) {
                    foreach ($cat['items'] as &$it) {
                        $vid = $it['variant_id'] ?? '';
                        if ($vid && isset($loyverseStockMap[$vid])) {
                            $it['item_id'] = $loyverseStockMap[$vid]['item_id'];
                            if (!empty($loyverseStockMap[$vid]['sku'])) {
                                $it['sku'] = $loyverseStockMap[$vid]['sku'];
                            }
                        }
                    }
                    unset($it);
                }
                unset($cat);
                saveLocalConfig($CONFIG_FILE, $activeConfig);
            }

            $safeConfig = $activeConfig;
            $safeConfig['adminUser'] = $expectedUser;
            unset($safeConfig['adminAuth']);
            echo json_encode([
                'success' => true,
                'config' => $safeConfig,
                'loyverseCatalog' => $loyverseCatalog,
                'loyverseStockMap' => $loyverseStockMap
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'update_loyverse_stock') {
            $variantId = isset($body['variant_id']) ? trim($body['variant_id']) : '';
            $itemId = isset($body['item_id']) ? trim($body['item_id']) : '';
            $newStock = isset($body['stock']) ? (float)$body['stock'] : 0;

            if (!$variantId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Falta variant_id de Loyverse.']);
                exit;
            }

            // Si tiene itemId, asegurar que track_stock esté activo en Loyverse para poder registrar inventario
            if ($itemId) {
                $getIt = httpRequest("https://api.loyverse.com/v1.0/items/$itemId", 'GET', [
                    "Authorization: Bearer $LOYVERSE_TOKEN"
                ]);
                if ($getIt['status'] >= 200 && $getIt['status'] < 300 && !empty($getIt['data']['id']) && empty($getIt['data']['track_stock'])) {
                    $itData = $getIt['data'];
                    $itData['track_stock'] = true;
                    httpRequest("https://api.loyverse.com/v1.0/items", 'POST', [
                        "Authorization: Bearer $LOYVERSE_TOKEN",
                        "Content-Type: application/json"
                    ], $itData);
                }
            }

            $invPayload = [
                'inventory_levels' => [
                    [
                        'variant_id' => $variantId,
                        'store_id' => $STORE_ID,
                        'stock_after' => $newStock
                    ]
                ]
            ];
            $invUp = httpRequest("https://api.loyverse.com/v1.0/inventory", 'POST', [
                "Authorization: Bearer $LOYVERSE_TOKEN",
                "Content-Type: application/json"
            ], $invPayload);

            // Invalidar caché de catálogo para reflejar nuevo stock
            @unlink(__DIR__ . '/data/loyverse_catalog_cache.json');

            echo json_encode([
                'success' => ($invUp['status'] >= 200 && $invUp['status'] < 300),
                'stock_after' => $newStock,
                'details' => $invUp['data']
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'sales_analytics') {
            $dateFrom = isset($body['dateFrom']) ? trim((string)$body['dateFrom']) : '';
            $dateTo = isset($body['dateTo']) ? trim((string)$body['dateTo']) : '';
            $maxPages = isset($body['maxPages']) ? min(20, max(1, (int)$body['maxPages'])) : 12;

            // Zona horaria Lima (UTC-5): convertir YYYY-MM-DD local a rango UTC ISO8601
            $createdMin = '';
            $createdMax = '';
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
                $dtMin = new DateTime($dateFrom . ' 00:00:00', new DateTimeZone('America/Lima'));
                $dtMin->setTimezone(new DateTimeZone('UTC'));
                $createdMin = $dtMin->format('Y-m-d\TH:i:s.000\Z');
            }
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
                $dtMax = new DateTime($dateTo . ' 23:59:59', new DateTimeZone('America/Lima'));
                $dtMax->setTimezone(new DateTimeZone('UTC'));
                $createdMax = $dtMax->format('Y-m-d\TH:i:s.999\Z');
            }

            $allReceipts = [];
            $cursor = '';
            $pageCount = 0;

            while ($pageCount < $maxPages) {
                $pageCount++;
                $qs = ['limit' => 250];
                if ($createdMin !== '') $qs['created_at_min'] = $createdMin;
                if ($createdMax !== '') $qs['created_at_max'] = $createdMax;
                if ($cursor !== '') $qs['cursor'] = $cursor;

                $url = 'https://api.loyverse.com/v1.0/receipts?' . http_build_query($qs);
                $rRes = httpRequest($url, 'GET', [
                    "Authorization: Bearer $LOYVERSE_TOKEN"
                ]);
                if ($rRes['status'] < 200 || $rRes['status'] >= 300 || empty($rRes['data']['receipts'])) {
                    break;
                }
                foreach ($rRes['data']['receipts'] as $rec) {
                    if (!empty($rec['cancelled_at'])) continue;
                    $isRefund = (isset($rec['receipt_type']) && strtoupper($rec['receipt_type']) === 'REFUND');
                    $sign = $isRefund ? -1 : 1;
                    $totalMoney = (float)($rec['total_money'] ?? 0) * $sign;

                    $rawDate = $rec['receipt_date'] ?? ($rec['created_at'] ?? gmdate('c'));
                    try {
                        $dt = new DateTime($rawDate);
                        $dt->setTimezone(new DateTimeZone('America/Lima'));
                        $limaDate = $dt->format('Y-m-d');
                        $limaTime = $dt->format('H:i');
                        $limaHour = (int)$dt->format('G');
                    } catch (Exception $e) {
                        $limaDate = substr($rawDate, 0, 10);
                        $limaTime = substr($rawDate, 11, 5);
                        $limaHour = 20;
                    }

                    $payments = [];
                    if (!empty($rec['payments']) && is_array($rec['payments'])) {
                        foreach ($rec['payments'] as $p) {
                            $payments[] = [
                                'name' => $p['name'] ?? ($p['type'] ?? 'Otro'),
                                'amount' => (float)($p['money_amount'] ?? 0) * $sign
                            ];
                        }
                    }

                    $items = [];
                    if (!empty($rec['line_items']) && is_array($rec['line_items'])) {
                        foreach ($rec['line_items'] as $li) {
                            $items[] = [
                                'name' => $li['item_name'] ?? 'Producto',
                                'sku' => (string)($li['sku'] ?? ''),
                                'qty' => (float)($li['quantity'] ?? 1) * $sign,
                                'price' => (float)($li['price'] ?? 0),
                                'total' => (float)($li['total_money'] ?? 0) * $sign,
                                'note' => (string)($li['line_note'] ?? '')
                            ];
                        }
                    }

                    $sourceRaw = strtolower(trim((string)($rec['source'] ?? '')));
                    $noteStr = (string)($rec['note'] ?? '');
                    $orderStr = (string)($rec['order'] ?? '');
                    $isWeb = ($sourceRaw === 'menu web')
                        || stripos($noteStr, 'A ENVIAR |') !== false
                        || stripos($noteStr, 'A RECOGER |') !== false
                        || stripos($orderStr, 'Delivery -') !== false
                        || stripos($orderStr, 'Recojo -') !== false;

                    $diningOpt = strtolower((string)($rec['dining_option'] ?? ''));
                    $isDelivery = ($diningOpt === 'delivery')
                        || stripos($noteStr, 'A ENVIAR') !== false
                        || stripos($orderStr, 'Delivery') !== false;

                    $allReceipts[] = [
                        'number' => (string)($rec['receipt_number'] ?? ''),
                        'type' => $isRefund ? 'REFUND' : 'SALE',
                        'date' => $limaDate,
                        'time' => $limaTime,
                        'hour' => $limaHour,
                        'total' => $totalMoney,
                        'isWeb' => $isWeb,
                        'source' => $isWeb ? 'Carta Web' : 'Caja POS',
                        'modality' => $isDelivery ? 'Delivery' : 'Recojo / Local',
                        'order' => $orderStr,
                        'note' => $noteStr,
                        'payments' => $payments,
                        'items' => $items
                    ];
                }

                if (!empty($rRes['data']['cursor'])) {
                    $cursor = $rRes['data']['cursor'];
                } else {
                    break;
                }
            }

            echo json_encode([
                'success' => true,
                'count' => count($allReceipts),
                'pagesLoaded' => $pageCount,
                'hasMore' => ($cursor !== '' && $pageCount >= $maxPages),
                'receipts' => $allReceipts
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'quick_schedule') {
            $updatedConfig = $activeConfig;
            if (!empty($body['schedule']) && is_array($body['schedule'])) {
                $updatedConfig['schedule'] = array_merge($updatedConfig['schedule'] ?: [], $body['schedule']);
            }
            $updatedConfig['updatedAt'] = gmdate('c');
            saveCloudState($LOYVERSE_TOKEN, $CONFIG_ITEM_ID, $CONFIG_FILE, $updatedConfig, $cfgItem);

            $safeConfig = $updatedConfig;
            unset($safeConfig['adminAuth']);
            echo json_encode([
                'success' => true,
                'message' => 'Estado y horario actualizados correctamente.',
                'config' => $safeConfig
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'save') {
            $incoming = isset($body['config']) && is_array($body['config']) ? $body['config'] : [];
            $updatedConfig = $activeConfig;

            // Mapa de estado previo para detectar qué productos o extras cambiaron y sincronizarlos con Loyverse POS
            $prevItemsById = [];
            if (!empty($activeConfig['categories']) && is_array($activeConfig['categories'])) {
                foreach ($activeConfig['categories'] as $pCat) {
                    foreach (($pCat['items'] ?? []) as $pIt) {
                        if (!empty($pIt['id'])) {
                            $prevItemsById[$pIt['id']] = $pIt;
                        }
                    }
                }
            }
            $prevExtrasById = [];
            if (!empty($activeConfig['extras']) && is_array($activeConfig['extras'])) {
                foreach ($activeConfig['extras'] as $pEx) {
                    if (!empty($pEx['id'])) {
                        $prevExtrasById[$pEx['id']] = $pEx;
                    }
                }
            }

            if (!empty($incoming['schedule']) && is_array($incoming['schedule'])) {
                $updatedConfig['schedule'] = array_merge($updatedConfig['schedule'] ?: [], $incoming['schedule']);
            }
            if (isset($incoming['cremas']) && is_array($incoming['cremas'])) {
                $updatedConfig['cremas'] = $incoming['cremas'];
            }
            if (isset($incoming['cremasRule']) && is_array($incoming['cremasRule'])) {
                $updatedConfig['cremasRule'] = [
                    'maxFree' => isset($incoming['cremasRule']['maxFree']) ? max(0, (int)$incoming['cremasRule']['maxFree']) : 9,
                    'extraPrice' => isset($incoming['cremasRule']['extraPrice']) ? max(0.0, (float)$incoming['cremasRule']['extraPrice']) : 0.50
                ];
            }
            if (isset($incoming['sideOptions']) && is_array($incoming['sideOptions'])) {
                $updatedConfig['sideOptions'] = [
                    'ensaladaAvailable' => !isset($incoming['sideOptions']['ensaladaAvailable']) || $incoming['sideOptions']['ensaladaAvailable'] !== false,
                    'papaHiloAvailable' => !isset($incoming['sideOptions']['papaHiloAvailable']) || $incoming['sideOptions']['papaHiloAvailable'] !== false
                ];
            }
            if (isset($incoming['masterStockGroups']) && is_array($incoming['masterStockGroups'])) {
                $updatedConfig['masterStockGroups'] = $incoming['masterStockGroups'];
            }

            $loyverseChanged = false;
            if (isset($incoming['extras']) && is_array($incoming['extras'])) {
                foreach ($incoming['extras'] as &$ex) {
                    $prevEx = isset($ex['id'], $prevExtrasById[$ex['id']]) ? $prevExtrasById[$ex['id']] : null;
                    $isNewEx = empty($ex['variant_id']) || $ex['variant_id'] === 'NEW_LOYVERSE_ITEM';
                    $hasChangedEx = !$prevEx
                        || ($prevEx['name'] ?? '') !== ($ex['name'] ?? '')
                        || (float)($prevEx['price'] ?? 0) !== (float)($ex['price'] ?? 0)
                        || (string)($prevEx['sku'] ?? '') !== (string)($ex['sku'] ?? '')
                        || (bool)($prevEx['available'] ?? true) !== (bool)($ex['available'] ?? true);

                    if ($isNewEx || $hasChangedEx) {
                        $nextSku = !empty($ex['sku']) ? $ex['sku'] : getNextAvailableSku($incoming);
                        syncItemWithLoyverse($LOYVERSE_TOKEN, $STORE_ID, $DEFAULT_VARIANT_ID, $ex, 'extras_porciones', $nextSku);
                        $loyverseChanged = true;
                    }
                }
                unset($ex);
                $updatedConfig['extras'] = $incoming['extras'];
            }

            if (isset($incoming['categories']) && is_array($incoming['categories'])) {
                $newIdsSet = [];
                foreach ($incoming['categories'] as &$cat) {
                    if (empty($cat['items']) || !is_array($cat['items'])) continue;
                    $catId = $cat['id'] ?? '';
                    foreach ($cat['items'] as &$item) {
                        if (!empty($item['id'])) {
                            $newIdsSet[$item['id']] = true;
                        }
                        $prevIt = (!empty($item['id']) && isset($prevItemsById[$item['id']])) ? $prevItemsById[$item['id']] : null;
                        $isNewIt = empty($item['variant_id']) || $item['variant_id'] === 'NEW_LOYVERSE_ITEM';
                        $hasChangedIt = !$prevIt
                            || ($prevIt['name'] ?? '') !== ($item['name'] ?? '')
                            || (float)($prevIt['price'] ?? 0) !== (float)($item['price'] ?? 0)
                            || (string)($prevIt['sku'] ?? '') !== (string)($item['sku'] ?? '')
                            || (bool)($prevIt['active'] ?? true) !== (bool)($item['active'] ?? true)
                            || (bool)($prevIt['manualOutOfStock'] ?? false) !== (bool)($item['manualOutOfStock'] ?? false);

                        if ($isNewIt || $hasChangedIt) {
                            $nextSku = !empty($item['sku']) ? $item['sku'] : getNextAvailableSku($incoming);
                            syncItemWithLoyverse($LOYVERSE_TOKEN, $STORE_ID, $DEFAULT_VARIANT_ID, $item, $catId, $nextSku);
                            $loyverseChanged = true;
                        }
                    }
                    unset($item);
                }
                unset($cat);

                // Si algún producto fue eliminado del panel, eliminarlo también en Loyverse POS
                foreach ($prevItemsById as $oldId => $oldItem) {
                    if (!isset($newIdsSet[$oldId]) && !empty($oldItem['item_id']) && $oldItem['item_id'] !== $CONFIG_ITEM_ID) {
                        httpRequest("https://api.loyverse.com/v1.0/items/{$oldItem['item_id']}", 'DELETE', [
                            "Authorization: Bearer $LOYVERSE_TOKEN"
                        ]);
                        $loyverseChanged = true;
                    }
                }

                $updatedConfig['categories'] = $incoming['categories'];
            }

            if ($loyverseChanged) {
                @unlink(__DIR__ . '/data/loyverse_catalog_cache.json');
            }

            if (!empty($body['newPassword']) && strlen(trim($body['newPassword'])) >= 4) {
                $updatedConfig['adminAuth'] = [
                    'username' => !empty($body['newUsername']) ? trim($body['newUsername']) : $expectedUser,
                    'passwordHash' => trim($body['newPassword'])
                ];
            } elseif (!empty($body['newUsername']) && strlen(trim($body['newUsername'])) >= 3) {
                $updatedConfig['adminAuth'] = [
                    'username' => trim($body['newUsername']),
                    'passwordHash' => $expectedPass
                ];
            }

            $updatedConfig['updatedAt'] = gmdate('c');
            saveCloudState($LOYVERSE_TOKEN, $CONFIG_ITEM_ID, $CONFIG_FILE, $updatedConfig, $cfgItem);

            $safeConfig = $updatedConfig;
            $safeConfig['adminUser'] = $updatedConfig['adminAuth']['username'];
            unset($safeConfig['adminAuth']);

            echo json_encode([
                'success' => true,
                'message' => 'Cambios guardados y sincronizados en tiempo real.',
                'config' => $safeConfig
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Solicitud inválida.']);
    exit;
}

// ============================================================================
// ENDPOINT 3: LOYVERSE RECEIPT + TELEGRAM NOTIFICATION (POST)
// ============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || empty($data['items']) || !is_array($data['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'El carrito no contiene productos.']);
    exit;
}

$items = $data['items'];
$customer = isset($data['customer']) && is_array($data['customer']) ? $data['customer'] : [];
$isTestOrder = !empty($customer['isTestOrder']);

// Verificar horario dinámico y estado manual
$state = fetchCloudState($LOYVERSE_TOKEN, $CONFIG_ITEM_ID, $CONFIG_FILE);
$scheduleCfg = !empty($state['activeConfig']['schedule']) ? $state['activeConfig']['schedule'] : [
    'mode' => 'auto',
    'openTime' => '18:30',
    'closeTime' => '22:30',
    'openDays' => [1, 2, 3, 4, 5, 6]
];

if (!$isTestOrder) {
    $mode = isset($scheduleCfg['mode']) ? $scheduleCfg['mode'] : 'auto';
    if ($mode === 'closed') {
        $msg = !empty($scheduleCfg['customClosedMessage'])
            ? $scheduleCfg['customClosedMessage']
            : 'En este momento nuestra cocina se encuentra cerrada temporalmente.';
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $msg]);
        exit;
    } elseif ($mode === 'auto') {
        $day = (int)date('w'); // 0 = Domingo
        $minutes = (int)date('G') * 60 + (int)date('i');
        $openDays = isset($scheduleCfg['openDays']) && is_array($scheduleCfg['openDays']) ? $scheduleCfg['openDays'] : [1, 2, 3, 4, 5, 6];

        $openParts = explode(':', isset($scheduleCfg['openTime']) ? $scheduleCfg['openTime'] : '18:30');
        $closeParts = explode(':', isset($scheduleCfg['closeTime']) ? $scheduleCfg['closeTime'] : '22:30');
        $openMins = ((int)$openParts[0]) * 60 + (int)(isset($openParts[1]) ? $openParts[1] : 0);
        $closeMins = ((int)$closeParts[0]) * 60 + (int)(isset($closeParts[1]) ? $closeParts[1] : 0);

        $inDays = in_array($day, $openDays, false);
        $inHours = $openMins <= $closeMins
            ? ($minutes >= $openMins && $minutes <= $closeMins)
            : ($minutes >= $openMins || $minutes <= $closeMins);

        if (!$inDays || !$inHours) {
            $msg = !empty($scheduleCfg['customClosedMessage'])
                ? $scheduleCfg['customClosedMessage']
                : 'En este momento nuestra cocina se encuentra cerrada.';
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => $msg]);
            exit;
        }
    }
}

$paymentTypeMap = [
    'efectivo' => '31f10bd0-9fec-43c4-85c9-d610e12e3f6c',
    'yape' => '598c4e51-5709-4f55-bcf7-52122d6ab53e',
    'plin' => '1d359e17-40b3-4cbc-901c-e8fe40b8b9b8',
    'tarjeta' => '3639a195-afc7-43ce-920e-9daf1c58eb61'
];

$paymentKey = strtolower(isset($customer['paymentMethod']) ? $customer['paymentMethod'] : 'efectivo');
$paymentTypeId = isset($paymentTypeMap[$paymentKey]) ? $paymentTypeMap[$paymentKey] : $paymentTypeMap['efectivo'];

$configuredCremasOrder = ['MAYONESA', 'KETCHUT', 'MOSTAZA', 'GOLF', 'TÁRTARA', 'AJÍ', 'ACEITUNA'];
if (!empty($state['activeConfig']['cremas']) && is_array($state['activeConfig']['cremas'])) {
    $configuredCremasOrder = array_map(function($c) {
        return mb_strtoupper(trim((string)($c['name'] ?? '')), 'UTF-8');
    }, $state['activeConfig']['cremas']);
}

$sortCremasList = function($list) use ($configuredCremasOrder) {
    if (!is_array($list) || count($list) <= 1) return is_array($list) ? $list : [];
    $getRank = function($name) use ($configuredCremasOrder) {
        $rawUp = mb_strtoupper(trim((string)$name), 'UTF-8');
        $up = trim(preg_replace('/\s+X\d+$/iu', '', $rawUp));
        if ($up === 'MAYONESA') return 1;
        if ($up === 'ACEITUNA') return 9999;
        $idx = array_search($up, $configuredCremasOrder, true);
        if ($idx !== false) return 10 + $idx;
        return 500;
    };
    $copy = array_values($list);
    usort($copy, function($a, $b) use ($getRank) {
        return $getRank($a) <=> $getRank($b);
    });
    return $copy;
};

$totalMoney = 0;
$lineItems = [];

foreach ($items as &$item) {
    if (!empty($item['cremasEnPedido']) && is_array($item['cremasEnPedido'])) {
        $item['cremasEnPedido'] = $sortCremasList($item['cremasEnPedido']);
    }
    if (!empty($item['cremasAparte']) && is_array($item['cremasAparte'])) {
        $item['cremasAparte'] = $sortCremasList($item['cremasAparte']);
    }
}
unset($item);

$maxFreeCremas = isset($state['activeConfig']['cremasRule']['maxFree']) ? max(0, (int)$state['activeConfig']['cremasRule']['maxFree']) : 9;
$extraCremaUnitPrice = isset($state['activeConfig']['cremasRule']['extraPrice']) ? max(0.0, (float)$state['activeConfig']['cremasRule']['extraPrice']) : 0.50;

foreach ($items as $item) {
    $qty = isset($item['qty']) ? (int)$item['qty'] : 1;
    $unitTotal = isset($item['price']) ? (float)$item['price'] : 0;
    $extrasSum = 0;
    if (!empty($item['extras']) && is_array($item['extras'])) {
        foreach ($item['extras'] as $ex) {
            if (!empty($ex['variant_id'])) {
                $extrasSum += isset($ex['price']) ? (float)$ex['price'] : 0;
            }
        }
    }
    $pedCnt = (!empty($item['cremasEnPedido']) && is_array($item['cremasEnPedido'])) ? count($item['cremasEnPedido']) : 0;
    $apCnt = (!empty($item['cremasAparte']) && is_array($item['cremasAparte'])) ? count($item['cremasAparte']) : 0;
    $extraCremasCount = isset($item['cremasExtraCount']) ? (int)$item['cremasExtraCount'] : max(0, ($pedCnt + $apCnt) - $maxFreeCremas);
    $extraCremasCost = isset($item['cremasExtraCost']) ? (float)$item['cremasExtraCost'] : ($extraCremasCount * $extraCremaUnitPrice);

    $basePrice = max(0, $unitTotal - $extrasSum);
    $baseLineTotal = $basePrice * $qty;
    $totalMoney += $baseLineTotal;

    $lineNote = '';
    if (empty($item['isBeverage'])) {
        $parts = [];
        $parts[] = 'Ens: ' . ((isset($item['ensalada']) && $item['ensalada'] === 'no') ? 'NO' : 'SÍ');
        if (!empty($item['allowsPotatoChoice'])) {
            $tp = isset($item['tipoPapa']) ? $item['tipoPapa'] : 'fritas';
            $papaLabel = $tp === 'hilo' ? 'Hilo' : ($tp === 'mixta' ? 'Mixta' : 'Fritas');
            $parts[] = "Papa: $papaLabel";
        }
        if (!empty($item['cremasEnPedido']) && is_array($item['cremasEnPedido'])) {
            $parts[] = 'Cremas: ' . implode(',', $item['cremasEnPedido']);
        }
        if (!empty($item['cremasAparte']) && is_array($item['cremasAparte'])) {
            $parts[] = 'Aparte: ' . implode(',', $item['cremasAparte']);
        }
        if ($extraCremasCount > 0) {
            $parts[] = 'Cremas adic(' . $extraCremasCount . '): +S/' . number_format($extraCremasCost, 2);
        }
        if (!empty($item['extras']) && is_array($item['extras'])) {
            $exNames = array_map(function($e) { return $e['name']; }, $item['extras']);
            $parts[] = '+' . implode(',', $exNames);
        }
        if (!empty($item['instrucciones']) && trim($item['instrucciones']) !== '') {
            $parts[] = 'Nota: ' . trim($item['instrucciones']);
        }
        $lineNote = mb_substr(implode(' | ', $parts), 0, 240);
    }

    $itemObj = [
        'variant_id' => !empty($item['variant_id']) ? $item['variant_id'] : $DEFAULT_VARIANT_ID,
        'quantity' => $qty,
        'price' => $basePrice,
        'total_money' => $baseLineTotal
    ];
    if ($lineNote !== '') {
        $itemObj['line_note'] = $lineNote;
    }
    $lineItems[] = $itemObj;

    // Registrar cada adicional con su propio código/variant_id en Loyverse POS
    if (!empty($item['extras']) && is_array($item['extras'])) {
        foreach ($item['extras'] as $ex) {
            if (!empty($ex['variant_id'])) {
                $exPrice = isset($ex['price']) ? (float)$ex['price'] : 0;
                $exTotal = $exPrice * $qty;
                $totalMoney += $exTotal;
                $lineItems[] = [
                    'variant_id' => $ex['variant_id'],
                    'quantity' => $qty,
                    'price' => $exPrice,
                    'total_money' => $exTotal,
                    'line_note' => mb_substr("Adicional para: {$item['name']}", 0, 120)
                ];
            }
        }
    }
}

$clientName = !empty($customer['name']) ? trim($customer['name']) : 'Cliente';
$orderType = !empty($customer['orderType']) ? $customer['orderType'] : 'A Enviar';
$phone = !empty($customer['phone']) ? trim($customer['phone']) : '';
$address = !empty($customer['address']) ? trim($customer['address']) : '';
$building = !empty($customer['building']) ? trim($customer['building']) : '';
$notes = !empty($customer['notes']) ? trim($customer['notes']) : 'Sin observaciones';
$paymentLabel = !empty($customer['paymentMethod']) ? strtoupper($customer['paymentMethod']) : 'EFECTIVO';

$modePrefix = $orderType === 'A Enviar' ? 'Delivery' : 'Recojo';
$orderTitle = mb_substr(trim("$modePrefix - $clientName"), 0, 20);

$deliveryDetails = '';
if ($orderType === 'A Enviar') {
    $deliveryDetails = " | Tel: $phone | Dir: $address" . ($building ? " ($building)" : '');
} elseif ($phone) {
    $deliveryDetails = " | Tel: $phone";
}

$noteDetails = strtoupper($orderType) . " | $clientName$deliveryDetails | Pago: $paymentLabel";
if ($notes && $notes !== 'Sin observaciones') {
    $noteDetails .= " | Notas: $notes";
}
$noteDetails = mb_substr($noteDetails, 0, 240);

$payload = [
    'receipt_date' => gmdate('Y-m-d\TH:i:s.000\Z'),
    'receipt_type' => 'SALE',
    'store_id' => $STORE_ID,
    'order' => $orderTitle,
    'note' => $noteDetails,
    'total_money' => $totalMoney,
    'total_tax' => 0,
    'line_items' => $lineItems,
    'payments' => [
        [
            'payment_type_id' => $paymentTypeId,
            'money_amount' => $totalMoney,
            'paid_money' => $totalMoney
        ]
    ]
];

$loyRes = httpRequest("https://api.loyverse.com/v1.0/receipts", 'POST', [
    "Authorization: Bearer $LOYVERSE_TOKEN",
    "Content-Type: application/json"
], $payload);

if ($loyRes['status'] < 200 || $loyRes['status'] >= 300) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Error al comunicarse con Loyverse.',
        'details' => $loyRes['data']
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$receiptNumber = !empty($loyRes['data']['receipt_number']) ? $loyRes['data']['receipt_number'] : 'WEB';

// Descontar automáticamente del insumo maestro en Loyverse POS cuando se vende un plato derivado o porción adicional
$masterGroupLookup = [
    'grp_hamburguesas' => ['master' => '6d767227-33a4-4738-9bad-426be19362fe', 'variants' => ['8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', '6443424f-c859-44b2-81df-14b2259a1f5e', '4e4fef97-e474-4399-bd9c-a3018cc5f08e', 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', 'b34af2ce-02d8-426a-ab23-44a9c4b1f845']],
    'grp_pollo' => ['master' => 'c577b91a-a10f-4e1e-9911-a1f73b9f6c97', 'variants' => ['e4d1fbbf-1503-4317-94cb-acc75b1c913a', '060095b1-6642-4cb1-ae5a-2d2cd7c96334', '6906ccd6-cc74-4042-8601-e646c1129131', 'f1f36672-bc7c-41de-9961-ddd068380e4d', '9f238682-be0f-4853-91be-2824471e0ab0', '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', 'c526cfb0-c85d-466a-aa62-8b9ee2629d69']],
    'grp_filetes' => ['master' => '08d0e755-36f3-4253-b262-56430ea37cad', 'variants' => ['8e2a954c-1719-4be3-99b2-f220b80f40a8', '2bfa628d-bdfb-468b-aafa-ac351846b7de', 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea']],
    'grp_crispy' => ['master' => '5262de55-d870-46c2-aad9-25a7a096d8a0', 'variants' => ['57bf1904-69f2-427a-8731-afe078274a6d', 'd94b34ba-f604-44b9-b76c-08286adaff5e', '54ca71a0-bb6d-44de-b3a3-af21b46924c3', '60bc53aa-36cd-4650-9707-c082244fbf7c']],
    'grp_chorizos' => ['master' => '8fdde459-5909-49a4-a2c9-eacbec3efa18', 'variants' => ['9be1375d-d1ca-4ada-ab6d-55218b8a792d', '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', '6059ac60-e268-4809-9060-4253c62c24db', 'bc323c7e-358a-4853-855b-9e2f2beb1618']],
    'grp_pecho_broaster' => ['master' => 'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', 'variants' => ['47fd3400-d49d-49fa-9f9b-b749a89414bd']],
    'grp_encuentro_broaster' => ['master' => '7433770a-524e-46b1-b07d-1c6f4c2a7eb1', 'variants' => ['8d4008bc-a051-420f-bf69-d46e33878809']],
    'grp_ala_broaster' => ['master' => '8056dee7-40f6-4e43-bce8-a3344060997c', 'variants' => ['2177ce33-0135-45b7-9a43-60167b803e1f', 'df1e6c91-9f19-4dbd-a065-b4b021fc4843']],
    'grp_muzlo_broaster' => ['master' => '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', 'variants' => ['139e2101-3055-4fb7-9413-b33432f8e55f']]
];

$masterDeductions = [];
foreach ($lineItems as $li) {
    $soldVid = $li['variant_id'] ?? '';
    $soldQty = (int)($li['quantity'] ?? 1);
    if (!$soldVid || $soldQty <= 0) continue;
    foreach ($masterGroupLookup as $gInfo) {
        if (in_array($soldVid, $gInfo['variants'], true)) {
            $mVid = $gInfo['master'];
            $mult = ($soldVid === 'df1e6c91-9f19-4dbd-a065-b4b021fc4843') ? 2 : 1;
            $masterDeductions[$mVid] = ($masterDeductions[$mVid] ?? 0) + ($soldQty * $mult);
        }
    }
}

if (!empty($masterDeductions)) {
    $invCheck = httpRequest("https://api.loyverse.com/v1.0/inventory?store_ids=$STORE_ID&limit=250", 'GET', [
        "Authorization: Bearer $LOYVERSE_TOKEN"
    ]);
    $curInvMap = [];
    if (!empty($invCheck['data']['inventory_levels']) && is_array($invCheck['data']['inventory_levels'])) {
        foreach ($invCheck['data']['inventory_levels'] as $lvl) {
            $curInvMap[$lvl['variant_id']] = (float)$lvl['in_stock'];
        }
    }
    $adjPayload = [];
    foreach ($masterDeductions as $mVid => $deductQty) {
        if (array_key_exists($mVid, $curInvMap)) {
            $adjPayload[] = [
                'variant_id' => $mVid,
                'store_id' => $STORE_ID,
                'stock_after' => max(0, $curInvMap[$mVid] - $deductQty)
            ];
        }
    }
    if (!empty($adjPayload)) {
        httpRequest("https://api.loyverse.com/v1.0/inventory", 'POST', [
            "Authorization: Bearer $LOYVERSE_TOKEN",
            "Content-Type: application/json"
        ], ['inventory_levels' => $adjPayload]);
        @unlink(__DIR__ . '/data/loyverse_catalog_cache.json');
    }
}

// Enviar notificación a Telegram
$itemsLines = [];
foreach ($items as $it) {
    $qty = isset($it['qty']) ? (int)$it['qty'] : 1;
    $price = isset($it['price']) ? (float)$it['price'] : 0;
    $details = '';
    if (empty($it['isBeverage'])) {
        $ensaladaText = (isset($it['ensalada']) && $it['ensalada'] === 'no') ? '❌ _Sin ensalada_' : '🥗 _Con ensalada_';
        $papaText = '';
        if (!empty($it['allowsPotatoChoice'])) {
            $tp = isset($it['tipoPapa']) ? $it['tipoPapa'] : 'fritas';
            $papaName = $tp === 'hilo' ? 'Al Hilo' : ($tp === 'mixta' ? 'Mixtas (Fritas + Hilo)' : 'Fritas');
            $papaText = " • 🍟 _Papas:_ *$papaName*";
        }
        $cremasPedText = (!empty($it['cremasEnPedido']) && is_array($it['cremasEnPedido']))
            ? "\n    🥫 _Cremas:_ " . implode(', ', $it['cremasEnPedido'])
            : "\n    🥫 _Cremas:_ _Sin cremas_";
        $cremasApText = (!empty($it['cremasAparte']) && is_array($it['cremasAparte']))
            ? "\n    🥡 _Aparte:_ " . implode(', ', $it['cremasAparte'])
            : '';
        $pedCntTg = (!empty($it['cremasEnPedido']) && is_array($it['cremasEnPedido'])) ? count($it['cremasEnPedido']) : 0;
        $apCntTg = (!empty($it['cremasAparte']) && is_array($it['cremasAparte'])) ? count($it['cremasAparte']) : 0;
        $exCrCountTg = isset($it['cremasExtraCount']) ? (int)$it['cremasExtraCount'] : max(0, ($pedCntTg + $apCntTg) - $maxFreeCremas);
        $exCrCostTg = isset($it['cremasExtraCost']) ? (float)$it['cremasExtraCost'] : ($exCrCountTg * $extraCremaUnitPrice);
        $cremasExtraTgText = $exCrCountTg > 0
            ? "\n    🥫 _Cremas adicionales ({$exCrCountTg}):_ +S/ " . number_format($exCrCostTg, 2)
            : '';
        $extrasText = '';
        if (!empty($it['extras']) && is_array($it['extras'])) {
            $exArr = array_map(function($e) {
                return $e['name'] . ' (+S/ ' . number_format((float)$e['price'], 2) . ')';
            }, $it['extras']);
            $extrasText = "\n    🧀 _Adicionales:_ " . implode(', ', $exArr);
        }
        $noteItemText = (!empty($it['instrucciones']) && trim($it['instrucciones']) !== '')
            ? "\n    ✏️ _Detalle:_ \"" . trim($it['instrucciones']) . "\""
            : '';
        $details = "\n    $ensaladaText$papaText$cremasPedText$cremasApText$cremasExtraTgText$extrasText$noteItemText";
    }
    $itemsLines[] = "• *{$qty}x {$it['name']}* (S/ " . number_format($price * $qty, 2) . ")$details";
}

$nowLima = date('h:i A');
$locationBlock = "📍 *Modalidad:* 🛍️ A RECOGER EN LOCAL" . ($phone ? "\n📞 *Celular:* $phone" : '');
if ($orderType === 'A Enviar') {
    $buildingLine = $building ? "\n🏢 *Torre / Dpto:* $building" : '';
    $locationBlock = "📍 *Modalidad:* 🛵 A ENVIAR (Delivery)\n🏠 *Dirección:* $address$buildingLine\n📞 *Celular:* $phone";
}

$telegramMessage = "🍔 *¡NUEVO PEDIDO - MICHO BURGUER!*\n"
    . "━━━━━━━━━━━━━━━━━━━━\n"
    . "🧾 *Comanda:* #$receiptNumber\n"
    . "$locationBlock\n"
    . "👤 *Cliente:* $clientName\n"
    . "💳 *Pago:* $paymentLabel\n"
    . "📝 *Notas:* $notes\n"
    . "━━━━━━━━━━━━━━━━━━━━\n"
    . "🛒 *DETALLE:*\n"
    . implode("\n", $itemsLines) . "\n"
    . "━━━━━━━━━━━━━━━━━━━━\n"
    . "💰 *TOTAL A COBRAR:* S/ " . number_format($totalMoney, 2) . "\n"
    . "⏰ *Hora:* $nowLima";

$chatIds = array_filter(array_map('trim', explode(',', $TELEGRAM_CHATS)));
foreach ($chatIds as $chatId) {
    httpRequest("https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage", 'POST', [
        "Content-Type: application/json"
    ], [
        'chat_id' => $chatId,
        'text' => $telegramMessage,
        'parse_mode' => 'Markdown'
    ]);
}

echo json_encode([
    'success' => true,
    'receipt_number' => $receiptNumber,
    'order' => $orderTitle,
    'total' => $totalMoney,
    'data' => $loyRes['data']
], JSON_UNESCAPED_UNICODE);
