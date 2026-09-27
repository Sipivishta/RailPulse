from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from ntes import NTESClient


app = Flask(__name__)
CORS(app)

client = NTESClient(timeout=15, retries=2)


@app.get("/health")
def health():
    return jsonify({
        "success": True,
        "service": "ntes-service",
        "status": "running"
    })


@app.get("/station/<station_code>")
def station_live(station_code):
    station_code = station_code.strip().upper()

    if not station_code:
        return jsonify({
            "success": False,
            "error": "Station code is required"
        }), 400

    try:
        result = client.station_live(station_code, hours=4)

        return jsonify({
            "success": True,
            "provider": "NTES",
            "station": station_code,
            "data": result
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "provider": "NTES",
            "station": station_code,
            "error": str(error)
        }), 502


@app.get("/train/<train_number>")
def train_live(train_number):
    train_number = train_number.strip()

    if not train_number.isdigit():
        return jsonify({
            "success": False,
            "error": "Train number must contain only digits"
        }), 400

    if len(train_number) != 5:
        return jsonify({
            "success": False,
            "error": "Train number must be 5 digits"
        }), 400

    # Allow an explicit journey date:
    # /train/12919?date=27-Sep-2026
    journey_date = request.args.get("date", "").strip()

    if not journey_date:
        journey_date = datetime.now().strftime("%d-%b-%Y")

    try:
        result = client.live_status(
            train_number,
            journey_date
        )

        return jsonify({
            "success": True,
            "provider": "NTES",
            "trainNumber": train_number,
            "journeyDate": journey_date,
            "data": result
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "provider": "NTES",
            "trainNumber": train_number,
            "journeyDate": journey_date,
            "error": str(error)
        }), 502


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )