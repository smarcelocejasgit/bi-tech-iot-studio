// Bi-Tech IoT Studio — validación física mínima Camera Node OV3660
// Perfil manual: Camera Node Bi-Tech — ESP32-CAM
// FQBN: esp32:esp32:esp32cam
// Endpoints implementados por este firmware:
//   GET /capture       — captura JPEG individual en el puerto 80
//   GET :81/stream     — streaming MJPEG continuo en el puerto 81

#include <Arduino.h>
#include <WiFi.h>
#include "esp_camera.h"
#include "esp_http_server.h"

#if __has_include("wifi_credentials.h")
  #include "wifi_credentials.h"
#endif
#ifndef WIFI_SSID
  #define WIFI_SSID "SSID_PENDIENTE_CONFIGURACION"
#endif
#ifndef WIFI_PASS
  #define WIFI_PASS "PASS_PENDIENTE_CONFIGURACION"
#endif

// Mapa de pines AI-Thinker ESP32-CAM, validado primero con el adaptador USB actual.
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

static httpd_handle_t cameraHttpd = NULL;
static httpd_handle_t streamHttpd = NULL;

#define MJPEG_PART_BOUNDARY "bitech-camera-boundary"
static const char* MJPEG_CONTENT_TYPE =
  "multipart/x-mixed-replace;boundary=" MJPEG_PART_BOUNDARY;
static const char* MJPEG_BOUNDARY = "\r\n--" MJPEG_PART_BOUNDARY "\r\n";
static const char* MJPEG_PART_HEADER =
  "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

static const char* sensorName(uint16_t pid) {
  switch (pid) {
    case OV3660_PID: return "OV3660";
    case OV2640_PID: return "OV2640";
    case OV5640_PID: return "OV5640";
    default: return "UNKNOWN";
  }
}

static esp_err_t captureHandler(httpd_req_t* req) {
  camera_fb_t* frame = esp_camera_fb_get();
  if (frame == NULL) {
    Serial.println("Capture error: frame buffer unavailable");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }

  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
  const esp_err_t result = httpd_resp_send(
    req,
    reinterpret_cast<const char*>(frame->buf),
    frame->len
  );
  Serial.printf(
    "Capture served: %u bytes, %ux%u\n",
    static_cast<unsigned int>(frame->len),
    frame->width,
    frame->height
  );
  esp_camera_fb_return(frame);
  return result;
}

static esp_err_t streamHandler(httpd_req_t* req) {
  esp_err_t result = httpd_resp_set_type(req, MJPEG_CONTENT_TYPE);
  if (result != ESP_OK) return result;

  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  Serial.println("MJPEG stream client connected");

  uint32_t frameCount = 0;
  uint32_t reportStartedAt = millis();

  while (result == ESP_OK) {
    camera_fb_t* frame = esp_camera_fb_get();
    if (frame == NULL) {
      Serial.println("Stream error: frame buffer unavailable");
      result = ESP_FAIL;
      break;
    }

    if (frame->format != PIXFORMAT_JPEG) {
      Serial.println("Stream error: unexpected non-JPEG frame");
      esp_camera_fb_return(frame);
      result = ESP_FAIL;
      break;
    }

    char partHeader[64];
    const size_t headerLength = snprintf(
      partHeader,
      sizeof(partHeader),
      MJPEG_PART_HEADER,
      static_cast<unsigned int>(frame->len)
    );

    result = httpd_resp_send_chunk(req, MJPEG_BOUNDARY, strlen(MJPEG_BOUNDARY));
    if (result == ESP_OK) {
      result = httpd_resp_send_chunk(req, partHeader, headerLength);
    }
    if (result == ESP_OK) {
      result = httpd_resp_send_chunk(
        req,
        reinterpret_cast<const char*>(frame->buf),
        frame->len
      );
    }

    esp_camera_fb_return(frame);
    ++frameCount;

    const uint32_t now = millis();
    if (now - reportStartedAt >= 10000) {
      const float framesPerSecond =
        (frameCount * 1000.0f) / static_cast<float>(now - reportStartedAt);
      Serial.printf(
        "MJPEG stream: %.1f fps, free heap: %u, free PSRAM: %u\n",
        framesPerSecond,
        ESP.getFreeHeap(),
        ESP.getFreePsram()
      );
      frameCount = 0;
      reportStartedAt = now;
    }
  }

  Serial.printf("MJPEG stream client disconnected, result=0x%x\n", result);
  return result;
}

