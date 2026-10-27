import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawn, execFile, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function resolveArduinoCliPath(): string {
  if (
    process.env.ARDUINO_CLI_PATH &&
    fs.existsSync(process.env.ARDUINO_CLI_PATH)
  ) {
    return process.env.ARDUINO_CLI_PATH;
  }
  const candidates = [
    path.join(
      os.homedir(),
      'Downloads',
      'arduino-cli_1.5.1_Windows_64bit',
      'arduino-cli.exe'
    ),
    path.join(
      os.homedir(),
      'AppData',
      'Local',
      'Programs',
      'Arduino CLI',
      'arduino-cli.exe'
    ),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'arduino-cli';
}

function sanitizeTechnicalOutput(raw: string): string {
  return raw
    .replace(
      /MAC:\s*([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/g,
      'MAC: [REDACTED]'
    )
    .replace(/[A-Za-z]:\\Users\\[^\\/\r\n"]+/g, '<LOCAL_USER_PATH>');
}

interface LocalSerialMetadata {
  product: string | null;
  manufacturer: string | null;
}

interface EspChipProbe {
  chipModel: string | null;
  flashSize: string | null;
}

function readWindowsPnpSerialMetadata(): Promise<
  Map<string, LocalSerialMetadata>
> {
  return new Promise((resolve) => {
    execFile(
      'pnputil.exe',
      ['/enum-devices', '/class', 'Ports', '/connected'],
      { timeout: 4000, windowsHide: true },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(new Map());
          return;
        }

        const metadata = new Map<string, LocalSerialMetadata>();
        const blocks = stdout.split(/\r?\n\s*\r?\n/);
        for (const block of blocks) {
          const addressMatch = block.match(/\((COM\d+)\)/i);
          if (!addressMatch) continue;
          const address = addressMatch[1].toUpperCase();
          const lines = block.split(/\r?\n/).map((line) => line.trim());
          const productLine = lines.find((line) =>
            new RegExp(`\\(${address}\\)`, 'i').test(line)
          );
          const manufacturerLine = lines.find((line) =>
            /fabricante|manufacturer/i.test(line)
          );
          const valueAfterColon = (line: string | undefined) => {
            if (!line) return null;
            const separator = line.indexOf(':');
            const value = (separator >= 0 ? line.slice(separator + 1) : line).trim();
            return value || null;
          };
          metadata.set(address, {
            product: valueAfterColon(productLine),
            manufacturer: valueAfterColon(manufacturerLine),
          });
        }
        resolve(metadata);
      }
    );
  });
}

function resolveEspToolPath(): string | null {
  const roots = [
    path.join(
      os.homedir(),
      'AppData',
      'Local',
      'Arduino15',
      'packages',
      'esp32',
      'tools',
      'esptool_py'
    ),
    path.join(
      os.homedir(),
      '.arduino15',
      'packages',
      'esp32',
      'tools',
      'esptool_py'
    ),
  ];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const versions = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    for (const version of versions) {
      const candidates = [
        path.join(root, version, 'esptool.exe'),
        path.join(root, version, 'esptool'),
      ];
      const found = candidates.find((candidate) => fs.existsSync(candidate));
      if (found) return found;
    }
  }

  return null;
}

function readWindowsSerialMetadata(): Promise<Map<string, LocalSerialMetadata>> {
  if (process.platform !== 'win32') {
    return Promise.resolve(new Map());
  }

  const script = [
    '$ports = Get-CimInstance Win32_SerialPort -ErrorAction SilentlyContinue',
    '| Select-Object DeviceID,Name,Description,Manufacturer',
    '| ConvertTo-Json -Compress',
  ].join(' ');

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 4000, windowsHide: true },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          void readWindowsPnpSerialMetadata().then(resolve);
          return;
        }

        try {
          const parsed = JSON.parse(stdout) as
            | Record<string, unknown>
            | Array<Record<string, unknown>>;
          const entries = Array.isArray(parsed) ? parsed : [parsed];
          const metadata = new Map<string, LocalSerialMetadata>();

          for (const entry of entries) {
            const address = String(entry.DeviceID ?? '').trim().toUpperCase();
            if (!address) continue;
            const product = String(entry.Description ?? entry.Name ?? '').trim();
            const manufacturer = String(entry.Manufacturer ?? '').trim();
            metadata.set(address, {
              product: product || null,
              manufacturer: manufacturer || null,
            });
          }
          if (metadata.size > 0) {
            resolve(metadata);
          } else {
            void readWindowsPnpSerialMetadata().then(resolve);
          }
        } catch {
          void readWindowsPnpSerialMetadata().then(resolve);
        }
      }
    );
  });
}

