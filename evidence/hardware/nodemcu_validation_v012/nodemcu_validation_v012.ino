// ============================================================================
// BI-TECH IoT STUDIO · SKETCH COMPILABLE PARA HARDWARE REAL (.ino)
// Perfil: NodeMCU (ESP8266)
// FQBN verificado: esp8266:esp8266:nodemcuv2
// adcInputVoltageRange: unverified (escala cruda 0-1023)
// NOTA: Asignación de pines con distinción Etiqueta de placa (Dx) -> GPIO real.
// Cableado definitivo de aula pendiente de verificación física.
// ============================================================================

#include <Arduino.h>

// --- Mapeo de pines: Etiqueta serigrafiada en placa NodeMCU -> GPIO ESP8266 ---
#define ANALOG_A0_PIN   A0  // A0 -> A0 (Única Entrada Analógica (A0 · escala bruta 0 a 1023))
#define RELAY_PIN       5   // D1 -> GPIO5 (Módulo Relay (1 canal))
#define DHT_PIN         14  // D5 -> GPIO14 (Sensor DHT11 (Temperatura y Humedad Ambiente))
#define ENTRADA_DIG_PIN 12  // D6 -> GPIO12 (Entrada Digital (Pulsador / Sensor binario))
#define LUZ_PIN         4   // D2 -> GPIO4 (Iluminación LED)
#define SALIDA_DIG_PIN  13  // D7 -> GPIO13 (Salida Digital de Propósito General (Indicador))

// --- Prototipos de funciones ---
int leerEntradaAnalogicaA0();
int leerEntradaDigital();
void relayOn();
void relayOff();
void luzOn();
void luzOff();
void activarSalidaDigital();
void desactivarSalidaDigital();

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LUZ_PIN, OUTPUT);
  pinMode(SALIDA_DIG_PIN, OUTPUT);
  pinMode(ENTRADA_DIG_PIN, INPUT);
  relayOff();
}

void loop() {
  int valorA0 = leerEntradaAnalogicaA0();
  if (valorA0 < 400) {
    relayOn();
  } else {
    relayOff();
  }
}

// ============================================================================
// FUNCIONES AUXILIARES DE HARDWARE (Implementación compilable NodeMCU ESP8266)
// ============================================================================

int leerEntradaAnalogicaA0() {
  // Lectura cruda del ADC de 10 bits (0 - 1023).
  // Rango eléctrico A0 (adcInputVoltageRange): unverified (depende del divisor resistivo de la placa).
  return analogRead(ANALOG_A0_PIN);
}

int leerEntradaDigital() {
  return digitalRead(ENTRADA_DIG_PIN);
}

void relayOn() {
  digitalWrite(RELAY_PIN, HIGH);
}

void relayOff() {
  digitalWrite(RELAY_PIN, LOW);
}

void luzOn() {
  digitalWrite(LUZ_PIN, HIGH);
}

void luzOff() {
  digitalWrite(LUZ_PIN, LOW);
}

void activarSalidaDigital() {
  digitalWrite(SALIDA_DIG_PIN, HIGH);
}

void desactivarSalidaDigital() {
  digitalWrite(SALIDA_DIG_PIN, LOW);
}
