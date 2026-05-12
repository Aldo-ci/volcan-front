<?php

require __DIR__ . '/vendor/autoload.php';

use Mike42\Escpos\EscposImage;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

const RECEIPT_PRINTER_NAME = 'TICKETS';
const RECEIPT_COPY_LABELS = ['VENDEDOR', 'CLIENTE'];

date_default_timezone_set('America/Mexico_City');

function handleReceiptRequest(string $ticketTitle): void
{
    sendCorsHeaders();

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['status' => 'error', 'message' => 'Metodo no permitido'], 405);
    }

    $payload = readReceiptPayload();

    try {
        $connector = new WindowsPrintConnector(RECEIPT_PRINTER_NAME);
        $printer = new Printer($connector);

        try {
            foreach (RECEIPT_COPY_LABELS as $copyLabel) {
                printReceiptCopy($printer, $payload, $ticketTitle, $copyLabel);
            }
        } finally {
            $printer->close();
        }

        jsonResponse([
            'status' => 'success',
            'message' => $ticketTitle . ' impreso correctamente.',
            'saleId' => $payload['saleId'],
        ]);
    } catch (Exception $e) {
        jsonResponse([
            'status' => 'error',
            'message' => 'Error al imprimir: ' . $e->getMessage(),
        ], 500);
    }
}

function sendCorsHeaders(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Content-Type: application/json; charset=UTF-8');
}

function jsonResponse(array $body, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit();
}

function readReceiptPayload(): array
{
    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody, true);

    if (!is_array($input)) {
        jsonResponse(['status' => 'error', 'message' => 'JSON invalido.'], 400);
    }

    if (!isset($input['data']) || !is_array($input['data']) || count($input['data']) === 0) {
        jsonResponse(['status' => 'error', 'message' => 'Se requiere data con al menos un producto.'], 400);
    }

    $items = [];
    foreach ($input['data'] as $index => $item) {
        if (!is_array($item)) {
            jsonResponse(['status' => 'error', 'message' => "Producto invalido en posicion $index."], 400);
        }

        $name = trim((string)($item['nombre'] ?? ''));
        $quantity = (float)($item['cantidad'] ?? 0);
        $unitPrice = (float)($item['precio'] ?? 0);
        $lineSubtotal = (float)($item['subtotal'] ?? ($unitPrice * $quantity));

        if ($name === '' || $quantity <= 0) {
            jsonResponse(['status' => 'error', 'message' => "Producto incompleto en posicion $index."], 400);
        }

        $items[] = [
            'nombre' => $name,
            'cantidad' => $quantity,
            'precio' => $unitPrice,
            'subtotal' => $lineSubtotal,
        ];
    }

    return [
        'saleId' => trim((string)($input['saleId'] ?? '')),
        'occurredAt' => trim((string)($input['occurredAt'] ?? '')),
        'hasDiscount' => (bool)($input['hasDiscount'] ?? false),
        'subtotal' => (float)($input['subtotal'] ?? 0),
        'discountTotal' => (float)($input['discountTotal'] ?? 0),
        'total' => (float)($input['total'] ?? 0),
        'data' => $items,
    ];
}

function printReceiptCopy(Printer $printer, array $payload, string $ticketTitle, string $copyLabel): void
{
    printLogo($printer);

    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->setTextSize(2, 2);
    $printer->text("VENTAS VOLCAN\n");
    $printer->setTextSize(1, 1);
    $printer->text($ticketTitle . "\n");
    $printer->text("** COPIA: $copyLabel **\n");
    $printer->text(formatReceiptDate($payload['occurredAt']) . "\n");

    if ($payload['saleId'] !== '') {
        $printer->text('Ticket: ' . substr($payload['saleId'], 0, 8) . "\n");
    }

    $printer->text("--------------------------------\n");

    $printer->setJustification(Printer::JUSTIFY_LEFT);
    $printer->text("Cant. Producto       Importe\n");
    $printer->text("--------------------------------\n");

    foreach ($payload['data'] as $item) {
        $line = sprintf(
            "%-4s%-16s%8s\n",
            formatQuantity($item['cantidad']),
            truncateText($item['nombre'], 16),
            number_format($item['subtotal'], 2)
        );
        $printer->text($line);
    }

    $printer->text("--------------------------------\n");

    $printer->setJustification(Printer::JUSTIFY_RIGHT);
    $printer->text('SUBTOTAL: $' . number_format($payload['subtotal'], 2) . "\n");

    if ($payload['hasDiscount'] || $payload['discountTotal'] > 0) {
        $printer->text('DESCUENTO: -$' . number_format($payload['discountTotal'], 2) . "\n");
    }

    $printer->setEmphasis(true);
    $printer->text('TOTAL: $' . number_format($payload['total'], 2) . "\n");
    $printer->setEmphasis(false);

    $printer->feed(3);
    $printer->cut();
}

function printLogo(Printer $printer): void
{
    foreach (['logo.png', 'logo.jpg', 'logo.jpeg'] as $fileName) {
        $path = __DIR__ . DIRECTORY_SEPARATOR . $fileName;

        if (!file_exists($path)) {
            continue;
        }

        try {
            $logo = EscposImage::load($path, false);
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->bitImage($logo);
            $printer->feed();
        } catch (Exception $e) {
            error_log('Error al cargar logo: ' . $e->getMessage());
        }

        return;
    }
}

function formatReceiptDate(string $value): string
{
    if ($value === '') {
        return date('d/m/Y H:i');
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return date('d/m/Y H:i');
    }

    return date('d/m/Y H:i', $timestamp);
}

function formatQuantity(float $quantity): string
{
    if (floor($quantity) == $quantity) {
        return (string)((int)$quantity);
    }

    return rtrim(rtrim(number_format($quantity, 2), '0'), '.');
}

function truncateText(string $value, int $length): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $length, 'UTF-8');
    }

    return substr($value, 0, $length);
}