/**
 * Sólo se consulta esptool cuando Arduino CLI no pudo determinar la familia.
 * La salida nunca se entrega completa al navegador: se extraen chip/flash y se
 * descartan MAC, seriales y cualquier otro identificador único.
 */
function probeEspChip(port: string): Promise<EspChipProbe> {
  const esptoolPath = resolveEspToolPath();
  if (!esptoolPath) {
    return Promise.resolve({ chipModel: null, flashSize: null });
  }

  return new Promise((resolve) => {
    execFile(
      esptoolPath,
      ['--port', port, 'chip_id'],
      { timeout: 10000, windowsHide: true },
      (_error, stdout, stderr) => {
        const output = `${stdout || ''}\n${stderr || ''}`;
        const chipMatch = output.match(/Chip is\s+([^\r\n]+)/i);
        const flashMatch = output.match(/Detected flash size:\s*([^\r\n]+)/i);
        resolve({
          chipModel: chipMatch?.[1]?.trim() ?? null,
          flashSize: flashMatch?.[1]?.trim() ?? null,
        });
      }
    );
  });
}

function readJsonBody(
  req: import('node:http').IncomingMessage
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function createHardwareBridgeVitePlugin(): Plugin {
  const activeSerialMonitors = new Map<string, ChildProcess>();

  async function stopSerialMonitorOnPort(port: string): Promise<void> {
    const existing = activeSerialMonitors.get(port);
    if (existing) {
      activeSerialMonitors.delete(port);
      try {
        existing.kill();
      } catch {
        // Ignore kill error
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  function ensureTempSketchFile(sketchCode: string): string {
    const sketchDir = path.join(
      os.tmpdir(),
      'bitech-iot-studio-v03',
      'bitech_live_sketch'
    );
    fs.mkdirSync(sketchDir, { recursive: true });
    const sketchFile = path.join(sketchDir, 'bitech_live_sketch.ino');
    fs.writeFileSync(sketchFile, sketchCode, 'utf8');

    // Si existe wifi_credentials.h local (excluido de Git) o variables de entorno, copiarlo al directorio temporal de compilación
    const localWifiHeader = path.resolve(process.cwd(), 'wifi_credentials.h');
    const targetWifiHeader = path.join(sketchDir, 'wifi_credentials.h');
    if (fs.existsSync(localWifiHeader)) {
      fs.copyFileSync(localWifiHeader, targetWifiHeader);
    } else if (process.env.BITECH_WIFI_SSID && process.env.BITECH_WIFI_PASS) {
      const headerContent = [
        '#ifndef BITECH_WIFI_CREDENTIALS_H',
        '#define BITECH_WIFI_CREDENTIALS_H',
        `#define WIFI_SSID "${process.env.BITECH_WIFI_SSID}"`,
        `#define WIFI_PASS "${process.env.BITECH_WIFI_PASS}"`,
        '#endif',
        '',
      ].join('\n');
      fs.writeFileSync(targetWifiHeader, headerContent, 'utf8');
    } else if (fs.existsSync(targetWifiHeader)) {
      fs.unlinkSync(targetWifiHeader);
    }

    return sketchDir;
  }

  return {
    name: 'bitech-local-hardware-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/hardware/')) {
          return next();
        }

        const cliPath = resolveArduinoCliPath();
        const parsedUrl = new URL(req.url, 'http://localhost');

        // 1. LISTAR PUERTOS SERIE DISPONIBLES
        if (
          req.method === 'GET' &&
          parsedUrl.pathname === '/api/hardware/ports'
        ) {
          execFile(
            cliPath,
            ['board', 'list', '--format', 'json'],
            { timeout: 10000 },
            async (err, stdout) => {
              res.setHeader('Content-Type', 'application/json');
              if (err) {
                res.statusCode = 200;
                res.end(JSON.stringify({ ports: [] }));
                return;
              }
              try {
                const parsed = JSON.parse(stdout) as {
                  detected_ports?: Array<{
                    port?: {
                      address?: string;
                      label?: string;
                      protocol?: string;
                      protocol_label?: string;
                      properties?: Record<string, string>;
                    };
                    matching_boards?: Array<{
                      name?: string;
                      fqbn?: string;
                    }>;
                  }>;
                };
                const rawList = parsed.detected_ports ?? [];
                const windowsMetadata = await readWindowsSerialMetadata();
                const ports = await Promise.all(
                  rawList
                    .filter((item) => Boolean(item.port?.address))
                    .map(async (item) => {
                    const address = item.port?.address ?? '';
                    const protocol = item.port?.protocol ?? 'serial';
                    const protocolLabel =
                      item.port?.protocol_label ?? 'Serial Port';
                    const isUsb =
                      protocolLabel.toLowerCase().includes('usb') ||
                      Boolean(item.port?.properties?.vid);
                    const matchingBoards = (item.matching_boards ?? [])
                      .filter((board) => Boolean(board.name || board.fqbn))
                      .map((board) => ({
                        name: board.name ?? 'Placa compatible',
                        fqbn: board.fqbn ?? '',
                      }));
                    const knownFamily = matchingBoards.some((board) =>
                      /ESP32|ESP8266|NODEMCU/i.test(
                        `${board.name} ${board.fqbn}`
                      )
                    );
                    const chipProbe =
                      isUsb && !knownFamily
                        ? await probeEspChip(address)
                        : { chipModel: null, flashSize: null };
                    const systemMetadata = windowsMetadata.get(
                      address.toUpperCase()
                    );
                    const friendlySuffix = isUsb
                      ? 'Puerto USB (Placa detectada)'
                      : 'Puerto serie del sistema';
                    return {
                      address,
                      label: `${address} — ${friendlySuffix}`,
                      protocol,
                      protocolLabel,
                      isUsb,
                      usbProduct: systemMetadata?.product ?? null,
                      usbManufacturer:
                        systemMetadata?.manufacturer ?? null,
                      matchingBoards,
                      chipModel: chipProbe.chipModel,
                      flashSize: chipProbe.flashSize,
                    };
                  })
                );
                ports.sort((a, b) => Number(b.isUsb) - Number(a.isUsb));

                res.statusCode = 200;
                res.end(JSON.stringify({ ports }));
              } catch {
                res.statusCode = 200;
                res.end(JSON.stringify({ ports: [] }));
              }
            }
          );
          return;
        }

        // 2. COMPILAR SKETCH (.ino) PARA NODEMCU ESP8266
        if (
          req.method === 'POST' &&
          parsedUrl.pathname === '/api/hardware/compile'
        ) {
          try {
            const body = await readJsonBody(req);
            const sketchCode = String(body.sketchCode ?? '');
            const fqbn = String(body.fqbn || 'esp8266:esp8266:nodemcuv2');

            const allowedFqbns = new Set([
              'esp8266:esp8266:nodemcuv2',
              'esp32:esp32:esp32cam',
            ]);
            if (!allowedFqbns.has(fqbn)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  summaryMessage:
                    'FQBN no habilitado para compilación directa en esta etapa.',
                  technicalDetails: `FQBN recibido: ${fqbn}`,
                  compiledAt: new Date().toISOString(),
                })
              );
              return;
            }

            const sketchDir = ensureTempSketchFile(sketchCode);
            execFile(
              cliPath,
              ['compile', '--fqbn', fqbn, sketchDir],
              { timeout: 120000 },
              (err, stdout, stderr) => {
                const combined = `${stdout || ''}\n${stderr || ''}`.trim();
                const sanitized = sanitizeTechnicalOutput(combined);
                const success = !err;

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success,
                    summaryMessage: success
                      ? 'Compilación correcta. Tu programa está listo para cargarse en la placa.'
                      : 'Se encontró un error al compilar el programa. Revisá los bloques o consultá los detalles técnicos.',
                    technicalDetails:
                      `Comando: arduino-cli compile --fqbn ${fqbn}\n\n` +
                      sanitized,
                    compiledAt: new Date().toISOString(),
                  })
                );
              }
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                summaryMessage: 'Error interno al iniciar la compilación.',
                technicalDetails: String(error),
                compiledAt: new Date().toISOString(),
              })
            );
          }
          return;
        }

        // 3. CARGAR SKETCH EN LA PLACA POR USB (CON PROGRESO EN VIVO Y REINTENTO SI EL PUERTO ESTÁ TRANSITORIAMENTE OCUPADO)
        if (
          req.method === 'POST' &&
          parsedUrl.pathname === '/api/hardware/upload'
        ) {
          try {
            const body = await readJsonBody(req);
            const port = String(body.port ?? '').trim();
            const fqbn = String(body.fqbn || 'esp8266:esp8266:nodemcuv2');
            const sketchCode = String(body.sketchCode ?? '');

            if (!port) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  summaryMessage: 'Seleccioná un puerto antes de cargar.',
                  technicalDetails: 'Puerto vacío.',
                  uploadedAt: new Date().toISOString(),
                })
              );
              return;
            }

            // Liberar el puerto si el Monitor Serie estaba abierto
            await stopSerialMonitorOnPort(port);

            const sketchDir = ensureTempSketchFile(sketchCode);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const sendEvent = (payload: Record<string, unknown>) => {
              res.write(JSON.stringify(payload) + '\n');
            };

            const runUploadAttempt = (
              attempt: number
            ): Promise<{ success: boolean; output: string; busyPort: boolean }> =>
              new Promise((resolve) => {
                sendEvent({
                  type: 'progress',
                  phase: 'connecting',
                  percentage: 5,
                  statusText:
                    attempt === 1
                      ? `Conectando con NodeMCU en ${port}...`
                      : `Reintentando conexión con ${port} (intento ${attempt}/3)...`,
                });

                const uploadProc = spawn(cliPath, [
                  'upload',
                  '-p',
                  port,
                  '--fqbn',
                  fqbn,
                  sketchDir,
                  '-v',
                ]);

                let attemptOutput = `Comando: arduino-cli upload -p ${port} --fqbn ${fqbn} -v\n\n`;
                let lastPercentage = 5;

                const handleChunk = (chunk: Buffer) => {
                  const text = chunk.toString();
                  attemptOutput += text;

                  if (/Connecting\.+/i.test(text) && lastPercentage < 10) {
                    lastPercentage = 10;
                    sendEvent({
                      type: 'progress',
                      phase: 'connecting',
                      percentage: 10,
                      statusText: `Conectando con la placa (${port})...`,
                      technicalDetails: sanitizeTechnicalOutput(attemptOutput),
                    });
                  }

                  const matches = [
                    ...text.matchAll(
                      /Writing at 0x[0-9a-fA-F]+\.\.\.\s*\((\d+)\s*%\)/g
                    ),
                  ];
                  if (matches.length > 0) {
                    const pct = Number(matches[matches.length - 1][1]);
                    if (!Number.isNaN(pct)) {
                      lastPercentage = pct;
                      sendEvent({
                        type: 'progress',
                        phase: 'uploading',
                        percentage: pct,
                        statusText: `Cargando en la placa (${pct}%)...`,
                        technicalDetails:
                          sanitizeTechnicalOutput(attemptOutput),
                      });
                    }
                  }

                  if (/Hash of data verified/i.test(text)) {
                    lastPercentage = 100;
                    sendEvent({
                      type: 'progress',
                      phase: 'uploading',
                      percentage: 100,
                      statusText: 'Carga al 100 %. Reiniciando placa...',
                      technicalDetails: sanitizeTechnicalOutput(attemptOutput),
                    });
                  }
                };

                uploadProc.stdout.on('data', handleChunk);
                uploadProc.stderr.on('data', handleChunk);

                uploadProc.on('close', (code) => {
                  const busyPort =
                    /PermissionError|Acceso denegado|could not open port/i.test(
                      attemptOutput
                    );
                  const verified =
                    code === 0 &&
                    /Hash of data verified/i.test(attemptOutput) &&
                    !busyPort &&
                    !/fatal esptool\.py error/i.test(attemptOutput);

                  resolve({
                    success: verified,
                    output: attemptOutput,
                    busyPort,
                  });
                });

                uploadProc.on('error', (err) => {
                  resolve({
                    success: false,
                    output: attemptOutput + '\n' + String(err),
                    busyPort: false,
                  });
                });
              });

            let finalOutcome = await runUploadAttempt(1);
            for (let retry = 2; retry <= 3; retry++) {
              if (finalOutcome.success || !finalOutcome.busyPort) {
                break;
              }
              await new Promise((r) => setTimeout(r, 1500));
              finalOutcome = await runUploadAttempt(retry);
            }

            sendEvent({
              type: 'result',
              success: finalOutcome.success,
              summaryMessage: finalOutcome.success
                ? 'Programa cargado. La placa está ejecutando tu proyecto.'
                : finalOutcome.busyPort
                ? `El puerto ${port} está siendo utilizado por otra aplicación (por ejemplo UltiMaker Cura o un monitor serie externo). Cerrá esa aplicación y volvé a intentar.`
                : `No se pudo completar la carga en ${port}. Verificá la conexión USB de la placa.`,
              technicalDetails: sanitizeTechnicalOutput(finalOutcome.output),
              uploadedAt: new Date().toISOString(),
            });
            res.end();
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                summaryMessage: 'Error interno durante la carga.',
                technicalDetails: String(error),
                uploadedAt: new Date().toISOString(),
              })
            );
          }
          return;
        }

        // 4. MONITOR SERIE EN VIVO (SSE STREAM)
        if (
          req.method === 'GET' &&
          parsedUrl.pathname === '/api/hardware/serial/stream'
        ) {
          const port = (parsedUrl.searchParams.get('port') ?? '').trim();
          const baudRate = Number(
            parsedUrl.searchParams.get('baudRate') ?? '115200'
          );

          if (!port || !/^[A-Za-z0-9_./-]+$/.test(port)) {
            res.statusCode = 400;
            res.end('Puerto inválido');
            return;
          }

          await stopSerialMonitorOnPort(port);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const sendSse = (payload: {
            type: 'data' | 'error' | 'status';
            text: string;
          }) => {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          };

          const psScript = `
$port = New-Object System.IO.Ports.SerialPort '${port}', ${baudRate}, 'None', 8, 'One'
$port.DtrEnable = $false
$port.RtsEnable = $false
$opened = $false
for ($i = 0; $i -lt 6; $i++) {
  try {
    $port.Open()
    $opened = $true
    break
  } catch {
    Start-Sleep -Milliseconds 600
  }
}
if (-not $opened) {
  Write-Error "No se pudo abrir ${port} (puerto ocupado o desconectado)."
  exit 1
}
try {
  while ($port.IsOpen) {
    if ($port.BytesToRead -gt 0) {
      $txt = $port.ReadExisting()
      Write-Host -NoNewline $txt
    }
    Start-Sleep -Milliseconds 80
  }
} finally {
  if ($port.IsOpen) { $port.Close() }
}
`.trim();

          const psProc = spawn('powershell.exe', [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            psScript,
          ]);

          activeSerialMonitors.set(port, psProc);

          psProc.stdout.on('data', (chunk: Buffer) => {
            sendSse({ type: 'data', text: chunk.toString('utf8') });
          });

          psProc.stderr.on('data', (chunk: Buffer) => {
            const msg = chunk.toString('utf8').trim();
            if (msg) {
              sendSse({
                type: 'error',
                text: `Error en puerto ${port}: ${msg}`,
              });
            }
          });

          psProc.on('close', () => {
            if (activeSerialMonitors.get(port) === psProc) {
              activeSerialMonitors.delete(port);
            }
            res.end();
          });

          req.on('close', () => {
            if (activeSerialMonitors.get(port) === psProc) {
              activeSerialMonitors.delete(port);
            }
            try {
              psProc.kill();
            } catch {
              // Ignore
            }
          });
          return;
        }

        // 5. DESCONECTAR MONITOR SERIE
        if (
          req.method === 'POST' &&
          parsedUrl.pathname === '/api/hardware/serial/disconnect'
        ) {
          try {
            const body = await readJsonBody(req);
            const port = String(body.port ?? '').trim();
            if (port) {
              await stopSerialMonitorOnPort(port);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ disconnected: true }));
          } catch {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ disconnected: false }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), createHardwareBridgeVitePlugin()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/evidence/**'],
    },
  },
});
