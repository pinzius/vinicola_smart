#include <Adafruit_Sensor.h>
#include <LiquidCrystal.h>

#include "DHT.h"

/*
Circuito: 
 * pin RS collegato al pin digitale 12 
 * pin E (Enable) collegato al pin digitale 11 
 * pin D4 collegato al pin digitale 5 
 * pin D5 collegato al pin digitale 4 
 * pin D6 collegato al pin digitale 3 
 * pin D7 collegato al pin digitale 2 
 * pin R/W collegato al GND 
 * pin 1 e pin 4 collegati a GND 
 * pin 2 collegato a +Vcc 
 * centrale del potenziometro/trimmer da 10 KOhm collegato al pin 3 del'LCD 
 * pin SX potenziometro/trimmer collegato a +Vcc 
 * pin DX potenziometro/trimmer collegato a GND 
 * i pin SX e DX del potenziometro/trimmer possono essere interscambiati 
*/  
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);  

//led rgb
#define pin_red 6
#define pin_green 9
#define pin_blu 10

//photoresistor
#define pin_photor A0
#define VIN 5
#define R 10000

int sensorVal;
int lux;

//dht11
#define DHTPIN 7
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);


void setup() {  
  //setup lcd
  lcd.begin(16, 2);  
  //setup led rgb
  pinMode(pin_red, OUTPUT);
  pinMode(pin_green, OUTPUT);
  pinMode(pin_blu, OUTPUT);

  colorLed(255,255,255);
  Serial.begin(9600);
  //dht.begin();
}  
  
void loop() {  

  sensorVal = analogRead(pin_photor);
  lux=sensorRawToPhys(sensorVal);
  lcd.setCursor(0, 0);
  lcd.print("Raw: ");
  lcd.print(sensorVal);
  lcd.print("Lux: ");
  lcd.print(lux);

/*
  lcd.setCursor(0, 1);    
  int t = dht.readTemperature();
  delay(100);
  int h = dht.readHumidity();

  lcd.print("T: ");
  lcd.print(t);
  lcd.print(" U: ");
  lcd.print(h);
  */
  Serial.print("t: ");
  Serial.println(dht.readTemperature());
  delay(1000);
  Serial.print("h: ");
  Serial.println(dht.readHumidity());

  delay(2000);
  
}  

int sensorRawToPhys(int raw){
  // Conversion rule
  float Vout = float(raw) * (VIN / float(1023));// Conversion analog to voltage
  float RLDR = (R * (VIN - Vout))/Vout; // Conversion voltage to resistance
  int phys=500/(RLDR/1000); // Conversion resitance to lumen
  return phys;
}

void colorLed(int r, int g, int b){
  analogWrite(pin_red,r);
  analogWrite(pin_green,g);
  analogWrite(pin_blu,b);
}
