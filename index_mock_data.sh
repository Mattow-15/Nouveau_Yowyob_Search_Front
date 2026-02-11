#!/bin/bash
API_URL="http://localhost:8080/api/search/index"

# 1. Pharmacie EMIA (Exactement à Melen) - Pharmacie
curl -X POST $API_URL   -H "Content-Type: application/json"   -d '{
    "name": "Pharmacie EMIA",
    "description": "Pharmacie de garde ouverte 24h/24, située juste en face de l'\''entrée de l'\''EMIA à Melen.",
    "price": 0,
    "category": "Santé",
    "type": "listing",
    "city": "Yaoundé",
    "latitude": 3.8470,
    "longitude": 11.5020,
    "images": ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80"]
  }'
echo " Indexed Pharmacie EMIA"

# 2. Donut's Family (Tout près) - Restaurant/Snack
curl -X POST $API_URL   -H "Content-Type: application/json"   -d '{
    "name": "Donuts Family Melen",
    "description": "Les meilleurs beignets et yaourts de Yaoundé. Snack rapide et pas cher.",
    "price": 500,
    "category": "Restaurant",
    "type": "listing",
    "city": "Yaoundé",
    "latitude": 3.8485,
    "longitude": 11.5035,
    "images": ["https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80"]
  }'
echo " Indexed Donuts Family"

# 3. CHU de Yaoundé (Un peu plus loin) - Hôpital
curl -X POST $API_URL   -H "Content-Type: application/json"   -d '{
    "name": "CHU de Yaoundé",
    "description": "Centre Hospitalier Universitaire. Urgences et consultations générales.",
    "price": 0,
    "category": "Santé",
    "type": "listing",
    "city": "Yaoundé",
    "latitude": 3.8440,
    "longitude": 11.5000,
    "images": ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80"]
  }'
echo " Indexed CHU"

# 4. Total Energies Melen (Station Service)
curl -X POST $API_URL   -H "Content-Type: application/json"   -d '{
    "name": "Station Total Melen",
    "description": "Station service, boutique et entretien véhicules.",
    "price": 0,
    "category": "Automobile",
    "type": "listing",
    "city": "Yaoundé",
    "latitude": 3.8460,
    "longitude": 11.5015,
    "images": ["https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80"]
  }'
echo " Indexed Station Total"

echo "Done! Data indexed."