static bool startCaptureServer() {
  httpd_config_t serverConfig = HTTPD_DEFAULT_CONFIG();
  if (httpd_start(&cameraHttpd, &serverConfig) != ESP_OK) {
    Serial.println("HTTP server error: start failed");
    return false;
  }

  httpd_uri_t captureUri = {
    .uri = "/capture",
    .method = HTTP_GET,
    .handler = captureHandler,
    .user_ctx = NULL,
  };
  if (httpd_register_uri_handler(cameraHttpd, &captureUri) != ESP_OK) {
    Serial.println("HTTP server error: /capture registration failed");
    httpd_stop(cameraHttpd);
    cameraHttpd = NULL;
    return false;
  }
  return true;
}

static bool startStreamServer() {
  httpd_config_t streamConfig = HTTPD_DEFAULT_CONFIG();
  streamConfig.server_port = 81;
  streamConfig.ctrl_port = 32769;

  if (httpd_start(&streamHttpd, &streamConfig) != ESP_OK) {
    Serial.println("HTTP server error: stream server start failed");
    return false;
  }

  httpd_uri_t streamUri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = streamHandler,
    .user_ctx = NULL,
  };
  if (httpd_register_uri_handler(streamHttpd, &streamUri) != ESP_OK) {
    Serial.println("HTTP server error: /stream registration failed");
    httpd_stop(streamHttpd);
    streamHttpd = NULL;
    return false;
  }
  return true;
}

static bool connectWifi() {
  if (strcmp(WIFI_SSID, "SSID_PENDIENTE_CONFIGURACION") == 0) {
    Serial.println("WiFi error: local wifi_credentials.h is missing");
    return false;
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  const int networkCount = WiFi.scanNetworks(false, true);
  bool targetFound = false;
  int targetRssi = 0;
  int targetChannel = 0;
  if (networkCount >= 0) {
    for (int index = 0; index < networkCount; ++index) {
      if (WiFi.SSID(index) == WIFI_SSID) {
        targetFound = true;
        targetRssi = WiFi.RSSI(index);
        targetChannel = WiFi.channel(index);
        break;
      }
    }
  }
  Serial.printf(
    "WiFi scan: %d networks, target found: %s\n",
    networkCount,
    targetFound ? "yes" : "no"
  );
  if (targetFound) {
    Serial.printf("WiFi target signal: %d dBm, channel: %d\n", targetRssi, targetChannel);
  }
  WiFi.scanDelete();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi: connecting");
  for (int attempt = 0; attempt < 60 && WiFi.status() != WL_CONNECTED; ++attempt) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("WiFi error: connection timeout, status=%d\n", WiFi.status());
    return false;
  }

  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("Bi-Tech Camera Node — OV3660 physical validation");
  Serial.println("FQBN: esp32:esp32:esp32cam");

  const bool hasPsram = psramFound();
  Serial.printf("PSRAM: %s\n", hasPsram ? "detected" : "not detected");

  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = hasPsram ? 2 : 1;
  config.grab_mode = hasPsram ? CAMERA_GRAB_LATEST : CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = hasPsram ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;

  const esp_err_t cameraResult = esp_camera_init(&config);
  if (cameraResult != ESP_OK) {
    Serial.printf("Camera init error: 0x%x\n", cameraResult);
    Serial.printf("Free heap: %u bytes\n", ESP.getFreeHeap());
    return;
  }

  sensor_t* sensor = esp_camera_sensor_get();
  if (sensor == NULL) {
    Serial.println("Camera init error: sensor descriptor unavailable");
    return;
  }

  Serial.printf("Sensor PID: 0x%04x\n", sensor->id.PID);
  Serial.printf("Sensor detected: %s\n", sensorName(sensor->id.PID));

  if (sensor->id.PID == OV3660_PID) {
    // Ajustes recomendados por el ejemplo oficial de ESP32 CameraWebServer.
    sensor->set_vflip(sensor, 1);
    sensor->set_brightness(sensor, 1);
    sensor->set_saturation(sensor, -2);
    Serial.println("OV3660 adjustments: vflip=1 brightness=1 saturation=-2");
  }
  sensor->set_framesize(sensor, FRAMESIZE_VGA);
  Serial.println("Camera ready");
  Serial.println("Resolution: VGA (640x480)");
  Serial.println("Pixel format: JPEG");
  Serial.printf("Free heap: %u bytes\n", ESP.getFreeHeap());
  Serial.printf("Free PSRAM: %u bytes\n", ESP.getFreePsram());

  if (!connectWifi()) return;
  if (!startCaptureServer()) return;
  if (!startStreamServer()) return;

  Serial.println("HTTP camera servers ready");
  Serial.print("Capture endpoint: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/capture");
  Serial.print("MJPEG stream endpoint: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream");
}

void loop() {
  delay(1000);
}
