#include <Adafruit_Sensor.h>
#include <LiquidCrystal.h>

#include <DHT.h>
#include <DHT_U.h>

/*
Circuito: 
 * pin RS collegato al pin digitale 12 
 * pin E (Enable) collegato al pin digitale 11 
 * pin D4 collegato al pin digitale 5 
 * pin D5 collegato al pin digitale 4 
 * pin D6 collegato al pin digitale 3 
 * pin D7 collegato al pin digitale 7 
 * pin R/W collegato al GND 
 * pin 1 e pin 4 collegati a GND 
 * pin 2 collegato a +Vcc 
 * centrale del potenziometro/trimmer da 10 KOhm collegato al pin 3 del'LCD 
 * pin SX potenziometro/trimmer collegato a +Vcc 
 * pin DX potenziometro/trimmer collegato a GND 
 * i pin SX e DX del potenziometro/trimmer possono essere interscambiati 
*/  
LiquidCrystal lcd(12, 11, 5, 4, 3, 7);  

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
float hum;
float temp;

//dht11
#define DHTPIN 2
#define DHTTYPE DHT11

DHT_Unified dht(DHTPIN, DHTTYPE);

uint32_t delayMS;

int r;
int g;
int b;

int rounds;

void setup() {  
  //setup lcd
  lcd.begin(16, 2);  
  //setup led rgb
  pinMode(pin_red, OUTPUT);
  pinMode(pin_green, OUTPUT);
  pinMode(pin_blu, OUTPUT);

  colorLed(255,255,255);
  Serial.begin(9600);

  dht.begin();

  r=255;
  g=255;
  b=255;
  rounds=-1;

}  
  
void loop() {  

  if(rounds<1000&&rounds>-1){
    rounds++;
  }else{
    rounds = 0;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sens:1");

    sensorVal = analogRead(pin_photor);
    lux=sensorRawToPhys(sensorVal);
    lcd.print(" Lux:");
    lcd.print(lux);

    lcd.setCursor(0, 1);    
    sensors_event_t event;

    dht.temperature().getEvent(&event);
    if (isnan(event.temperature)) {
      lcd.print(F("ERR T "));
    }
    else {
      lcd.print("T:");
      temp = event.temperature;
      lcd.print(temp);
    }
    // Get humidity event and print its value.
    dht.humidity().getEvent(&event);
    if (isnan(event.relative_humidity)) {
      lcd.print(F("ERR H"));
    }
    else {
      lcd.print(" H:");
      hum = event.relative_humidity;
      lcd.print(hum);
    }

    Serial.println("1-"+String(lux)+"-"+String(temp)+"-"+String(hum));

    Serial.println("2-"+String(lux)+"-"+String(temp+2)+"-"+String(hum-1));
  }

  if(Serial.available() > 0) {
    r = Serial.read();
    g = Serial.read();
    b = Serial.read();
    colorLed(r,g,b);
  }

  delay(100);
  
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
