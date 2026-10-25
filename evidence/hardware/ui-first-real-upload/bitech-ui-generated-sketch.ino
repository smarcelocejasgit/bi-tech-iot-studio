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
#define SALIDA_DIG_PIN  LED_BUILTIN  // LED_BUILTIN (Salida Digital / LED Integrado de Placa (LED_BUILTIN))

// --- Prototipos de funciones ---
int leerEntradaAnalogicaA0();
int leerHumedadSuelo();
int leerNivelLuz();
int leerEntradaDigital();
void relayOn();
void relayOff();
void luzOn();
void luzOff();
void activarSalidaDigital();
void desactivarSalidaDigital();
void registrarDato(const char* etiqueta, float valor);

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LUZ_PIN, OUTPUT);
  pinMode(SALIDA_DIG_PIN, OUTPUT);
  pinMode(ENTRADA_DIG_PIN, INPUT);
  Serial.println();
  Serial.println("Bi-Tech IoT Studio");
  Serial.println("NodeMCU conectada");
  relayOff();
}

void loop() {
  int suelo = leerHumedadSuelo();
  registrarDato("Humedad suelo", suelo);
  if (suelo > 800) {
    relayOn();
  } else {
    relayOff();
  }
  delay(1000);
}

// ============================================================================
// FUNCIONES AUXILIARES DE HARDWARE (Implementación compilable NodeMCU ESP8266)
// ============================================================================

int leerEntradaAnalogicaA0() {
  // Lectura cruda del ADC de 10 bits (0 - 1023).
  // Rango eléctrico A0 (adcInputVoltageRange): unverified (depende del divisor resistivo de la placa).
  return analogRead(ANALOG_A0_PIN);
}

int leerHumedadSuelo() {
  // En NodeMCU ESP8266 el sensor analógico de humedad de suelo se conecta al único canal A0 (0 - 1023).
  return analogRead(ANALOG_A0_PIN);
}

int leerNivelLuz() {
  return analogRead(ANALOG_A0_PIN);
}

int leerEntradaDigital() {
  return digitalRead(ENTRADA_DIG_PIN);
}

void relayOn() {
  // Polaridad configurada en perfil: PENDING_VERIFICATION
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("Relay ON");
}

void relayOff() {
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("Relay OFF");
}

void luzOn() {
  digitalWrite(LUZ_PIN, HIGH);
}

void luzOff() {
  digitalWrite(LUZ_PIN, LOW);
}

void activarSalidaDigital() {
  // En NodeMCU ESP8266, LED_BUILTIN es activo en nivel bajo (LOW enciende el LED integrado)
  digitalWrite(SALIDA_DIG_PIN, LOW);
  Serial.println("Salida ON");
}

void desactivarSalidaDigital() {
  digitalWrite(SALIDA_DIG_PIN, HIGH);
  Serial.println("Salida OFF");
}

void registrarDato(const char* etiqueta, float valor) {
  Serial.print(etiqueta);
  Serial.print(": ");
  if (isnan(valor)) {
    Serial.println("Error de lectura (NaN)");
    return;
  }
  if (strstr(etiqueta, "suelo") != NULL || strstr(etiqueta, "Suelo") != NULL || strstr(etiqueta, "A0") != NULL) {
    Serial.println((int)valor);
    return;
  }
  Serial.print(valor, 1);
  if (strncmp(etiqueta, "Temp", 4) == 0 || strncmp(etiqueta, "temp", 4) == 0) {
    Serial.println(" °C");
  } else if (strncmp(etiqueta, "Hum", 3) == 0 || strncmp(etiqueta, "hum", 3) == 0) {
    Serial.println(" %");
  } else {
    Serial.println();
  }
}

