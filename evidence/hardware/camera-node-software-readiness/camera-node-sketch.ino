// ============================================================================
// BI-TECH IoT STUDIO · SKETCH COMPILABLE PARA HARDWARE REAL (.ino)
// Perfil: Camera Node Bi-Tech (ESP32-CAM · OV2640)
// FQBN candidato de compilación: esp32:esp32:esp32cam
// Supuesto de modelo: Candidato de compilación: AI-Thinker ESP32-CAM (OV2640). El modelo físico exacto y su mapa de pines se confirmarán al conectar la placa real en V0.4B.
// Canal programación: USB | Canal streaming: Wi-Fi
// Credenciales Wi-Fi: Placeholders seguros (configurar en wifi_credentials.h excluido de Git)
// ============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include "esp_camera.h"
#include "esp_http_server.h"

// --- Configuración segura de credenciales Wi-Fi (sin secretos en el repositorio) ---
#if __has_include("wifi_credentials.h")
  #include "wifi_credentials.h"
#endif
#ifndef WIFI_SSID
  #define WIFI_SSID "SSID_PENDIENTE_CONFIGURACION"
#endif
#ifndef WIFI_PASS
  #define WIFI_PASS "PASS_PENDIENTE_CONFIGURACION"
#endif

// --- Mapa de pines candidato: AI-Thinker ESP32-CAM (OV2640) ---
// NOTA: Sujeto a verificación física al conectar la placa en V0.4B.
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// --- Prototipos de funciones ---
void configurarCamara();
void seleccionarResolucion(const char* resolucion);
void configurarCalidad(int calidad);
void iniciarCamara();
void conectarWiFi(const char* ssid, const char* pass);
void iniciarStreaming();
void detenerStreaming();
void tomarCaptura();
bool estadoCamara();

void setup() {
  Serial.begin(115200);
  configurarCamara();
  seleccionarResolucion("SVGA (800x600)");
  configurarCalidad(10);
  iniciarCamara();
  conectarWiFi(WIFI_SSID, WIFI_PASS); // Red: SSID_PENDIENTE_CONFIGURACION
  iniciarStreaming();
}

void loop() {
  tomarCaptura();
  delay(10000);
}

// ============================================================================
// FUNCIONES AUXILIARES DE HARDWARE (Implementación compilable ESP32-CAM)
// ============================================================================

static camera_config_t cameraConfig;
static bool cameraConfigured = false;
static bool cameraInitialized = false;
static httpd_handle_t streamHttpd = NULL;

static framesize_t mapearResolucion(const char* resolucion) {
  if (strstr(resolucion, "QVGA") != NULL) return FRAMESIZE_QVGA;
  if (strstr(resolucion, "CIF") != NULL)  return FRAMESIZE_CIF;
  if (strstr(resolucion, "VGA") != NULL && strstr(resolucion, "SVGA") == NULL) return FRAMESIZE_VGA;
  if (strstr(resolucion, "XGA") != NULL)  return FRAMESIZE_XGA;
  return FRAMESIZE_SVGA;
}

void configurarCamara() {
  cameraConfig.ledc_channel = LEDC_CHANNEL_0;
  cameraConfig.ledc_timer = LEDC_TIMER_0;
  cameraConfig.pin_d0 = Y2_GPIO_NUM;
  cameraConfig.pin_d1 = Y3_GPIO_NUM;
  cameraConfig.pin_d2 = Y4_GPIO_NUM;
  cameraConfig.pin_d3 = Y5_GPIO_NUM;
  cameraConfig.pin_d4 = Y6_GPIO_NUM;
  cameraConfig.pin_d5 = Y7_GPIO_NUM;
  cameraConfig.pin_d6 = Y8_GPIO_NUM;
  cameraConfig.pin_d7 = Y9_GPIO_NUM;
  cameraConfig.pin_xclk = XCLK_GPIO_NUM;
  cameraConfig.pin_pclk = PCLK_GPIO_NUM;
  cameraConfig.pin_vsync = VSYNC_GPIO_NUM;
  cameraConfig.pin_href = HREF_GPIO_NUM;
  cameraConfig.pin_sccb_sda = SIOD_GPIO_NUM;
  cameraConfig.pin_sccb_scl = SIOC_GPIO_NUM;
  cameraConfig.pin_pwdn = PWDN_GPIO_NUM;
  cameraConfig.pin_reset = RESET_GPIO_NUM;
  cameraConfig.xclk_freq_hz = 20000000;
  cameraConfig.pixel_format = PIXFORMAT_JPEG;
  cameraConfig.frame_size = FRAMESIZE_SVGA;
  cameraConfig.jpeg_quality = 10;
  cameraConfig.fb_count = psramFound() ? 2 : 1;
  cameraConfigured = true;
}

void seleccionarResolucion(const char* resolucion) {
  if (!cameraConfigured) configurarCamara();
  framesize_t fs = mapearResolucion(resolucion);
  cameraConfig.frame_size = fs;
  if (cameraInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s != NULL) s->set_framesize(s, fs);
  }
}

void configurarCalidad(int calidad) {
  if (!cameraConfigured) configurarCamara();
  int q = calidad < 10 ? 10 : (calidad > 63 ? 63 : calidad);
  cameraConfig.jpeg_quality = q;
  if (cameraInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s != NULL) s->set_quality(s, q);
  }
}

void iniciarCamara() {
  if (!cameraConfigured) configurarCamara();
  esp_err_t err = esp_camera_init(&cameraConfig);
  if (err != ESP_OK) {
    Serial.printf("Camera init error: 0x%x\n", err);
    cameraInitialized = false;
    return;
  }
  cameraInitialized = true;
  Serial.println("Camera ready");
}

void conectarWiFi(const char* ssid, const char* pass) {
  if (strcmp(ssid, "SSID_PENDIENTE_CONFIGURACION") == 0) {
    Serial.println("WiFi placeholder activo: configurar SSID y PASS antes de la prueba fisica.");
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Serial.print("Connecting to WiFi");
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection timeout");
  }
}

static esp_err_t captureHandler(httpd_req_t* req) {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  httpd_resp_set_type(req, "image/jpeg");
  esp_err_t res = httpd_resp_send(req, (const char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return res;
}

void iniciarStreaming() {
  if (!cameraInitialized || streamHttpd != NULL) return;
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  if (httpd_start(&streamHttpd, &config) == ESP_OK) {
    httpd_uri_t captureUri = {
      .uri       = "/capture",
      .method    = HTTP_GET,
      .handler   = captureHandler,
      .user_ctx  = NULL
    };
    httpd_register_uri_handler(streamHttpd, &captureUri);
    Serial.println("Streaming started");
  }
}

void detenerStreaming() {
  if (streamHttpd != NULL) {
    httpd_stop(streamHttpd);
    streamHttpd = NULL;
    Serial.println("Streaming stopped");
  }
}

void tomarCaptura() {
  if (!cameraInitialized) return;
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    return;
  }
  Serial.printf("Capture OK (%u bytes)\n", (unsigned int)fb->len);
  esp_camera_fb_return(fb);
}

bool estadoCamara() {
  return cameraInitialized;
}

