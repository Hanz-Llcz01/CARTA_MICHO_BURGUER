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

    $masterGroups = !empty($activeConfig['masterStockGroups']) && is_array($activeConfig['masterStockGroups'])
        ? $activeConfig['masterStockGroups']
        : [];

    foreach ($masterGroups as $group) {
        $masterVid = isset($group['masterVariantId']) ? $group['masterVariantId'] : '';
        $masterOut = !empty($stockStatus[$masterVid]['isOutOfStock']);
        $manualOut = !empty($group['manualOutOfStock']);
        if ($masterOut || $manualOut) {
            $gVariants = !empty($group['variants']) && is_array($group['variants']) ? $group['variants'] : [];
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
        $up = mb_strtoupper(trim((string)$name), 'UTF-8');
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
    $basePrice = isset($item['basePrice']) ? (float)$item['basePrice'] : max(0, $unitTotal - $extrasSum);
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
        $details = "\n    $ensaladaText$papaText$cremasPedText$cremasApText$extrasText$noteItemText";
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
