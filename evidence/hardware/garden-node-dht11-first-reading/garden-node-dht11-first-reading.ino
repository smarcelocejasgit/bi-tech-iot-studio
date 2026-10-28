#include <Arduino.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include "bitech_gateway_root_ca.h"

#if __has_include("wifi_credentials.h")
  #include "wifi_credentials.h"
#endif
#ifndef WIFI_SSID
  #define WIFI_SSID "SSID_PENDIENTE_CONFIGURACION"
#endif
#ifndef WIFI_PASS
  #define WIFI_PASS "PASS_PENDIENTE_CONFIGURACION"
#endif

#if __has_include("device_credentials.h")
  #include "device_credentials.h"
#endif
#ifndef BITECH_DEVICE_TOKEN
  #define BITECH_DEVICE_TOKEN "TOKEN_PENDIENTE_CONFIGURACION"
#endif
#ifndef BITECH_GATEWAY_URL
  #define BITECH_GATEWAY_URL "HTTPS_GATEWAY_PENDIENTE_CONFIGURACION"
#endif
#ifndef BITECH_CHANNEL
  #define BITECH_CHANNEL 1
#endif

// Pin temporal de validación física. No forma parte todavía del perfil permanente.
constexpr uint8_t DHT_PIN = 21;
constexpr uint8_t DHT_TYPE = DHT11;
constexpr uint32_t TELEMETRY_INTERVAL_MS = 10000;

DHT dht(DHT_PIN, DHT_TYPE);

uint32_t lecturasValidas = 0;
uint32_t erroresDht = 0;
uint32_t ultimaTelemetriaMs = 0;

bool sincronizarHoraTls() {
  configTime(0, 0, "time.google.com", "pool.ntp.org");
  const uint32_t inicio = millis();
  while (time(nullptr) < 1700000000 && millis() - inicio < 12000) {
    delay(250);
  }
  return time(nullptr) >= 1700000000;
}

void conectarWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("WiFi: conectando");
  uint8_t intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 40) {
    delay(500);
    Serial.print('.');
    intentos++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi: conectado");
    Serial.print("IP local: ");
    Serial.println(WiFi.localIP());
    Serial.println(
      sincronizarHoraTls()
        ? "TLS: reloj sincronizado"
        : "TLS_ERROR: no se pudo sincronizar el reloj"
    );
  } else {
    Serial.println("WiFi: error de conexion");
  }
}

void enviarTelemetria(float temperatura, float humedad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("TELEMETRY_ERROR: WiFi desconectado");
    return;
  }
  if (strcmp(BITECH_DEVICE_TOKEN, "TOKEN_PENDIENTE_CONFIGURACION") == 0) {
    Serial.println("TELEMETRY_ERROR: token local no configurado");
    return;
  }
  if (strncmp(BITECH_GATEWAY_URL, "https://", 8) != 0) {
    Serial.println("TELEMETRY_ERROR: gateway HTTPS local no configurado");
    return;
  }
  if (BITECH_CHANNEL < 1 || BITECH_CHANNEL > 9) {
    Serial.println("TELEMETRY_ERROR: canal fuera del rango 1-9");
    return;
  }
  if (time(nullptr) < 1700000000) {
    Serial.println("TELEMETRY_ERROR: reloj TLS no sincronizado");
    return;
  }

  WiFiClientSecure client;
  client.setCACert(BITECH_GATEWAY_ROOT_CA);

  HTTPClient https;
  if (!https.begin(client, BITECH_GATEWAY_URL)) {
    Serial.println("TELEMETRY_ERROR: no se pudo iniciar HTTPS");
    return;
  }

  char payload[128];
  snprintf(
    payload,
    sizeof(payload),
    "{\"channel\":%u,\"temperature\":%.1f,\"humidity\":%.1f,\"status\":\"online\"}",
    static_cast<unsigned>(BITECH_CHANNEL),
    temperatura,
    humedad
  );

  https.addHeader("Content-Type", "application/json");
  https.addHeader("Authorization", String("Bearer ") + BITECH_DEVICE_TOKEN);
  const int responseCode = https.POST(reinterpret_cast<uint8_t*>(payload), strlen(payload));
  Serial.print("Telemetria HTTPS: ");
  Serial.println(responseCode);
  https.end();
}

void setup() {
  Serial.begin(115200);

  Serial.println();
  Serial.println("Bi-Tech Garden Node - DHT11 GPIO21");
  Serial.print("Canal Bi-Tech: ");
  Serial.println(BITECH_CHANNEL);
  Serial.println("Inicio de lectura fisica");

  // Diagnóstico eléctrico no destructivo del puerto de señal.
  pinMode(DHT_PIN, INPUT);
  delay(50);
  Serial.print("DATA flotante: ");
  Serial.println(digitalRead(DHT_PIN) == HIGH ? "HIGH" : "LOW");

  pinMode(DHT_PIN, INPUT_PULLDOWN);
  delay(50);
  Serial.print("DATA con pull-down interno: ");
  Serial.println(digitalRead(DHT_PIN) == HIGH ? "HIGH" : "LOW");

  dht.begin();

  // El DHT11 necesita estabilizarse antes de la primera lectura.
  delay(2000);
  conectarWiFi();
}

void loop() {
  const float temperatura = dht.readTemperature();
  const float humedad = dht.readHumidity();

  if (isnan(temperatura) || isnan(humedad)) {
    erroresDht++;
    Serial.print("DHT_ERROR #");
    Serial.print(erroresDht);
    Serial.println(": lectura invalida (NaN)");
  } else {
    lecturasValidas++;
    Serial.print("Muestra ");
    Serial.print(lecturasValidas);
    Serial.print(" | Temperatura: ");
    Serial.print(temperatura, 1);
    Serial.print(" C | Humedad: ");
    Serial.print(humedad, 1);
    Serial.print(" % | WiFi: ");
    Serial.println(WiFi.status() == WL_CONNECTED ? "conectado" : "desconectado");

    const uint32_t ahora = millis();
    if (
      ultimaTelemetriaMs == 0 ||
      ahora - ultimaTelemetriaMs >= TELEMETRY_INTERVAL_MS
    ) {
      ultimaTelemetriaMs = ahora;
      enviarTelemetria(temperatura, humedad);
    }
  }

  delay(2000);
}
